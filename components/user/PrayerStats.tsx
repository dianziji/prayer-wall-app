'use client'

import useSWR from 'swr'
import { createBrowserSupabase } from '@/lib/supabase-browser'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BarChart3, RefreshCw, Loader2, MessageSquare, Heart, Users, TrendingUp } from 'lucide-react'

interface UserStats {
  totalPrayers: number
  totalLikes: number
  totalComments: number
  mostActiveWeek: string
  recentActivity: number[]
}

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  isLoading?: boolean
}

function StatCard({ title, value, icon, isLoading }: StatCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4 text-center">
          <div className="w-6 h-6 bg-gray-300 rounded mx-auto mb-2 animate-pulse"></div>
          <div className="h-3 bg-gray-300 rounded mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-300 rounded animate-pulse"></div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4 text-center">
        <div className="flex justify-center mb-2">{icon}</div>
        <div className="text-xs text-muted-foreground mb-1">{title}</div>
        <div className="text-lg font-semibold text-foreground">{value}</div>
      </CardContent>
    </Card>
  )
}

// Fetcher function for SWR
const fetcher = async (url: string): Promise<UserStats> => {
  const supabase = createBrowserSupabase()
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    throw new Error('Please login to view your statistics')
  }

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  return response.json()
}

export default function PrayerStats() {
  const { data: stats, error, isLoading, mutate } = useSWR<UserStats>('/api/user/stats', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    refreshInterval: 0, // Don't auto-refresh
    errorRetryCount: 2,
    errorRetryInterval: 2000
  })

  const handleRefresh = () => {
    mutate() // SWR refresh
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Prayer Statistics
            </CardTitle>
            <Button 
              onClick={handleRefresh}
              disabled={isLoading}
              size="sm"
              variant="outline"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">{error.message || 'Failed to load statistics'}</p>
            <Button 
              onClick={handleRefresh}
              disabled={isLoading}
              className="mt-4"
            >
              {isLoading ? 'Loading...' : 'Try Again'}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Prayer Statistics
          </CardTitle>
          <Button 
            onClick={handleRefresh}
            disabled={isLoading}
            size="sm"
            variant="outline"
            title="Refresh statistics"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="Total Prayers"
            value={stats?.totalPrayers ?? 0}
            icon={<Users className="w-5 h-5 text-blue-600" />}
            isLoading={isLoading}
          />
          <StatCard
            title="Total Likes"
            value={stats?.totalLikes ?? 0}
            icon={<Heart className="w-5 h-5 text-red-600" />}
            isLoading={isLoading}
          />
          <StatCard
            title="Total Comments"
            value={stats?.totalComments ?? 0}
            icon={<MessageSquare className="w-5 h-5 text-green-600" />}
            isLoading={isLoading}
          />
          <StatCard
            title="Most Active Week"
            value={stats?.mostActiveWeek ?? 'N/A'}
            icon={<TrendingUp className="w-5 h-5 text-purple-600" />}
            isLoading={isLoading}
          />
        </div>
      </CardContent>
    </Card>
  )
}