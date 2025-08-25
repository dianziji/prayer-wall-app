import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { FELLOWSHIP_OPTIONS } from '@/types/models'

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

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabase()
  
  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }

  const userId = user.id
  const { searchParams } = new URL(request.url)
  const timeRange = searchParams.get('timeRange') || 'all'

  try {
    // Calculate time filter
    let timeFilter = new Date(0).toISOString()
    if (timeRange === 'last_year') {
      const lastYear = new Date()
      lastYear.setFullYear(lastYear.getFullYear() - 1)
      timeFilter = lastYear.toISOString()
    } else if (timeRange === 'last_6_months') {
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
      timeFilter = sixMonthsAgo.toISOString()
    }

    // Get all user prayers with enhanced data
    const { data: prayers, error: prayersError } = await supabase
      .from('prayers')
      .select(`
        id,
        content,
        created_at,
        author_name,
        fellowship,
        thanksgiving_content,
        intercession_content
      `)
      .eq('user_id', userId)
      .gte('created_at', timeFilter)
      .order('created_at', { ascending: true })

    if (prayersError) {
      console.error('Error fetching prayers:', prayersError)
      return NextResponse.json(
        { error: 'Failed to fetch prayers' },
        { status: 500 }
      )
    }

    if (!prayers || prayers.length === 0) {
      // Return empty analytics for users with no prayers
      const emptyAnalytics: AnalyticsData = {
        prayerFrequency: { daily: 0, weekly: 0, monthly: 0 },
        engagementTrends: {
          averageLikes: 0,
          averageComments: 0,
          mostLikedPrayer: null,
          mostCommentedPrayer: null
        },
        prayerPatterns: {
          longestStreak: 0,
          currentStreak: 0,
          totalDays: 0,
          preferredTimeOfDay: 'mixed',
          wordCount: { average: 0, shortest: 0, longest: 0 }
        },
        fellowshipAnalytics: {
          breakdown: [],
          mostActiveFellowship: '',
          prayerTypes: { thanksgiving: 0, intercession: 0, mixed: 0 }
        },
        monthlyBreakdown: []
      }
      return NextResponse.json(emptyAnalytics)
    }

    // Get prayer IDs for engagement data
    const prayerIds = prayers.map((p: any) => p.id)
    
    // Get likes data
    const { data: likesData } = await supabase
      .from('likes')
      .select('prayer_id')
      .in('prayer_id', prayerIds)

    // Get comments data  
    const { data: commentsData } = await supabase
      .from('comments')
      .select('prayer_id')
      .in('prayer_id', prayerIds)

    // Calculate prayer frequency
    const now = new Date()
    const firstPrayer = new Date((prayers[0] as any).created_at || now)
    const daysSinceFirst = Math.max(1, Math.ceil((now.getTime() - firstPrayer.getTime()) / (1000 * 60 * 60 * 24)))
    const weeksSinceFirst = Math.max(1, daysSinceFirst / 7)
    const monthsSinceFirst = Math.max(1, daysSinceFirst / 30)

    const prayerFrequency = {
      daily: prayers.length / daysSinceFirst,
      weekly: prayers.length / weeksSinceFirst,
      monthly: prayers.length / monthsSinceFirst
    }

    // Calculate engagement trends
    const likeCounts = new Map<string, number>()
    const commentCounts = new Map<string, number>()

    likesData?.forEach(like => {
      likeCounts.set(like.prayer_id, (likeCounts.get(like.prayer_id) || 0) + 1)
    })

    commentsData?.forEach(comment => {
      commentCounts.set(comment.prayer_id, (commentCounts.get(comment.prayer_id) || 0) + 1)
    })

    const totalLikes = Array.from(likeCounts.values()).reduce((sum, count) => sum + count, 0)
    const totalComments = Array.from(commentCounts.values()).reduce((sum, count) => sum + count, 0)

    // Find most liked and most commented prayers
    let mostLikedPrayer = null
    let mostCommentedPrayer = null
    let maxLikes = 0
    let maxComments = 0

    prayers.forEach(prayer => {
      const likes = likeCounts.get(prayer.id) || 0
      const comments = commentCounts.get(prayer.id) || 0

      if (likes > maxLikes) {
        maxLikes = likes
        mostLikedPrayer = {
          id: prayer.id,
          content: prayer.content,
          like_count: likes,
          created_at: prayer.created_at || new Date().toISOString()
        }
      }

      if (comments > maxComments) {
        maxComments = comments
        mostCommentedPrayer = {
          id: prayer.id,
          content: prayer.content,
          comment_count: comments,
          created_at: prayer.created_at || new Date().toISOString()
        }
      }
    })

    const engagementTrends = {
      averageLikes: prayers.length > 0 ? totalLikes / prayers.length : 0,
      averageComments: prayers.length > 0 ? totalComments / prayers.length : 0,
      mostLikedPrayer,
      mostCommentedPrayer
    }

    // Calculate prayer patterns
    const prayerDates = prayers
      .map(p => new Date(p.created_at || 0))
      .sort((a, b) => a.getTime() - b.getTime())

    // Calculate streaks
    const uniqueDates = Array.from(new Set(
      prayerDates.map(date => date.toDateString())
    )).sort()

    let currentStreak = 0
    let longestStreak = 0
    let tempStreak = 1

    if (uniqueDates.length > 0) {
      // Check current streak (from today backwards)
      const today = new Date().toDateString()
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString()
      
      if (uniqueDates.includes(today)) {
        currentStreak = 1
        for (let i = uniqueDates.length - 2; i >= 0; i--) {
          const currentDate = new Date(uniqueDates[i + 1])
          const prevDate = new Date(uniqueDates[i])
          const dayDiff = (currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
          
          if (dayDiff === 1) {
            currentStreak++
          } else {
            break
          }
        }
      } else if (uniqueDates.includes(yesterday)) {
        currentStreak = 1
        for (let i = uniqueDates.length - 2; i >= 0; i--) {
          const currentDate = new Date(uniqueDates[i + 1])
          const prevDate = new Date(uniqueDates[i])
          const dayDiff = (currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
          
          if (dayDiff === 1) {
            currentStreak++
          } else {
            break
          }
        }
      }

      // Calculate longest streak
      for (let i = 1; i < uniqueDates.length; i++) {
        const currentDate = new Date(uniqueDates[i])
        const prevDate = new Date(uniqueDates[i - 1])
        const dayDiff = (currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
        
        if (dayDiff === 1) {
          tempStreak++
        } else {
          longestStreak = Math.max(longestStreak, tempStreak)
          tempStreak = 1
        }
      }
      longestStreak = Math.max(longestStreak, tempStreak)
    }

    // Calculate preferred time of day
    const timeSlots = { morning: 0, afternoon: 0, evening: 0, night: 0 }
    prayerDates.forEach(date => {
      const hour = date.getHours()
      if (hour >= 5 && hour < 12) timeSlots.morning++
      else if (hour >= 12 && hour < 17) timeSlots.afternoon++
      else if (hour >= 17 && hour < 21) timeSlots.evening++
      else timeSlots.night++
    })

    const preferredTime = Object.entries(timeSlots).reduce((a, b) => 
      timeSlots[a[0] as keyof typeof timeSlots] > timeSlots[b[0] as keyof typeof timeSlots] ? a : b
    )[0] as 'morning' | 'afternoon' | 'evening' | 'night'

    // Calculate word count statistics
    const wordCounts = prayers.map(p => p.content.split(' ').length)
    const averageWordCount = Math.round(wordCounts.reduce((sum, count) => sum + count, 0) / wordCounts.length)
    const shortestWordCount = Math.min(...wordCounts)
    const longestWordCount = Math.max(...wordCounts)

    const prayerPatterns = {
      longestStreak,
      currentStreak,
      totalDays: uniqueDates.length,
      preferredTimeOfDay: preferredTime,
      wordCount: {
        average: averageWordCount,
        shortest: shortestWordCount,
        longest: longestWordCount
      }
    }

    // Calculate monthly breakdown
    const monthlyMap = new Map<string, { count: number, likes: number, comments: number }>()
    
    prayers.forEach(prayer => {
      const date = new Date(prayer.created_at || 0)
      const monthKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
      
      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, { count: 0, likes: 0, comments: 0 })
      }
      
      const monthData = monthlyMap.get(monthKey)!
      monthData.count++
      monthData.likes += likeCounts.get(prayer.id) || 0
      monthData.comments += commentCounts.get(prayer.id) || 0
    })

    const monthlyBreakdown = Array.from(monthlyMap.entries())
      .map(([month, data]) => ({
        month,
        ...data
      }))
      .sort((a, b) => new Date(`${a.month} 1`).getTime() - new Date(`${b.month} 1`).getTime())
      .slice(-12) // Last 12 months

    // Calculate fellowship analytics
    const fellowshipCounts = new Map<string, number>()
    const prayerTypeCounts = { thanksgiving: 0, intercession: 0, mixed: 0 }
    
    prayers.forEach(prayer => {
      const fellowship = (prayer as any).fellowship || 'weekday'
      fellowshipCounts.set(fellowship, (fellowshipCounts.get(fellowship) || 0) + 1)
      
      // Analyze prayer types
      const hasThanksgiving = (prayer as any).thanksgiving_content && (prayer as any).thanksgiving_content.trim().length > 0
      const hasIntercession = (prayer as any).intercession_content && (prayer as any).intercession_content.trim().length > 0
      
      if (hasThanksgiving && hasIntercession) {
        prayerTypeCounts.mixed++
      } else if (hasThanksgiving) {
        prayerTypeCounts.thanksgiving++
      } else if (hasIntercession) {
        prayerTypeCounts.intercession++
      }
    })
    
    // Calculate fellowship breakdown
    const fellowshipBreakdown = Array.from(fellowshipCounts.entries()).map(([fellowship, count]) => {
      const fellowshipInfo = FELLOWSHIP_OPTIONS.find(f => f.id === fellowship)
      return {
        fellowship,
        fellowshipName: fellowshipInfo?.name || fellowship,
        count,
        percentage: (count / prayers.length) * 100,
        color: fellowshipInfo?.color || '#6b7280'
      }
    }).sort((a, b) => b.count - a.count)
    
    // Find most active fellowship
    const mostActiveFellowship = fellowshipBreakdown.length > 0 
      ? fellowshipBreakdown[0].fellowshipName 
      : ''
    
    const fellowshipAnalytics = {
      breakdown: fellowshipBreakdown,
      mostActiveFellowship,
      prayerTypes: prayerTypeCounts
    }

    const analytics: AnalyticsData = {
      prayerFrequency,
      engagementTrends,
      prayerPatterns,
      fellowshipAnalytics,
      monthlyBreakdown
    }

    return NextResponse.json(analytics)

  } catch (error) {
    console.error('Error generating analytics:', error)
    return NextResponse.json(
      { error: 'Failed to generate analytics' },
      { status: 500 }
    )
  }
}