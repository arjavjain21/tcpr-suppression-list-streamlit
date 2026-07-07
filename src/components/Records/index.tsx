/**
 * Records Component
 * Displays recent lead events with filtering and CSV export
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { supabase, type LeadEventWithDetails, type Setter, type LeadType } from '../../lib/supabase'
import { downloadCsv } from '../../lib/exportCsv'
import { createLogger } from '../../lib/logger'
import FiltersBar from './FiltersBar'
import RecordsTable from './RecordsTable'

const logger = createLogger('Records')

interface RecordsProps {
  onAddNew?: () => void
}

export default function Records({ onAddNew }: RecordsProps) {
  const navigate = useNavigate()
  const [events, setEvents] = useState<LeadEventWithDetails[]>([])
  const [filteredEvents, setFilteredEvents] = useState<LeadEventWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [leadTypeFilter, setLeadTypeFilter] = useState<string>('')
  const [setterFilter, setSetterFilter] = useState<string>('')

  // Options for filters
  const [leadTypes, setLeadTypes] = useState<LeadType[]>([])
  const [setters, setSetters] = useState<Setter[]>([])

  useEffect(() => {
    loadEvents()
    loadFilterOptions()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [events, searchQuery, leadTypeFilter, setterFilter])

  const loadEvents = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch lead_events with only the working relationships
      const { data, error } = await supabase
        .from('lead_events')
        .select(`
          *,
          lead_entity:lead_entities(*),
          setter:setters(*)
        `)
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error

      // Enrich with lead_type data separately
      const enrichedEvents = await Promise.all(
        (data || []).map(async (event) => {
          let leadType = null
          if (event.lead_type_id) {
            const { data: typeData } = await supabase
              .from('lead_types')
              .select('*')
              .eq('id', event.lead_type_id)
              .single()
            leadType = typeData
          }
          return { ...event, lead_type: leadType }
        })
      )

      setEvents(enrichedEvents)
      setFilteredEvents(enrichedEvents)
    } catch (err) {
      logger.error('Error loading events:', err)
      setError('Failed to load records')
    } finally {
      setLoading(false)
    }
  }

  const loadFilterOptions = async () => {
    try {
      const [leadTypesResult, settersResult] = await Promise.all([
        supabase.from('lead_types').select('*').eq('active', true).order('sort_order'),
        supabase.from('setters').select('*').eq('active', true).order('name')
      ])

      if (leadTypesResult.error) throw leadTypesResult.error
      if (settersResult.error) throw settersResult.error

      setLeadTypes(leadTypesResult.data || [])
      setSetters(settersResult.data || [])
    } catch (err) {
      logger.error('Error loading filter options:', err)
    }
  }

  const applyFilters = () => {
    let filtered = [...events]

    // Search filter (client-side)
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((event) => {
        const email = event.lead_entity.email?.toLowerCase() || ''
        const domain = event.lead_entity.domain?.toLowerCase() || ''
        return email.includes(query) || domain.includes(query)
      })
    }

    // Lead type filter
    if (leadTypeFilter) {
      filtered = filtered.filter((event) => event.lead_type_id === leadTypeFilter)
    }

    // Setter filter
    if (setterFilter) {
      filtered = filtered.filter((event) => event.setter_id === setterFilter)
    }

    setFilteredEvents(filtered)
  }

  const handleExport = () => {
    downloadCsv(filteredEvents, 'lead-events.csv')
  }

  const handleAddNew = () => {
    if (onAddNew) {
      onAddNew()
    } else {
      navigate('/add-leads')
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Recent Records</h1>
          <p className="text-gray-600 mt-1">
            View and manage lead suppression records
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleAddNew}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Plus className="h-4 w-4" />
            Add New
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 mb-6">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <FiltersBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        leadTypeFilter={leadTypeFilter}
        onLeadTypeFilterChange={setLeadTypeFilter}
        setterFilter={setterFilter}
        onSetterFilterChange={setSetterFilter}
        leadTypes={leadTypes}
        setters={setters}
        filteredCount={filteredEvents.length}
        totalCount={events.length}
        onExport={handleExport}
      />

      <RecordsTable
        events={filteredEvents}
        loading={loading}
        onAddNew={onAddNew}
      />
    </div>
  )
}
