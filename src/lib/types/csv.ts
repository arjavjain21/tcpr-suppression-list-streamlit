/**
 * CSV Import Type Definitions
 * Types for CSV parsing, validation, and import processing
 */

/**
 * Raw CSV row as parsed from the file
 * Maps to the CSV template structure
 */
export interface CsvRow {
  email_or_domain: string
  source: string
  lead_type: string
  notes?: string
  setter_email?: string
}

/**
 * Validated and processed CSV row
 * Ready for database insertion
 */
export interface ValidatedRow {
  rowNumber: number
  email_or_domain: string
  entity_type: 'email' | 'domain'
  source: string
  lead_type_id: string | null
  notes: string | null
  setter_id: string | null
  errors: string[]
  warnings: string[]
  isValid: boolean
}

/**
 * Validation result for the entire CSV
 */
export interface ValidationResult {
  totalRows: number
  validRows: number
  invalidRows: number
  warningRows: number
  rows: ValidatedRow[]
  hasErrors: boolean
}

/**
 * Import result after database processing
 */
export interface ImportResult {
  totalRows: number
  successfulImports: number
  failedImports: number
  skippedRows: number
  importedIds: string[]
  errors: Array<{
    rowNumber: number
    error: string
  }>
  duration: number
}

/**
 * Import configuration
 */
export interface ImportConfig {
  batchSize?: number
  continueOnError?: boolean
  dryRun?: boolean
}

/**
 * Available CSV sources
 */
export const CSV_SOURCES = {
  UI_IMPORT: 'ui_import',
  CSV_BULK_IMPORT: 'csv_bulk_import',
} as const

export type CsvSource = (typeof CSV_SOURCES)[keyof typeof CSV_SOURCES]

/**
 * CSV validation errors
 */
export const VALIDATION_ERRORS = {
  MISSING_REQUIRED_FIELD: 'Missing required field',
  INVALID_EMAIL: 'Invalid email format',
  INVALID_DOMAIN: 'Invalid domain format',
  INVALID_LEAD_TYPE: 'Invalid lead type',
  INVALID_SOURCE: 'Invalid source',
  SETTER_NOT_FOUND: 'Setter not found',
  EMPTY_VALUE: 'Value cannot be empty',
} as const

/**
 * CSV validation warnings
 */
export const VALIDATION_WARNINGS = {
  MISSING_SETTER: 'No setter assigned',
  MISSING_NOTES: 'No notes provided',
  AUTO_DETECTED_EMAIL: 'Auto-detected as email',
  AUTO_DETECTED_DOMAIN: 'Auto-detected as domain',
} as const
