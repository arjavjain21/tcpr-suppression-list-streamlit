/**
 * Dashboard Component
 * Main dashboard with metrics, charts, and recent activity
 */

import { useState, useEffect } from 'react'
import { Loader2, TrendingUp, Users, Calendar, Activity, Plus, Database } from 'lucide-react'
import { supabase, type LeadEventWithDetails, type Setter, type LeadType } from '../../lib/supabase'
import MetricCard from './MetricCard'
import LeadTypeChart from './LeadTypeChart'
import EntityTypeChart from './EntityTypeChart'
import TrendChart from './TrendChart'
import RecentActivity from './RecentActivity'

interface DashboardProps {
  onAddNew?: () => void
  onViewAllRecords?: () => void
}

interface DashboardMetrics {
  totalRecords: number
  todayRecords: number
  weekRecords: number
  monthRecords: number
  activeSetters: number
}

export default function Dashboard({ onAddNew, onViewAllRecords }: DashboardProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalRecords: 0,
    todayRecords: 0,
    weekRecords: 0,
    monthRecords: 0,
    activeSetters: 0,
  })
  const [recentEvents, setRecentEvents] = useState<LeadEventWithDetails[]>([])
  const [leadTypeData, setLeadTypeData] = useState<{ label: string; count: number; percentage: number }[]>([])
  const [entityTypeData, setEntityTypeData] = useState<{ type: string; count: number; percentage: number }[]>([])
  const [trendData, setTrendData] = useState<{ date: string; count: number }[]>([])

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get today's date ranges
      const now = new Date()
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

      // Parallel queries for better performance
      const [
        totalResult,
        todayResult,
        weekResult,
        monthResult,
        settersResult,
        recentResult,
        leadTypesResult,
        entitiesResult,
      ] = await Promise.all([
        // Total records count
        supabase.from('lead_events').select('id', { count: 'exact', head: true }),

        // Today's records
        supabase
          .from('lead_events')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', todayStart),

        // This week's records
        supabase
          .from('lead_events')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', weekAgo),

        // This month's records
        supabase
          .from('lead_events')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', monthStart),

        // Active setters count
        supabase
          .from('setters')
          .select('id', { count: 'exact', head: true })
          .eq('active', true),

        // Recent 10 events with relationships
        supabase
          .from('lead_events')
          .select(`
            *,
            lead_entity:lead_entities(*),
            setter:setters(*)
          `)
          .order('created_at', { ascending: false })
          .limit(10),

        // All lead types for breakdown
        supabase.from('lead_types').select('id, label').eq('active', true),

        // Entity type breakdown
        supabase.from('lead_entities').select('entity_type'),
      ])

      if (totalResult.error) throw totalResult.error
      if (todayResult.error) throw todayResult.error
      if (weekResult.error) throw weekResult.error
      if (monthResult.error) throw monthResult.error
      if (settersResult.error) throw settersResult.error
      if (recentResult.error) throw recentResult.error
      if (leadTypesResult.error) throw leadTypesResult.error
      if (entitiesResult.error) throw entitiesResult.error

      // Set metrics
      setMetrics({
        totalRecords: totalResult.count || 0,
        todayRecords: todayResult.count || 0,
        weekRecords: weekResult.count || 0,
        monthRecords: monthResult.count || 0,
        activeSetters: settersResult.count || 0,
      })

      // Enrich recent events with lead_type
      const enrichedRecent = await Promise.all(
        (recentResult.data || []).map(async (event) => {
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
      setRecentEvents(enrichedRecent)

      // Calculate lead type breakdown
      const leadTypeCounts: Record<string, number> = {}
      const totalEvents = metrics.totalRecords || 1

      // Get counts per lead type
      for (const lt of leadTypesResult.data || []) {
        const { count } = await supabase
          .from('lead_events')
          .select('id', { count: 'exact', head: true })
          .eq('lead_type_id', lt.id)

        leadTypeCounts[lt.label] = count || 0
      }

      setLeadTypeData(
        Object.entries(leadTypeCounts)
          .map(([label, count]) => ({
            label,
            count,
            percentage: Math.round((count / totalEvents) * 100),
          }))
          .sort((a, b) => b.count - a.count)
      )

      // Calculate entity type breakdown
      const entityCounts = { email: 0, domain: 0 }
      for (const entity of entitiesResult.data || []) {
        if (entity.entity_type === 'email') {
          entityCounts.email++
        } else {
          entityCounts.domain++
        }
      }

      const totalEntities = entityCounts.email + entityCounts.domain || 1
      setEntityTypeData([
        {
          type: 'email',
          count: entityCounts.email,
          percentage: Math.round((entityCounts.email / totalEntities) * 100),
        },
        {
          type: 'domain',
          count: entityCounts.domain,
          percentage: Math.round((entityCounts.domain / totalEntities) * 100),
        },
      ])

      // Calculate 7-day trend
      const trendPromises = []
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
        const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString()
        const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1).toISOString()

        trendPromises.push(
          supabase
            .from('lead_events')
            .select('id', { count: 'exact', head: true })
            .gte('created_at', dayStart)
            .lt('created_at', dayEnd)
            .then((result) => ({
              date: dayStart,
              count: result.count || 0,
            }))
        )
      }

      const trendResults = await Promise.all(trendPromises)
      setTrendData(trendResults)
    } catch (err) {
      console.error('Error loading dashboard data:', err)
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
          <p className="text-sm text-text-muted">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadDashboardData}
            className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-hover transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Overview of lead suppression activity</p>
        </div>
        <div className="flex gap-2">
          {onAddNew && (
            <button
              onClick={onAddNew}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-hover rounded-lg transition-colors duration-200"
            >
              <Plus className="h-4 w-4" />
              Add New
            </button>
          )}
          {onViewAllRecords && (
            <button
              onClick={onViewAllRecords}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              <Database className="h-4 w-4" />
              View All Records
            </button>
          )}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Records"
          value={metrics.totalRecords}
          icon={Activity}
        />
        <MetricCard
          title="Today"
          value={metrics.todayRecords}
          icon={Calendar}
          trend={{
            value: 0,
            isPositive: true,
          }}
        />
        <MetricCard
          title="This Week"
          value={metrics.weekRecords}
          icon={TrendingUp}
        />
        <MetricCard
          title="This Month"
          value={metrics.monthRecords}
          icon={Users}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LeadTypeChart data={leadTypeData} loading={loading} />
        <EntityTypeChart data={entityTypeData} loading={loading} />
      </div>

      {/* Trend Chart */}
      <TrendChart data={trendData} loading={loading} />

      {/* Recent Activity */}
      <RecentActivity
        events={recentEvents}
        loading={loading}
        onViewAll={onViewAllRecords}
      />

      {/* Active Setters Badge */}
      {metrics.activeSetters > 0 && (
        <div className="flex items-center gap-2 text-sm text-text-muted">
          <Users className="h-4 w-4" />
          <span>{metrics.activeSetters} active setter{metrics.activeSetters !== 1 ? 's' : ''}</span>
        </div>
      )}
    </div>
  )
}
