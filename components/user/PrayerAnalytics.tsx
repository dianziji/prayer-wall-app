'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import { createBrowserSupabase } from '@/lib/supabase-browser'
import { formatDistanceToNow } from 'date-fns'

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

  const getTimeOfDayEmoji = (timeOfDay: string) => {
    switch (timeOfDay) {
      case 'morning': return '🌅'
      case 'afternoon': return '☀️'  
      case 'evening': return '🌇'
      case 'night': return '🌙'
      default: return '⏰'
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
      <div className={`bg-white rounded-xl shadow-md p-6 ${className}`}>
        <div className="text-center py-8">
          <div className="text-red-500 mb-2">📊</div>
          <p className="text-gray-600">Failed to load analytics</p>
          <p className="text-sm text-gray-500 mt-2">{error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-xl shadow-md p-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">📊 Prayer Analytics</h2>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="text-sm border border-gray-300 rounded px-3 py-1 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="all">All Time</option>
          <option value="last_year">Last Year</option>
          <option value="last_6_months">Last 6 Months</option>
        </select>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-4 animate-pulse">
              <div className="h-4 bg-gray-300 rounded w-1/3 mb-3"></div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="text-center">
                    <div className="h-8 bg-gray-300 rounded w-full mb-2"></div>
                    <div className="h-4 bg-gray-300 rounded w-2/3 mx-auto"></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : analytics ? (
        <div className="space-y-6">
          {/* Prayer Frequency */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
              🔄 Prayer Frequency
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {analytics.prayerFrequency.daily.toFixed(1)}
                </div>
                <div className="text-sm text-gray-600">Daily Average</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {analytics.prayerFrequency.weekly.toFixed(1)}
                </div>
                <div className="text-sm text-gray-600">Weekly Average</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {analytics.prayerFrequency.monthly.toFixed(1)}
                </div>
                <div className="text-sm text-gray-600">Monthly Average</div>
              </div>
            </div>
          </div>

          {/* Prayer Patterns */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
              📈 Prayer Patterns
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className={`text-xl font-bold ${getStreakColor(analytics.prayerPatterns.currentStreak)}`}>
                  {analytics.prayerPatterns.currentStreak}
                </div>
                <div className="text-xs text-gray-600">Current Streak</div>
                <div className="text-xs text-gray-500">days</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className={`text-xl font-bold ${getStreakColor(analytics.prayerPatterns.longestStreak)}`}>
                  {analytics.prayerPatterns.longestStreak}
                </div>
                <div className="text-xs text-gray-600">Longest Streak</div>
                <div className="text-xs text-gray-500">days</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-xl font-bold text-indigo-600">
                  {analytics.prayerPatterns.totalDays}
                </div>
                <div className="text-xs text-gray-600">Total Active</div>
                <div className="text-xs text-gray-500">days</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-xl font-bold text-orange-600">
                  {getTimeOfDayEmoji(analytics.prayerPatterns.preferredTimeOfDay)}
                </div>
                <div className="text-xs text-gray-600">Preferred Time</div>
                <div className="text-xs text-gray-500 capitalize">
                  {analytics.prayerPatterns.preferredTimeOfDay}
                </div>
              </div>
            </div>
          </div>

          {/* Engagement Insights */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
              💝 Engagement Insights
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center p-3 bg-pink-50 rounded-lg">
                <div className="text-xl font-bold text-pink-600">
                  {analytics.engagementTrends.averageLikes.toFixed(1)}
                </div>
                <div className="text-xs text-gray-600">Average Likes</div>
              </div>
              <div className="text-center p-3 bg-cyan-50 rounded-lg">
                <div className="text-xl font-bold text-cyan-600">
                  {analytics.engagementTrends.averageComments.toFixed(1)}
                </div>
                <div className="text-xs text-gray-600">Average Comments</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-xl font-bold text-gray-600">
                  {analytics.prayerPatterns.wordCount.average}
                </div>
                <div className="text-xs text-gray-600">Average Words</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-xl font-bold text-gray-600">
                  {analytics.prayerPatterns.wordCount.longest}
                </div>
                <div className="text-xs text-gray-600">Longest Prayer</div>
                <div className="text-xs text-gray-500">words</div>
              </div>
            </div>

            {/* Most engaged prayers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analytics.engagementTrends.mostLikedPrayer && (
                <div className="p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                  <div className="text-sm font-medium text-yellow-800 mb-1">
                    🏆 Most Liked Prayer ({analytics.engagementTrends.mostLikedPrayer.like_count} likes)
                  </div>
                  <p className="text-xs text-gray-700 mb-2 line-clamp-2">
                    {analytics.engagementTrends.mostLikedPrayer.content.substring(0, 100)}
                    {analytics.engagementTrends.mostLikedPrayer.content.length > 100 && '...'}
                  </p>
                  <div className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(analytics.engagementTrends.mostLikedPrayer.created_at), { addSuffix: true })}
                  </div>
                </div>
              )}

              {analytics.engagementTrends.mostCommentedPrayer && (
                <div className="p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
                  <div className="text-sm font-medium text-blue-800 mb-1">
                    💬 Most Discussed Prayer ({analytics.engagementTrends.mostCommentedPrayer.comment_count} comments)
                  </div>
                  <p className="text-xs text-gray-700 mb-2 line-clamp-2">
                    {analytics.engagementTrends.mostCommentedPrayer.content.substring(0, 100)}
                    {analytics.engagementTrends.mostCommentedPrayer.content.length > 100 && '...'}
                  </p>
                  <div className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(analytics.engagementTrends.mostCommentedPrayer.created_at), { addSuffix: true })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Monthly Breakdown Chart */}
          {analytics.monthlyBreakdown.length > 0 && (
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                📅 Monthly Activity
              </h3>
              <div className="space-y-2">
                {analytics.monthlyBreakdown.map((month, index) => {
                  const maxCount = Math.max(...analytics.monthlyBreakdown.map(m => m.count))
                  const widthPercentage = maxCount > 0 ? (month.count / maxCount) * 100 : 0
                  
                  return (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-20 text-sm text-gray-600 text-right">
                        {month.month}
                      </div>
                      <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                        <div 
                          className="bg-gradient-to-r from-indigo-500 to-blue-500 h-6 rounded-full flex items-center justify-end pr-2"
                          style={{ width: `${Math.max(widthPercentage, 5)}%` }}
                        >
                          <span className="text-white text-xs font-medium">
                            {month.count}
                          </span>
                        </div>
                      </div>
                      <div className="w-16 text-xs text-gray-500">
                        {month.likes}💙 {month.comments}💬
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">📊</div>
          <p className="text-gray-600">No analytics data available</p>
          <p className="text-sm text-gray-500 mt-2">
            Start sharing prayers to see your analytics
          </p>
        </div>
      )}
    </div>
  )
}