/**
 * MetricCard Component
 * Reusable metric card for displaying key metrics with optional trend indicators
 */

import { LucideIcon } from 'lucide-react'

interface MetricCardProps {
  title: string
  value: string | number
  trend?: {
    value: number
    isPositive: boolean
  }
  icon?: LucideIcon
  loading?: boolean
}

export default function MetricCard({
  title,
  value,
  trend,
  icon: Icon,
  loading = false
}: MetricCardProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 animate-fade-in">
        <div className="space-y-3">
          {/* Icon skeleton */}
          <div className="h-10 w-10 bg-gray-200 rounded-lg animate-pulse" />
          {/* Value skeleton */}
          <div className="h-8 bg-gray-200 rounded animate-pulse w-24" />
          {/* Title skeleton */}
          <div className="h-4 bg-gray-200 rounded animate-pulse w-32" />
          {/* Trend skeleton */}
          <div className="h-4 bg-gray-200 rounded animate-pulse w-20" />
        </div>
      </div>
    )
  }

  const formattedValue = typeof value === 'number' ? value.toLocaleString() : value

  return (
    <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow duration-200 animate-fade-in">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Icon */}
          {Icon && (
            <div className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-accent-light text-accent mb-3">
              <Icon className="h-5 w-5" />
            </div>
          )}

          {/* Title */}
          <p className="text-sm font-medium text-text-muted">{title}</p>

          {/* Value */}
          <p className="text-2xl font-semibold text-gray-900 mt-1">{formattedValue}</p>

          {/* Trend */}
          {trend && (
            <div className="flex items-center mt-2">
              <span
                className={`inline-flex items-center text-xs font-medium ${
                  trend.isPositive ? 'text-success' : 'text-error'
                }`}
              >
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
              <span className="text-xs text-text-muted ml-1">vs last period</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
