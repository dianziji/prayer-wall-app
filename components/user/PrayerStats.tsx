'use client'

import useSWR from 'swr'
import { createBrowserSupabase } from '@/lib/supabase-browser'

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
  icon: string
  isLoading?: boolean
}

function StatCard({ title, value, icon, isLoading }: StatCardProps) {
  if (isLoading) {
    return (
      <div className="bg-gray-100 rounded-lg p-4 text-center animate-pulse">
        <div className="w-8 h-8 bg-gray-300 rounded mx-auto mb-2"></div>
        <div className="h-4 bg-gray-300 rounded mb-2"></div>
        <div className="h-6 bg-gray-300 rounded"></div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 text-center hover:shadow-md transition-shadow">
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-sm text-gray-600 mb-1">{title}</div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
    </div>
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
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Prayer Statistics</h2>
          <button 
            onClick={handleRefresh}
            className="px-3 py-1 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            disabled={isLoading}
          >
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
        <div className="text-center py-8">
          <div className="text-red-500 mb-2">⚠️</div>
          <p className="text-gray-600">{error.message || 'Failed to load statistics'}</p>
          <button 
            onClick={handleRefresh}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Try Again'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Prayer Statistics</h2>
        <button 
          onClick={handleRefresh}
          className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
          disabled={isLoading}
          title="Refresh statistics"
        >
          {isLoading ? '🔄' : '↻'}
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Prayers"
          value={stats?.totalPrayers ?? 0}
          icon="🙏"
          isLoading={isLoading}
        />
        <StatCard
          title="Total Likes"
          value={stats?.totalLikes ?? 0}
          icon="💙"
          isLoading={isLoading}
        />
        <StatCard
          title="Total Comments"
          value={stats?.totalComments ?? 0}
          icon="💬"
          isLoading={isLoading}
        />
        <StatCard
          title="Most Active Week"
          value={stats?.mostActiveWeek ?? 'N/A'}
          icon="📈"
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}