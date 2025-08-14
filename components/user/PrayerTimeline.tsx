'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import { createBrowserSupabase } from '@/lib/supabase-browser'
import UserPrayerCard from './UserPrayerCard'
import PrayerEditModal from './PrayerEditModal'
import PrayerExportModal from './PrayerExportModal'
import PrayerShareModal from './PrayerShareModal'
import { getCurrentWeekStartET } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar, RefreshCw, Download, Search, X, BookOpen, Loader2 } from 'lucide-react'

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
      <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
        <Calendar className="w-4 h-4" />
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
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              My Prayer Timeline
            </CardTitle>
            <Button onClick={handleRefresh} size="sm" variant="outline">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">{error.message || 'Failed to load prayers'}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const weeklyGroups = groupPrayersByWeek(filteredPrayers)

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            My Prayer Timeline
          </CardTitle>
          
          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setIsExportModalOpen(true)}
              size="sm"
              variant="outline"
              disabled={allPrayers.length === 0}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span className="hidden md:inline">Export</span>
            </Button>
            
            <Button
              onClick={handleRefresh}
              size="sm"
              variant="outline"
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden md:inline">Refresh</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        
        {/* Search and filters row */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search bar */}
          <div className="relative flex-1 sm:max-w-xs">
            <Input
              type="text"
              placeholder="Search prayers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-8"
            />
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            {searchQuery && (
              <Button
                onClick={() => setSearchQuery('')}
                size="sm"
                variant="ghost"
                className="absolute right-1 top-1 h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
          
          {/* Filters - inline on mobile, side by side on desktop */}
          <div className="flex gap-2 sm:gap-3 min-w-0">
            <div className="flex-1 sm:flex-none min-w-0">
              <Select value={sort} onValueChange={(value) => handleFilterChange(value, timeRange)}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="most_liked">Most Liked</SelectItem>
                  <SelectItem value="most_commented">Most Commented</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-1 sm:flex-none min-w-0">
              <Select value={timeRange} onValueChange={(value) => handleFilterChange(sort, value)}>
                <SelectTrigger className="w-full sm:w-36">
                  <SelectValue placeholder="Time range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="this_month">This Month</SelectItem>
                  <SelectItem value="last_3_months">Last 3 Months</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Content */}
        {isLoading && page === 1 ? (
          <div className="space-y-4 mt-6">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-4 animate-pulse">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-muted rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
                      <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-muted rounded w-1/2"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : weeklyGroups.length > 0 ? (
          <div className="mt-6">
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
              <div className="text-center mt-8">
                <Button
                  onClick={handleLoadMore}
                  disabled={isLoading}
                  variant="outline"
                  className="min-w-32"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Load More'
                  )}
                </Button>
              </div>
            )}
          
            {/* Pagination info */}
            {data && (
              <div className="text-center mt-6 p-4 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  {searchQuery ? (
                    <>
                      Showing {filteredPrayers.length} of {allPrayers.length} prayers matching &ldquo;{searchQuery}&rdquo;
                    </>
                  ) : (
                    <>
                      Showing {allPrayers.length} of {data.pagination.total} prayers
                    </>
                  )}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 mt-6">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-muted rounded-full">
                <BookOpen className="w-8 h-8 text-muted-foreground" />
              </div>
            </div>
            <p className="text-lg font-medium text-foreground mb-2">
              {searchQuery ? 'No prayers found' : 'No prayers yet'}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              {searchQuery ? (
                <>
                  No prayers found matching &ldquo;{searchQuery}&rdquo;
                </>
              ) : (
                'Start by sharing a prayer on the main prayer wall'
              )}
            </p>
            {searchQuery && (
              <Button 
                onClick={() => setSearchQuery('')}
                variant="outline"
                size="sm"
              >
                Clear search
              </Button>
            )}
          </div>
        )}
      </CardContent>

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
    </Card>
  )
}