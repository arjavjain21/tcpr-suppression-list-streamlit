/**
 * CSV Parser Utility
 * Handles CSV file parsing using PapaParse
 */

import Papa from 'papaparse'
import { CsvRow } from './types/csv'

export interface ParseResult {
  data: CsvRow[]
  errors: Array<{ row: number; message: string }>
  meta: Papa.ParseMeta
}

/**
 * Parse a CSV file and return structured data
 * @param file - The CSV file to parse
 * @returns Promise resolving to parsed CSV data
 */
export async function parseCsvFile(file: File): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    const errors: Array<{ row: number; message: string }> = []
    let rowNumber = 0

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      trimHeaders: true,
      dynamicTyping: false, // Keep all values as strings for consistent validation
      step: (row) => {
        rowNumber++
        const data = row.data as Record<string, string>
        const errorsArray = row.errors

        // Collect PapaParse errors
        errorsArray.forEach((error) => {
          errors.push({
            row: rowNumber,
            message: error.message,
          })
        })
      },
      complete: (results) => {
        const data = results.data as CsvRow[]

        // Filter out any rows that might have parsing errors
        const validData = data.filter((row) => {
          // Ensure required fields exist (even if empty)
          return 'email_or_domain' in row && 'source' in row && 'lead_type' in row
        })

        resolve({
          data: validData,
          errors,
          meta: results.meta,
        })
      },
      error: (error) => {
        reject(new Error(`CSV parsing failed: ${error.message}`))
      },
    })
  })
}

/**
 * Validate CSV file type and size before parsing
 * @param file - The file to validate
 * @returns Object with isValid flag and error message
 */
export function validateCsvFile(file: File): { isValid: boolean; error?: string } {
  // Check file type
  const validTypes = ['text/csv', 'application/vnd.ms-excel']
  const fileExtension = file.name.toLowerCase().split('.').pop()

  if (!validTypes.includes(file.type) && fileExtension !== 'csv') {
    return {
      isValid: false,
      error: 'Invalid file type. Please upload a CSV file.',
    }
  }

  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'File size exceeds 10MB limit. Please split your file into smaller chunks.',
    }
  }

  // Check if file is empty
  if (file.size === 0) {
    return {
      isValid: false,
      error: 'File is empty. Please upload a file with data.',
    }
  }

  return { isValid: true }
}

/**
 * Get CSV template as a string
 * @returns CSV template content with instructions
 */
export function getCsvTemplate(): string {
  const headers = ['email_or_domain', 'source', 'lead_type', 'notes', 'setter_email']
  const exampleRows = [
    ['user@example.com', 'Campaign Name', 'Prospect', 'Initial outreach from website', 'setter@example.com'],
    ['anothercompany.com', 'Trade Show 2024', 'Partner', 'Met at conference', 'setter@example.com'],
    ['test@domain.org', 'Cold Outreach', 'Suspect', 'From purchased list', ''],
    ['targetcorp.com', 'Referral', 'Prospect', 'Referred by existing client', 'setter@example.com'],
  ]

  const instructionLines = [
    '# TCPR Suppression Lists - CSV Import Template',
    '# Instructions:',
    '# 1. Download this file and open in Excel/Google Sheets',
    '# 2. Fill in your data following the column headers below',
    '# 3. Required columns: email_or_domain, source, lead_type',
    '# 4. Optional columns: notes, setter_email',
    '# 5. Save as CSV (not Excel) and upload',
    '#',
    '# Column Guide:',
    '# - email_or_domain: Email address (user@example.com) or domain (example.com)',
    '# - source: Source/campaign name (e.g., "Trade Show 2024", "Cold Outreach")',
    '# - lead_type: Type of lead (must match your configured types)',
    '# - notes: Optional notes about this contact',
    '# - setter_email: Optional setter email (must match existing setter)',
    '#',
  ]

  return [
    ...instructionLines,
    headers.join(','),
    ...exampleRows.map((row) => row.join(',')),
  ].join('\n')
}

/**
 * Download CSV template file
 */
export function downloadCsvTemplate(): void {
  const csvContent = getCsvTemplate()
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', 'tcpr_import_template.csv')
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}
