/**
 * CSV Export utility
 * Exports lead events data to CSV format with proper escaping
 */

import type { LeadEventWithDetails } from './supabase'

export interface ExportRow {
  created_at: string
  entity_type: string
  email: string | null
  domain: string
  lead_type: string
  setter: string | null
  source: string
  notes: string | null
}

/**
 * Convert lead event to export row
 */
export function leadEventToExportRow(event: LeadEventWithDetails): ExportRow {
  return {
    created_at: new Date(event.created_at).toLocaleString(),
    entity_type: event.lead_entity.entity_type,
    email: event.lead_entity.email,
    domain: event.lead_entity.domain,
    lead_type: event.lead_type.label,
    setter: event.setter?.name || null,
    source: event.source,
    notes: event.notes
  }
}

/**
 * Escape CSV field value
 * Wraps in quotes if contains comma, quote, or newline
 */
function escapeCsvField(value: string | null | undefined): string {
  if (value == null) {
    return ''
  }

  const stringValue = String(value)

  // If contains comma, quote, newline, or starts/ends with space, wrap in quotes and escape quotes
  if (
    stringValue.includes(',') ||
    stringValue.includes('"') ||
    stringValue.includes('\n') ||
    stringValue.includes('\r') ||
    stringValue.trim() !== stringValue
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`
  }

  return stringValue
}

/**
 * Convert row to CSV line
 */
function rowToCsvLine(row: ExportRow): string {
  const fields = [
    escapeCsvField(row.created_at),
    escapeCsvField(row.entity_type),
    escapeCsvField(row.email),
    escapeCsvField(row.domain),
    escapeCsvField(row.lead_type),
    escapeCsvField(row.setter),
    escapeCsvField(row.source),
    escapeCsvField(row.notes)
  ]

  return fields.join(',')
}

/**
 * Generate CSV header
 */
function getCsvHeader(): string {
  const headers = [
    'Created At',
    'Entity Type',
    'Email',
    'Domain',
    'Lead Type',
    'Setter',
    'Source',
    'Notes'
  ]

  return headers.join(',')
}

/**
 * Export lead events to CSV string
 */
export function exportToCsv(events: LeadEventWithDetails[]): string {
  const rows = events.map(leadEventToExportRow)
  const lines = rows.map(rowToCsvLine)

  return [getCsvHeader(), ...lines].join('\n')
}

/**
 * Trigger CSV download in browser
 */
export function downloadCsv(events: LeadEventWithDetails[], filename: string = 'lead-events.csv'): void {
  const csv = exportToCsv(events)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.display = 'none'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}
