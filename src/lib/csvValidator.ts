/**
 * CSV Validator Utility
 * Validates CSV rows against business rules and database constraints
 */

import { CsvRow, ValidatedRow, ValidationResult, VALIDATION_ERRORS, VALIDATION_WARNINGS } from './types/csv'
import { supabase } from './supabase'

/**
 * Email validation regex
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Domain validation regex
 */
const DOMAIN_REGEX = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i

/**
 * Validate a single CSV row
 * @param row - The CSV row to validate
 * @param rowNumber - The row number for error reporting
 * @param availableLeadTypes - Available lead types from database
 * @param availableSetters - Available setters from database
 * @returns Validated row with errors and warnings
 */
async function validateRow(
  row: CsvRow,
  rowNumber: number,
  availableLeadTypes: Map<string, string>,
  availableSetters: Map<string, string>
): Promise<ValidatedRow> {
  const errors: string[] = []
  const warnings: string[] = []

  // Validate required field: email_or_domain
  if (!row.email_or_domain || row.email_or_domain.trim() === '') {
    errors.push(`${VALIDATION_ERRORS.MISSING_REQUIRED_FIELD}: email_or_domain`)
  }

  // Validate required field: source
  if (!row.source || row.source.trim() === '') {
    errors.push(`${VALIDATION_ERRORS.MISSING_REQUIRED_FIELD}: source`)
  }

  // Validate required field: lead_type
  if (!row.lead_type || row.lead_type.trim() === '') {
    errors.push(`${VALIDATION_ERRORS.MISSING_REQUIRED_FIELD}: lead_type`)
  }

  const trimmedEmailOrDomain = row.email_or_domain?.trim() || ''
  const trimmedSource = row.source?.trim() || ''
  const trimmedLeadType = row.lead_type?.trim() || ''

  // Determine entity type and validate format
  let entityType: 'email' | 'domain' = 'domain'

  if (trimmedEmailOrDomain) {
    const isEmail = EMAIL_REGEX.test(trimmedEmailOrDomain)
    const isDomain = DOMAIN_REGEX.test(trimmedEmailOrDomain)

    if (isEmail) {
      entityType = 'email'
    } else if (isDomain) {
      entityType = 'domain'
      warnings.push(VALIDATION_WARNINGS.AUTO_DETECTED_DOMAIN)
    } else {
      errors.push(VALIDATION_ERRORS.INVALID_EMAIL)
      errors.push(VALIDATION_ERRORS.INVALID_DOMAIN)
    }
  }

  // Validate lead_type exists in database
  const leadTypeId = availableLeadTypes.get(trimmedLeadType.toLowerCase())
  if (!leadTypeId && trimmedLeadType) {
    errors.push(`${VALIDATION_ERRORS.INVALID_LEAD_TYPE}: "${trimmedLeadType}"`)
  }

  // Validate setter_email if provided
  let setterId: string | null = null
  if (row.setter_email && row.setter_email.trim() !== '') {
    const trimmedSetterEmail = row.setter_email.trim().toLowerCase()
    setterId = availableSetters.get(trimmedSetterEmail)

    if (!setterId) {
      errors.push(`${VALIDATION_ERRORS.SETTER_NOT_FOUND}: "${row.setter_email}"`)
    }
  } else {
    warnings.push(VALIDATION_WARNINGS.MISSING_SETTER)
  }

  // Validate notes
  if (!row.notes || row.notes.trim() === '') {
    warnings.push(VALIDATION_WARNINGS.MISSING_NOTES)
  }

  return {
    rowNumber,
    email_or_domain: trimmedEmailOrDomain,
    entity_type: entityType,
    source: trimmedSource,
    lead_type_id: leadTypeId || null,
    notes: row.notes?.trim() || null,
    setter_id: setterId,
    errors,
    warnings,
    isValid: errors.length === 0,
  }
}

/**
 * Validate all CSV rows
 * @param rows - Array of CSV rows to validate
 * @returns Validation result with all validated rows
 */
export async function validateCsvRows(rows: CsvRow[]): Promise<ValidationResult> {
  // Fetch available lead types and setters from database
  const [{ data: leadTypes }, { data: setters }] = await Promise.all([
    supabase.from('lead_types').select('id, label').eq('active', true),
    supabase.from('setters').select('id, email').eq('active', true),
  ])

  // Create lookup maps for efficient validation
  const leadTypesMap = new Map<string, string>()
  leadTypes?.forEach((lt) => {
    leadTypesMap.set(lt.label.toLowerCase(), lt.id)
  })

  const settersMap = new Map<string, string>()
  setters?.forEach((setter) => {
    settersMap.set(setter.email.toLowerCase(), setter.id)
  })

  // Validate each row
  const validatedRows = await Promise.all(
    rows.map((row, index) =>
      validateRow(row, index + 1, leadTypesMap, settersMap)
    )
  )

  // Calculate statistics
  const totalRows = validatedRows.length
  const validRows = validatedRows.filter((r) => r.isValid).length
  const invalidRows = validatedRows.filter((r) => !r.isValid).length
  const warningRows = validatedRows.filter((r) => r.warnings.length > 0).length
  const hasErrors = invalidRows > 0

  return {
    totalRows,
    validRows,
    invalidRows,
    warningRows,
    rows: validatedRows,
    hasErrors,
  }
}

/**
 * Get available lead types for template reference
 * @returns Array of active lead type labels
 */
export async function getAvailableLeadTypes(): Promise<string[]> {
  const { data } = await supabase
    .from('lead_types')
    .select('label')
    .eq('active', true)
    .order('label')

  return data?.map((lt) => lt.label) || []
}

/**
 * Get available setters for template reference
 * @returns Array of active setter emails
 */
export async function getAvailableSetters(): Promise<string[]> {
  const { data } = await supabase
    .from('setters')
    .select('email')
    .eq('active', true)
    .order('email')

  return data?.map((s) => s.email) || []
}
