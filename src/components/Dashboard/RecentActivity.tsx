/**
 * RecentActivity Component
 * Mini table showing the last 10 recent lead events
 */

import { Clock, User, Mail, Globe } from 'lucide-react'
import type { LeadEventWithDetails } from '../../lib/supabase'

interface RecentActivityProps {
  events: LeadEventWithDetails[]
  loading?: boolean
  onViewAll?: () => void
}

export default function RecentActivity({
  events,
  loading = false,
  onViewAll
}: RecentActivityProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="space-y-4">
          {/* Header skeleton */}
          <div className="h-6 bg-gray-200 rounded animate-pulse w-40" />
          {/* Table skeleton */}
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded animate-pulse">
                <div className="h-4 w-20 bg-gray-200 rounded" />
                <div className="flex-1 h-4 bg-gray-200 rounded" />
                <div className="h-4 w-16 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="text-center py-12">
          <Clock className="h-12 w-12 text-text-muted mx-auto mb-3" />
          <p className="text-sm text-text-muted">No recent activity</p>
        </div>
      </div>
    )
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 60) {
      return `${diffMins}m ago`
    } else if (diffHours < 24) {
      return `${diffHours}h ago`
    } else if (diffDays < 7) {
      return `${diffDays}d ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        <span className="text-xs text-text-muted">Last 10 records</span>
      </div>

      <div className="space-y-2">
        {events.slice(0, 10).map((event) => (
          <div
            key={event.id}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-bg-subtle transition-colors duration-150"
          >
            {/* Entity Type Icon */}
            <div className="flex-shrink-0">
              {event.lead_entity.entity_type === 'email' ? (
                <div className="h-8 w-8 rounded-full bg-accent-light flex items-center justify-center">
                  <Mail className="h-4 w-4 text-accent" />
                </div>
              ) : (
                <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                  <Globe className="h-4 w-4 text-purple-600" />
                </div>
              )}
            </div>

            {/* Entity Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {event.lead_entity.email || event.lead_entity.domain}
              </p>
              <p className="text-xs text-text-muted truncate">
                {event.lead_type.label}
              </p>
            </div>

            {/* Setter */}
            {event.setter && (
              <div className="flex items-center gap-1 text-xs text-text-muted">
                <User className="h-3 w-3" />
                <span className="truncate max-w-20">{event.setter.name}</span>
              </div>
            )}

            {/* Time */}
            <div className="flex-shrink-0 text-xs text-text-muted">
              {formatTime(event.created_at)}
            </div>
          </div>
        ))}
      </div>

      {/* View All Button */}
      {onViewAll && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={onViewAll}
            className="w-full text-sm font-medium text-accent hover:text-accent-hover transition-colors duration-150"
          >
            View All Records →
          </button>
        </div>
      )}
    </div>
  )
}
