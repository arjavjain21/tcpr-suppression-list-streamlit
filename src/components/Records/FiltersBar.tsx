/**
 * FiltersBar Component
 * Search and filter UI for the Records component
 */

import { Search, Download, Filter } from 'lucide-react'
import type { Setter, LeadType } from '../../lib/supabase'

interface FiltersBarProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  leadTypeFilter: string
  onLeadTypeFilterChange: (value: string) => void
  setterFilter: string
  onSetterFilterChange: (value: string) => void
  leadTypes: LeadType[]
  setters: Setter[]
  filteredCount: number
  totalCount: number
  onExport: () => void
}

export default function FiltersBar({
  searchQuery,
  onSearchChange,
  leadTypeFilter,
  onLeadTypeFilterChange,
  setterFilter,
  onSetterFilterChange,
  leadTypes,
  setters,
  filteredCount,
  totalCount,
  onExport,
}: FiltersBarProps) {
  return (
    <div className="bg-white shadow rounded-lg p-4 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="h-5 w-5 text-gray-500" />
        <h3 className="text-sm font-medium text-gray-700">Filters</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search */}
        <div>
          <label htmlFor="search" className="block text-xs font-medium text-gray-700 mb-1">
            Search Email/Domain
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              id="search"
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200"
              placeholder="Search..."
            />
          </div>
        </div>

        {/* Lead Type Filter */}
        <div>
          <label htmlFor="lead-type-filter" className="block text-xs font-medium text-gray-700 mb-1">
            Lead Type
          </label>
          <select
            id="lead-type-filter"
            value={leadTypeFilter}
            onChange={(e) => onLeadTypeFilterChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200"
          >
            <option value="">All Types</option>
            {leadTypes.map((lt) => (
              <option key={lt.id} value={lt.id}>
                {lt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Setter Filter */}
        <div>
          <label htmlFor="setter-filter" className="block text-xs font-medium text-gray-700 mb-1">
            Setter
          </label>
          <select
            id="setter-filter"
            value={setterFilter}
            onChange={(e) => onSetterFilterChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200"
          >
            <option value="">All Setters</option>
            {setters.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-between items-center mt-4">
        <p className="text-sm text-gray-600">
          Showing {filteredCount} of {totalCount} records
        </p>
        <button
          onClick={onExport}
          disabled={filteredCount === 0}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>
    </div>
  )
}
