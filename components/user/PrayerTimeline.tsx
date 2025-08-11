'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import { createBrowserSupabase } from '@/lib/supabase-browser'
import UserPrayerCard from './UserPrayerCard'
import PrayerEditModal from './PrayerEditModal'
import PrayerExportModal from './PrayerExportModal'
import PrayerShareModal from './PrayerShareModal'
import { getCurrentWeekStartET } from '@/lib/utils'

interface Prayer {
  id: string
  content: string
  author_name: string | null
  user_id: string | null
  created_at: string | null
  like_count: number | null
  liked_by_me: boolean | null
  comment_count?: number
}

interface PaginatedResponse {
  prayers: Prayer[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

interface TimeGroupProps {
  title: string
  children: React.ReactNode
}

function TimeGroup({ title, children }: TimeGroupProps) {
  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <span>📅</span>
        {title}
      </h3>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  )
}

// Fetcher function for SWR
const fetcher = async (url: string): Promise<PaginatedResponse> => {
  const supabase = createBrowserSupabase()
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    throw new Error('Please login to view your prayers')
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

interface PrayerTimelineProps {
  initialLimit?: number
}

export default function PrayerTimeline({ initialLimit = 10 }: PrayerTimelineProps) {
  const [page, setPage] = useState(1)
  const [limit] = useState(initialLimit)
  const [sort, setSort] = useState('recent')
  const [timeRange, setTimeRange] = useState('all')
  const [allPrayers, setAllPrayers] = useState<Prayer[]>([])
  const [editingPrayer, setEditingPrayer] = useState<Prayer | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [sharingPrayer, setSharingPrayer] = useState<Prayer | null>(null)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredPrayers, setFilteredPrayers] = useState<Prayer[]>([])

  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    sort,
    timeRange
  }).toString()

  const { data, error, isLoading, mutate } = useSWR<PaginatedResponse>(
    `/api/user/prayers?${queryParams}`, 
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 0
    }
  )

  // Accumulate prayers for infinite scroll
  useEffect(() => {
    if (data?.prayers) {
      if (page === 1) {
        setAllPrayers(data.prayers)
      } else {
        setAllPrayers(prev => [...prev, ...data.prayers])
      }
    }
  }, [data, page])

  // Filter prayers based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredPrayers(allPrayers)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = allPrayers.filter(prayer => 
        prayer.content.toLowerCase().includes(query) ||
        (prayer.author_name && prayer.author_name.toLowerCase().includes(query))
      )
      setFilteredPrayers(filtered)
    }
  }, [allPrayers, searchQuery])

  const handleLoadMore = () => {
    if (data && page < data.pagination.totalPages) {
      setPage(prev => prev + 1)
    }
  }

  const handleFilterChange = (newSort: string, newTimeRange: string) => {
    setSort(newSort)
    setTimeRange(newTimeRange)
    setPage(1) // Reset to first page
    setAllPrayers([]) // Clear existing prayers
  }

  const handleRefresh = () => {
    setPage(1)
    setAllPrayers([])
    mutate()
  }

  const handleEdit = (prayer: Prayer) => {
    setEditingPrayer(prayer)
    setIsEditModalOpen(true)
  }

  const handleEditModalClose = () => {
    setIsEditModalOpen(false)
    setEditingPrayer(null)
  }

  const handlePrayerUpdated = () => {
    // Refresh the timeline after editing
    handleRefresh()
  }

  const handleShare = (prayer: Prayer) => {
    setSharingPrayer(prayer)
    setIsShareModalOpen(true)
  }

  const handleShareModalClose = () => {
    setIsShareModalOpen(false)
    setSharingPrayer(null)
  }

  const handleDelete = async (prayerId: string) => {
    try {
      const supabase = createBrowserSupabase()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        alert('Please login to delete prayers')
        return
      }

      const response = await fetch(`/api/prayers?id=${prayerId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to delete prayer')
      }

      // Refresh the timeline
      handleRefresh()
      alert('Prayer deleted successfully')
    } catch (error) {
      console.error('Error deleting prayer:', error)
      alert('Failed to delete prayer')
    }
  }

  // Group prayers by week
  const groupPrayersByWeek = (prayers: Prayer[]) => {
    const groups = new Map<string, Prayer[]>()
    const currentWeekStart = getCurrentWeekStartET()
    
    prayers.forEach(prayer => {
      if (!prayer.created_at) return
      
      const prayerDate = new Date(prayer.created_at)
      const sunday = new Date(prayerDate)
      sunday.setDate(prayerDate.getDate() - prayerDate.getDay())
      const weekStart = sunday.toISOString().split('T')[0]
      
      let weekLabel
      if (weekStart === currentWeekStart) {
        weekLabel = `This Week (${sunday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(sunday.getTime() + 6*24*60*60*1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`
      } else {
        const weekEnd = new Date(sunday.getTime() + 6*24*60*60*1000)
        weekLabel = `${sunday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
      }
      
      if (!groups.has(weekLabel)) {
        groups.set(weekLabel, [])
      }
      groups.get(weekLabel)!.push(prayer)
    })
    
    return Array.from(groups.entries()).map(([week, prayers]) => ({
      week,
      prayers: prayers.sort((a, b) => 
        new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      )
    }))
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">My Prayer Timeline</h2>
          <button 
            onClick={handleRefresh}
            className="px-3 py-1 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Refresh
          </button>
        </div>
        <div className="text-center py-8">
          <div className="text-red-500 mb-2">⚠️</div>
          <p className="text-gray-600">{error.message || 'Failed to load prayers'}</p>
        </div>
      </div>
    )
  }

  const weeklyGroups = groupPrayersByWeek(filteredPrayers)

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      {/* Header with controls */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">My Prayer Timeline</h2>
        <div className="flex items-center gap-4">
          {/* Search bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search prayers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-64"
            />
            <div className="absolute left-2 top-2.5 text-gray-400">
              🔍
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>
          {/* Filters */}
          <div className="flex items-center gap-2">
            <select
              value={sort}
              onChange={(e) => handleFilterChange(e.target.value, timeRange)}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value="recent">Most Recent</option>
              <option value="most_liked">Most Liked</option>
              <option value="most_commented">Most Commented</option>
            </select>
            
            <select
              value={timeRange}
              onChange={(e) => handleFilterChange(sort, e.target.value)}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value="all">All Time</option>
              <option value="this_month">This Month</option>
              <option value="last_3_months">Last 3 Months</option>
            </select>
          </div>
          
          <button 
            onClick={() => setIsExportModalOpen(true)}
            className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
            title="Export prayers"
            disabled={allPrayers.length === 0}
          >
            📥 Export
          </button>
          
          <button 
            onClick={handleRefresh}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
            disabled={isLoading}
            title="Refresh timeline"
          >
            {isLoading ? '🔄' : '↻'}
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading && page === 1 ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-4 animate-pulse">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-300 rounded w-1/4 mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : weeklyGroups.length > 0 ? (
        <div>
          {weeklyGroups.map(({ week, prayers }) => (
            <TimeGroup key={week} title={week}>
              {prayers.map(prayer => (
                <UserPrayerCard
                  key={prayer.id}
                  prayer={prayer}
                  showEngagement={true}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onShare={handleShare}
                />
              ))}
            </TimeGroup>
          ))}
          
          {/* Load more button */}
          {data && page < data.pagination.totalPages && (
            <div className="text-center mt-6">
              <button
                onClick={handleLoadMore}
                disabled={isLoading}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
          
          {/* Pagination info */}
          {data && (
            <div className="text-center mt-4 text-sm text-gray-500">
              {searchQuery ? (
                <>
                  Showing {filteredPrayers.length} of {allPrayers.length} prayers matching &ldquo;{searchQuery}&rdquo;
                </>
              ) : (
                <>
                  Showing {allPrayers.length} of {data.pagination.total} prayers
                </>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
            {searchQuery ? '🔍' : '🙏'}
          </div>
          <p className="text-gray-600">
            {searchQuery ? <>No prayers found matching &ldquo;{searchQuery}&rdquo;</> : 'No prayers found'}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            {searchQuery ? (
              <>
                Try a different search term or{' '}
                <button 
                  onClick={() => setSearchQuery('')}
                  className="text-indigo-600 hover:underline"
                >
                  clear search
                </button>
              </>
            ) : (
              'Start by sharing a prayer on the main prayer wall'
            )}
          </p>
        </div>
      )}

      {/* Edit Modal */}
      <PrayerEditModal
        prayer={editingPrayer}
        isOpen={isEditModalOpen}
        onClose={handleEditModalClose}
        onUpdated={handlePrayerUpdated}
      />

      {/* Export Modal */}
      <PrayerExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        prayers={allPrayers}
      />

      {/* Share Modal */}
      <PrayerShareModal
        prayer={sharingPrayer}
        isOpen={isShareModalOpen}
        onClose={handleShareModalClose}
      />
    </div>
  )
}