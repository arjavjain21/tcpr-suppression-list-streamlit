/**
 * EntityTypeChart Component
 * Pie chart showing email vs domain entity type breakdown
 */

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip
} from 'recharts'

interface EntityTypeData {
  type: string
  count: number
  percentage: number
}

interface EntityTypeChartProps {
  data: EntityTypeData[]
  loading?: boolean
}

const COLORS = {
  email: '#6366f1', // accent
  domain: '#8b5cf6', // purple
}

const TYPE_LABELS: Record<string, string> = {
  email: 'Email',
  domain: 'Domain',
}

export default function EntityTypeChart({ data, loading = false }: EntityTypeChartProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="space-y-4">
          {/* Title skeleton */}
          <div className="h-6 bg-gray-200 rounded animate-pulse w-48" />
          {/* Chart skeleton */}
          <div className="flex items-center justify-center h-64">
            <div className="h-48 w-48 bg-gray-200 rounded-full animate-pulse" />
          </div>
          {/* Legend skeleton */}
          <div className="flex justify-center gap-8">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="h-3 w-3 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 bg-gray-200 rounded animate-pulse w-16" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Entity Type Breakdown</h3>
        <div className="text-center py-12">
          <p className="text-sm text-text-muted">No entity type data available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Entity Type Breakdown</h3>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(entry) => `${TYPE_LABELS[entry.type]}: ${entry.percentage}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="count"
            >
              {data.map((entry) => (
                <Cell
                  key={`cell-${entry.type}`}
                  fill={COLORS[entry.type as keyof typeof COLORS] || '#6366f1'}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              }}
              formatter={(value: number, name: string, props: any) => [
                `${value} (${props.payload.percentage}%)`,
                TYPE_LABELS[props.payload.type],
              ]}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value) => TYPE_LABELS[value] || value}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
