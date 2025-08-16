'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import { createBrowserSupabase } from '@/lib/supabase-browser'
import { formatDistanceToNow } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BarChart3, Clock, Calendar, TrendingUp, Heart, MessageSquare, Users, Tags } from 'lucide-react'

interface AnalyticsData {
  prayerFrequency: {
    daily: number
    weekly: number
    monthly: number
  }
  engagementTrends: {
    averageLikes: number
    averageComments: number
    mostLikedPrayer: {
      id: string
      content: string
      like_count: number
      created_at: string
    } | null
    mostCommentedPrayer: {
      id: string
      content: string
      comment_count: number
      created_at: string
    } | null
  }
  prayerPatterns: {
    longestStreak: number
    currentStreak: number
    totalDays: number
    preferredTimeOfDay: 'morning' | 'afternoon' | 'evening' | 'night' | 'mixed'
    wordCount: {
      average: number
      shortest: number
      longest: number
    }
  }
  fellowshipAnalytics: {
    breakdown: Array<{
      fellowship: string
      fellowshipName: string
      count: number
      percentage: number
      color: string
    }>
    mostActiveFellowship: string
    prayerTypes: {
      thanksgiving: number
      intercession: number
      mixed: number
    }
  }
  monthlyBreakdown: Array<{
    month: string
    count: number
    likes: number
    comments: number
  }>
}

const fetcher = async (url: string): Promise<AnalyticsData> => {
  const supabase = createBrowserSupabase()
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    throw new Error('Please login to view analytics')
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

interface PrayerAnalyticsProps {
  className?: string
}

export default function PrayerAnalytics({ className = '' }: PrayerAnalyticsProps) {
  const [timeRange, setTimeRange] = useState('all') // all, last_year, last_6_months

  const { data: analytics, error, isLoading } = useSWR<AnalyticsData>(
    `/api/user/analytics?timeRange=${timeRange}`, 
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 0
    }
  )

  const getTimeOfDayIcon = (timeOfDay: string) => {
    switch (timeOfDay) {
      case 'morning': return <Clock className="w-4 h-4 text-yellow-600" />
      case 'afternoon': return <Clock className="w-4 h-4 text-orange-600" />  
      case 'evening': return <Clock className="w-4 h-4 text-blue-600" />
      case 'night': return <Clock className="w-4 h-4 text-indigo-600" />
      default: return <Clock className="w-4 h-4 text-gray-600" />
    }
  }

  const getStreakColor = (streak: number) => {
    if (streak >= 30) return 'text-green-600'
    if (streak >= 7) return 'text-blue-600'
    if (streak >= 3) return 'text-yellow-600'
    return 'text-gray-600'
  }

  if (error) {
    return (
      <Card className={`bg-transparent border-none shadow-none ${className}`}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Prayer Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">Failed to load analytics</p>
            <p className="text-sm text-muted-foreground mt-2">{error.message}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`bg-transparent border-none shadow-none ${className}`}>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Prayer Analytics
          </CardTitle>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="last_year">Last Year</SelectItem>
              <SelectItem value="last_6_months">Last 6 Months</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-4 animate-pulse">
                  <div className="h-4 bg-gray-300 rounded w-1/3 mb-3"></div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((j) => (
                      <div key={j} className="text-center">
                        <div className="h-8 bg-gray-300 rounded w-full mb-2"></div>
                        <div className="h-4 bg-gray-300 rounded w-2/3 mx-auto"></div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : analytics ? (
          <div className="space-y-6">
            {/* Prayer Frequency */}
            <Card className="bg-white/50 border-white/30">
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Prayer Frequency
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-3 border border-border rounded">
                    <div className="text-lg font-semibold text-foreground">
                      {analytics.prayerFrequency.daily.toFixed(1)}
                    </div>
                    <div className="text-xs text-muted-foreground">Daily Average</div>
                  </div>
                  <div className="text-center p-3 border border-border rounded">
                    <div className="text-lg font-semibold text-foreground">
                      {analytics.prayerFrequency.weekly.toFixed(1)}
                    </div>
                    <div className="text-xs text-muted-foreground">Weekly Average</div>
                  </div>
                  <div className="text-center p-3 border border-border rounded">
                    <div className="text-lg font-semibold text-foreground">
                      {analytics.prayerFrequency.monthly.toFixed(1)}
                    </div>
                    <div className="text-xs text-muted-foreground">Monthly Average</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Prayer Patterns */}
            <Card className="bg-white/50 border-white/30">
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Prayer Patterns
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 border border-border rounded">
                    <div className={`text-lg font-semibold ${getStreakColor(analytics.prayerPatterns.currentStreak)}`}>
                      {analytics.prayerPatterns.currentStreak}
                    </div>
                    <div className="text-xs text-muted-foreground">Current Streak</div>
                    <div className="text-xs text-muted-foreground">days</div>
                  </div>
                  <div className="text-center p-3 border border-border rounded">
                    <div className={`text-lg font-semibold ${getStreakColor(analytics.prayerPatterns.longestStreak)}`}>
                      {analytics.prayerPatterns.longestStreak}
                    </div>
                    <div className="text-xs text-muted-foreground">Longest Streak</div>
                    <div className="text-xs text-muted-foreground">days</div>
                  </div>
                  <div className="text-center p-3 border border-border rounded">
                    <div className="text-lg font-semibold text-foreground">
                      {analytics.prayerPatterns.totalDays}
                    </div>
                    <div className="text-xs text-muted-foreground">Total Active</div>
                    <div className="text-xs text-muted-foreground">days</div>
                  </div>
                  <div className="text-center p-3 border border-border rounded">
                    <div className="flex justify-center mb-1">
                      {getTimeOfDayIcon(analytics.prayerPatterns.preferredTimeOfDay)}
                    </div>
                    <div className="text-xs text-muted-foreground">Preferred Time</div>
                    <div className="text-xs text-muted-foreground capitalize">
                      {analytics.prayerPatterns.preferredTimeOfDay}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Engagement Insights */}
            <Card className="bg-white/50 border-white/30">
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Engagement Insights
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center p-3 border border-border rounded">
                    <div className="text-lg font-semibold text-foreground">
                      {analytics.engagementTrends.averageLikes.toFixed(1)}
                    </div>
                    <div className="text-xs text-muted-foreground">Average Likes</div>
                  </div>
                  <div className="text-center p-3 border border-border rounded">
                    <div className="text-lg font-semibold text-foreground">
                      {analytics.engagementTrends.averageComments.toFixed(1)}
                    </div>
                    <div className="text-xs text-muted-foreground">Average Comments</div>
                  </div>
                  <div className="text-center p-3 border border-border rounded">
                    <div className="text-lg font-semibold text-foreground">
                      {analytics.prayerPatterns.wordCount.average}
                    </div>
                    <div className="text-xs text-muted-foreground">Average Words</div>
                  </div>
                  <div className="text-center p-3 border border-border rounded">
                    <div className="text-lg font-semibold text-foreground">
                      {analytics.prayerPatterns.wordCount.longest}
                    </div>
                    <div className="text-xs text-muted-foreground">Longest Prayer</div>
                    <div className="text-xs text-muted-foreground">words</div>
                  </div>
                </div>

                {/* Most engaged prayers */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analytics.engagementTrends.mostLikedPrayer && (
                    <div className="p-3 border border-border rounded">
                      <div className="text-sm font-medium text-foreground mb-1">
                        Most Liked Prayer ({analytics.engagementTrends.mostLikedPrayer.like_count} likes)
                      </div>
                      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                        {analytics.engagementTrends.mostLikedPrayer.content.substring(0, 100)}
                        {analytics.engagementTrends.mostLikedPrayer.content.length > 100 && '...'}
                      </p>
                      <div className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(analytics.engagementTrends.mostLikedPrayer.created_at), { addSuffix: true })}
                      </div>
                    </div>
                  )}

                  {analytics.engagementTrends.mostCommentedPrayer && (
                    <div className="p-3 border border-border rounded">
                      <div className="text-sm font-medium text-foreground mb-1">
                        Most Discussed Prayer ({analytics.engagementTrends.mostCommentedPrayer.comment_count} comments)
                      </div>
                      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                        {analytics.engagementTrends.mostCommentedPrayer.content.substring(0, 100)}
                        {analytics.engagementTrends.mostCommentedPrayer.content.length > 100 && '...'}
                      </p>
                      <div className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(analytics.engagementTrends.mostCommentedPrayer.created_at), { addSuffix: true })}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Fellowship Analytics */}
            {analytics.fellowshipAnalytics && (
              <Card className="bg-white/50 border-white/30">
                <CardContent className="p-4">
                  <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Fellowship Participation
                  </h3>
                  
                  {/* Fellowship Breakdown */}
                  <div className="mb-6">
                    <h4 className="text-xs font-medium text-muted-foreground mb-3">Prayer Distribution by Fellowship</h4>
                    <div className="space-y-2">
                      {analytics.fellowshipAnalytics.breakdown.map((fellowship, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <div className="w-24 text-xs text-muted-foreground text-right">
                            {fellowship.fellowshipName}
                          </div>
                          <div className="flex-1 bg-gray-200 rounded-full h-4 relative">
                            <div 
                              className="h-4 rounded-full flex items-center justify-end pr-2"
                              style={{ 
                                width: `${Math.max(fellowship.percentage, 5)}%`,
                                backgroundColor: fellowship.color
                              }}
                            >
                              <span className="text-white text-xs font-medium">
                                {fellowship.count}
                              </span>
                            </div>
                          </div>
                          <div className="w-12 text-xs text-muted-foreground text-right">
                            {fellowship.percentage.toFixed(0)}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Prayer Types Breakdown */}
                  <div className="mb-6">
                    <h4 className="text-xs font-medium text-muted-foreground mb-3 flex items-center gap-2">
                      <Tags className="w-3 h-3" />
                      Prayer Content Types
                    </h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-3 border border-border rounded">
                        <div className="text-lg font-semibold" style={{ color: '#edcd52' }}>
                          {analytics.fellowshipAnalytics.prayerTypes.thanksgiving}
                        </div>
                        <div className="text-xs text-muted-foreground">感恩祷告</div>
                      </div>
                      <div className="text-center p-3 border border-border rounded">
                        <div className="text-lg font-semibold" style={{ color: '#607ebf' }}>
                          {analytics.fellowshipAnalytics.prayerTypes.intercession}
                        </div>
                        <div className="text-xs text-muted-foreground">代祷请求</div>
                      </div>
                      <div className="text-center p-3 border border-border rounded">
                        <div className="text-lg font-semibold" style={{ color: '#66b28f' }}>
                          {analytics.fellowshipAnalytics.prayerTypes.mixed}
                        </div>
                        <div className="text-xs text-muted-foreground">综合祷告</div>
                      </div>
                    </div>
                  </div>

                  {/* Most Active Fellowship */}
                  {analytics.fellowshipAnalytics.mostActiveFellowship && (
                    <div className="p-3 border border-border rounded bg-blue-50">
                      <div className="text-sm font-medium text-foreground mb-1">
                        Most Active Fellowship
                      </div>
                      <p className="text-xs text-muted-foreground">
                        You are most active in <span className="font-medium">{analytics.fellowshipAnalytics.mostActiveFellowship}</span> fellowship
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Monthly Breakdown Chart */}
            {analytics.monthlyBreakdown.length > 0 && (
              <Card className="bg-white/50 border-white/30">
                <CardContent className="p-4">
                  <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Monthly Activity
                  </h3>
                  <div className="space-y-2">
                    {analytics.monthlyBreakdown.map((month, index) => {
                      const maxCount = Math.max(...analytics.monthlyBreakdown.map(m => m.count))
                      const widthPercentage = maxCount > 0 ? (month.count / maxCount) * 100 : 0
                      
                      return (
                        <div key={index} className="flex items-center gap-3">
                          <div className="w-20 text-xs text-muted-foreground text-right">
                            {month.month}
                          </div>
                          <div className="flex-1 bg-gray-200 rounded-full h-4 relative">
                            <div 
                              className="bg-gradient-to-r from-indigo-500 to-blue-500 h-4 rounded-full flex items-center justify-end pr-2"
                              style={{ width: `${Math.max(widthPercentage, 5)}%` }}
                            >
                              <span className="text-white text-xs font-medium">
                                {month.count}
                              </span>
                            </div>
                          </div>
                          <div className="w-16 text-xs text-muted-foreground flex items-center gap-1">
                            <Heart className="w-3 h-3" />{month.likes}
                            <MessageSquare className="w-3 h-3" />{month.comments}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No analytics data available</p>
            <p className="text-sm text-muted-foreground mt-2">
              Start sharing prayers to see your analytics
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}