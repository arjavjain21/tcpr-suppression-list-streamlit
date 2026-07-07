/**
 * Import Service
 * Handles bulk import of validated CSV rows into the database
 */

import { ValidatedRow, ImportResult, ImportConfig, CsvSource } from './types/csv'
import { supabase } from './supabase'

/**
 * Default import configuration
 */
const DEFAULT_CONFIG: ImportConfig = {
  batchSize: 100,
  continueOnError: true,
  dryRun: false,
}

/**
 * Import validated rows into the database
 * @param rows - Validated rows to import
 * @param source - The source identifier (ui_import or csv_bulk_import)
 * @param userId - The user ID performing the import
 * @param config - Import configuration options
 * @returns Import result with statistics and imported IDs
 */
export async function importRows(
  rows: ValidatedRow[],
  source: CsvSource,
  userId: string,
  config: ImportConfig = DEFAULT_CONFIG
): Promise<ImportResult> {
  const startTime = Date.now()
  const { batchSize = 100, continueOnError = true, dryRun = false } = config

  // Filter to only valid rows
  const validRows = rows.filter((row) => row.isValid)
  const totalRows = validRows.length

  let successfulImports = 0
  let failedImports = 0
  let skippedRows = 0
  const importedIds: string[] = []
  const errors: Array<{ rowNumber: number; error: string }> = []

  // Process in batches
  for (let i = 0; i < validRows.length; i += batchSize) {
    const batch = validRows.slice(i, i + batchSize)

    const batchResults = await Promise.allSettled(
      batch.map(async (row) => {
        try {
          if (dryRun) {
            return { success: true, id: `dry-run-${row.rowNumber}` }
          }

          // Check if lead entity already exists
          const { data: existingEntity } = await supabase
            .from('lead_entities')
            .select('id')
            .eq('entity_type', row.entity_type)
            .eq(
              row.entity_type === 'email' ? 'email' : 'domain',
              row.email_or_domain
            )
            .limit(1)
            .single()

          let entityId: string

          if (existingEntity) {
            entityId = existingEntity.id
          } else {
            // Create new lead entity
            const { data: newEntity, error: entityError } = await supabase
              .from('lead_entities')
              .insert({
                entity_type: row.entity_type,
                [row.entity_type === 'email' ? 'email' : 'domain']:
                  row.email_or_domain,
              })
              .select('id')
              .single()

            if (entityError) throw entityError
            entityId = newEntity.id
          }

          // Create lead event
          const { data: newEvent, error: eventError } = await supabase
            .from('lead_events')
            .insert({
              lead_entity_id: entityId,
              lead_type_id: row.lead_type_id,
              setter_id: row.setter_id,
              raw_input: row.email_or_domain,
              notes: row.notes,
              source: row.source,
              created_by: userId,
            })
            .select('id')
            .single()

          if (eventError) throw eventError

          return { success: true, id: newEvent.id }
        } catch (error) {
          throw error
        }
      })
    )

    // Process batch results
    batchResults.forEach((result, index) => {
      const row = batch[index]

      if (result.status === 'fulfilled') {
        successfulImports++
        importedIds.push(result.value.id)
      } else {
        failedImports++
        errors.push({
          rowNumber: row.rowNumber,
          error: result.reason instanceof Error ? result.reason.message : String(result.reason),
        })

        if (!continueOnError) {
          throw new Error(`Import failed at row ${row.rowNumber}: ${errors[errors.length - 1].error}`)
        }
      }
    })
  }

  const duration = Date.now() - startTime

  return {
    totalRows,
    successfulImports,
    failedImports,
    skippedRows,
    importedIds,
    errors,
    duration,
  }
}

/**
 * Get import statistics for a user
 * @param userId - The user ID to get statistics for
 * @returns Import statistics
 */
export async function getImportStats(userId: string) {
  const { data, error } = await supabase
    .from('lead_events')
    .select('id, created_at')
    .eq('created_by', userId)
    .order('created_at', { ascending: false })

  if (error) throw error

  const totalImports = data?.length || 0
  const recentImports = data?.slice(0, 10).map((event) => ({
    id: event.id,
    created_at: event.created_at,
  }))

  return {
    totalImports,
    recentImports,
  }
}

/**
 * Check if an import can be performed (rate limiting, etc.)
 * @param userId - The user ID to check
 * @returns Object with canImport flag and reason
 */
export async function canImport(userId: string): Promise<{
  canImport: boolean
  reason?: string
  remainingQuota?: number
}> {
  // Simple rate limiting: max 1000 imports per day
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const { count, error } = await supabase
    .from('lead_events')
    .select('id', { count: 'exact', head: true })
    .eq('created_by', userId)
    .gte('created_at', oneDayAgo)

  if (error) {
    return {
      canImport: true,
    }
  }

  const dailyLimit = 1000
  const remainingQuota = dailyLimit - (count || 0)

  if (remainingQuota <= 0) {
    return {
      canImport: false,
      reason: 'Daily import limit reached. Please try again tomorrow.',
      remainingQuota: 0,
    }
  }

  return {
    canImport: true,
    remainingQuota,
  }
}
