"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useLocale } from '@/lib/locale-context'

interface PrayerStats {
  total_prayers: number
  prayer_types: {
    thanksgiving_only: number
    intercession_only: number
    both: number
  }
  fellowship_breakdown: {
    fellowship: string
    count: number
  }[]
  weekly_trend: {
    week_start: string
    prayer_count: number
  }[]
  top_participants: {
    author_name: string
    prayer_count: number
  }[]
}

interface PrayerStatsProps {
  weekStart: string
}

export function PrayerStats({ weekStart }: PrayerStatsProps) {
  const { t } = useLocale()
  const [stats, setStats] = useState<PrayerStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStats()
  }, [weekStart]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchStats = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/prayer-stats?week_start=${weekStart}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch stats')
      }
      
      const data = await response.json()
      setStats(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('statistics')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('statistics')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">{error || 'Failed to load statistics'}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Overview Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Week Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total Prayers</span>
            <Badge variant="secondary">{stats.total_prayers}</Badge>
          </div>
          
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Prayer Types</h4>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span>Thanksgiving Only</span>
                <span>{stats.prayer_types.thanksgiving_only}</span>
              </div>
              <div className="flex justify-between">
                <span>Intercession Only</span>
                <span>{stats.prayer_types.intercession_only}</span>
              </div>
              <div className="flex justify-between">
                <span>Both Types</span>
                <span>{stats.prayer_types.both}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fellowship Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Fellowship Participation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {stats.fellowship_breakdown.map((item) => (
              <div key={item.fellowship} className="flex items-center justify-between">
                <span className="text-sm capitalize">{item.fellowship}</span>
                <Badge variant="outline">{item.count}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Participants */}
      <Card>
        <CardHeader>
          <CardTitle>Top Participants</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {stats.top_participants.slice(0, 5).map((participant, index) => (
              <div key={participant.author_name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">#{index + 1}</span>
                  <span className="text-sm">{participant.author_name}</span>
                </div>
                <Badge variant="secondary">{participant.prayer_count}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Weekly Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Weeks Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {stats.weekly_trend.slice(0, 4).map((week) => (
              <div key={week.week_start} className="flex items-center justify-between text-sm">
                <span>{week.week_start}</span>
                <span className="text-muted-foreground">{week.prayer_count} prayers</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}