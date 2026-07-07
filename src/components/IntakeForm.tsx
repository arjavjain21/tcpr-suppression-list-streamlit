/**
 * Intake Form Component
 * Clean lead intake form
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileText,
  Save,
  Loader2,
  Check,
  X,
  AlertCircle
} from 'lucide-react'
import { supabase, type Setter, type LeadType } from '../lib/supabase'
import { parseInputs, type ParsedInput } from '../lib/parseInputs'
import { createLogger } from '../lib/logger'

const logger = createLogger('IntakeForm')

interface IntakeFormProps {
  onSubmitSuccess?: () => void
}

export default function IntakeForm({ onSubmitSuccess }: IntakeFormProps) {
  const navigate = useNavigate()
  const [rawInput, setRawInput] = useState('')
  const [leadTypeId, setLeadTypeId] = useState('')
  const [setterId, setSetterId] = useState('')
  const [notes, setNotes] = useState('')
  const [source, setSource] = useState('manual_form')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [parsedItems, setParsedItems] = useState<ParsedInput[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [successSummary, setSuccessSummary] = useState<string | null>(null)

  const [leadTypes, setLeadTypes] = useState<LeadType[]>([])
  const [setters, setSetters] = useState<Setter[]>([])
  const [loadingOptions, setLoadingOptions] = useState(true)

  useEffect(() => {
    loadOptions()
  }, [])

  const loadOptions = async () => {
    try {
      setLoadingOptions(true)
      const [leadTypesResult, settersResult] = await Promise.all([
        supabase
          .from('lead_types')
          .select('*')
          .eq('active', true)
          .order('sort_order', { ascending: true }),
        supabase
          .from('setters')
          .select('*')
          .eq('active', true)
          .order('name', { ascending: true })
      ])

      if (leadTypesResult.error) throw leadTypesResult.error
      if (settersResult.error) throw settersResult.error

      setLeadTypes(leadTypesResult.data || [])
      setSetters(settersResult.data || [])

      if (leadTypesResult.data && leadTypesResult.data.length > 0) {
        setLeadTypeId(leadTypesResult.data[0].id)
      }
      if (settersResult.data && settersResult.data.length > 0) {
        setSetterId(settersResult.data[0].id)
      }
    } catch (err) {
      logger.error('Error loading options:', err)
      setError('Failed to load form options')
    } finally {
      setLoadingOptions(false)
    }
  }

  const handleParse = () => {
    if (!rawInput.trim()) {
      setError('Please enter emails or domains')
      return
    }

    const result = parseInputs(rawInput)
    setParsedItems(result.items)
    setShowPreview(true)
    setError(null)
    setSuccessSummary(null)
  }

  const handleSubmit = async () => {
    const validItems = parsedItems.filter(p => p.status === 'valid')

    if (validItems.length === 0) {
      setError('No valid items to submit')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setError('You must be logged in to submit leads')
        setLoading(false)
        return
      }

      let newEntitiesCount = 0
      let existingEntitiesCount = 0
      let eventsCreatedCount = 0

      for (const item of validItems) {
        let leadEntityId: string
        let existingEntity: any = null

        if (item.type === 'email' && item.email) {
          const { data } = await supabase
            .from('lead_entities')
            .select('id')
            .eq('entity_type', 'email')
            .ilike('email', item.email)
            .limit(1)
            .single()
          existingEntity = data
        } else if (item.type === 'domain' && item.domain) {
          const { data } = await supabase
            .from('lead_entities')
            .select('id')
            .eq('entity_type', 'domain')
            .ilike('domain', item.domain)
            .is('email', null)
            .limit(1)
            .single()
          existingEntity = data
        }

        if (existingEntity) {
          leadEntityId = existingEntity.id
          existingEntitiesCount++
        } else {
          const { data: newEntity, error: entityError } = await supabase
            .from('lead_entities')
            .insert({
              entity_type: item.type,
              email: item.email || null,
              domain: item.domain || ''
            })
            .select('id')
            .single()
          if (entityError) throw entityError
          leadEntityId = newEntity.id
          newEntitiesCount++
        }

        const { error: eventError } = await supabase
          .from('lead_events')
          .insert({
            lead_entity_id: leadEntityId,
            lead_type_id: leadTypeId,
            setter_id: setterId || null,
            raw_input: item.original,
            notes: notes || null,
            source,
            created_by: user.id
          })
        if (eventError) throw eventError
        eventsCreatedCount++
      }

      const invalidCount = parsedItems.filter(p => p.status === 'invalid').length
      const duplicateCount = parsedItems.filter(p => p.status === 'duplicate').length

      setSuccessSummary(
        `Successfully processed ${validItems.length} items. ` +
        `${newEntitiesCount} new entities, ${existingEntitiesCount} existing, ` +
        `${eventsCreatedCount} events created.` +
        (invalidCount || duplicateCount ? ` ${invalidCount} invalid and ${duplicateCount} duplicates skipped.` : '')
      )

      setRawInput('')
      setNotes('')
      setParsedItems([])
      setShowPreview(false)

      if (onSubmitSuccess) {
        onSubmitSuccess()
      } else {
        navigate('/records')
      }
    } catch (err) {
      logger.error('Error submitting:', err)
      setError('Failed to submit. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (loadingOptions) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Add to Suppression List</h2>
        <p className="mt-1 text-sm text-gray-600">
            Paste emails or domains to add them to your suppression list
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded flex items-start gap-2 text-sm">
            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
            <span className="text-red-700 flex-1">{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {successSummary && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded flex items-start gap-2 text-sm">
            <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <span className="text-green-700 flex-1">{successSummary}</span>
            <button
              onClick={() => setSuccessSummary(null)}
              className="text-green-600 hover:text-green-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-5">
          <div>
            <label htmlFor="emails-domains" className="block text-sm font-medium text-gray-700 mb-1.5">
              Emails or Domains
            </label>
            <textarea
              id="emails-domains"
              rows={6}
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent resize-none transition-all duration-200"
              placeholder="Paste emails or domains, separated by commas, semicolons, or new lines..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="lead-type" className="block text-sm font-medium text-gray-700 mb-1.5">
                Lead Type
              </label>
              <select
                id="lead-type"
                value={leadTypeId}
                onChange={(e) => setLeadTypeId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-all duration-200"
              >
                {leadTypes.map((lt) => (
                  <option key={lt.id} value={lt.id}>
                    {lt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="setter" className="block text-sm font-medium text-gray-700 mb-1.5">
                Setter
              </label>
              <select
                id="setter"
                value={setterId}
                onChange={(e) => setSetterId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-all duration-200"
              >
                {setters.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.email})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="source" className="block text-sm font-medium text-gray-700 mb-1.5">
                Source
              </label>
              <input
                id="source"
                type="text"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-all duration-200"
              />
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1.5">
                Notes <span className="font-normal text-gray-500">(optional)</span>
              </label>
              <input
                id="notes"
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-all duration-200"
                placeholder="Optional notes..."
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            {!showPreview ? (
              <button
                onClick={handleParse}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white font-medium rounded hover:bg-primary-hover focus:outline-none focus:ring-1 focus:ring-accent transition-all duration-200 text-sm"
              >
                <FileText className="w-4 h-4" />
                Parse & Preview
              </button>
            ) : (
              <>
                <button
                  onClick={() => setShowPreview(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 bg-white rounded hover:bg-gray-50 text-sm"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white font-medium rounded hover:bg-primary-hover focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Submit {parsedItems.filter(p => p.status === 'valid').length} Valid
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>

        {showPreview && parsedItems.length > 0 && (
          <div className="mt-6 bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Preview</h3>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-green-700">
                  {parsedItems.filter(p => p.status === 'valid').length} valid
                </span>
                <span className="text-red-700">
                  {parsedItems.filter(p => p.status === 'invalid').length} invalid
                </span>
                <span className="text-gray-600">
                  {parsedItems.filter(p => p.status === 'duplicate').length} duplicates
                </span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">
                      Original
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">
                      Type
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">
                      Email
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">
                      Domain
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {parsedItems.map((item, index) => (
                    <tr
                      key={index}
                      className={item.status === 'invalid' ? 'bg-red-50' : item.status === 'duplicate' ? 'bg-yellow-50' : ''}
                    >
                      <td className="px-4 py-2 text-gray-900">
                        {item.original}
                      </td>
                      <td className="px-4 py-2">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                          item.type === 'email'
                            ? 'bg-accent-light text-accent'
                            : 'bg-purple-100 text-purple-700'
                        }`}>
                          {item.type}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-gray-600">
                        {item.email || <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-4 py-2 text-gray-600">
                        {item.domain || <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-4 py-2">
                        {item.status === 'valid' ? (
                          <span className="text-green-700">Valid</span>
                        ) : item.status === 'invalid' ? (
                          <span className="text-red-700">{item.error || 'Invalid'}</span>
                        ) : (
                          <span className="text-gray-600">Duplicate</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
    </div>
  )
}
