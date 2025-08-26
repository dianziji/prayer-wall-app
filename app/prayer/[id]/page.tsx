'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { createBrowserSupabase } from '@/lib/supabase-browser'
import Link from 'next/link'

interface Prayer {
  id: string
  content: string
  author_name: string | null
  created_at: string | null
  like_count: number | null
}

export default function PrayerPage() {
  const params = useParams()
  const prayerId = params.id as string
  const [prayer, setPrayer] = useState<Prayer | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPrayer = async () => {
      if (!prayerId) return

      try {
        setLoading(true)
        const supabase = createBrowserSupabase()
        
        // Fetch prayer with like count
        const { data: prayerData, error: prayerError } = await supabase
          .from('v_prayers_likes')
          .select(`
            id,
            content,
            author_name,
            created_at,
            like_count
          `)
          .eq('id', prayerId)
          .single() as { data: any | null, error: any }

        if (prayerError) {
          if (prayerError.code === 'PGRST116') {
            setError('Prayer not found')
          } else {
            setError('Failed to load prayer')
          }
          return
        }

        if (prayerData.id) {
          setPrayer(prayerData as Prayer)
        } else {
          setError('Invalid prayer data')
        }
      } catch (err) {
        console.error('Error fetching prayer:', err)
        setError('Failed to load prayer')
      } finally {
        setLoading(false)
      }
    }

    fetchPrayer()
  }, [prayerId])

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading prayer...</p>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-6xl mb-4">🙏</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">{error}</h1>
          <p className="text-gray-600 mb-6">
            This prayer may have been removed or the link may be invalid.
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Visit Prayer Wall
          </Link>
        </div>
      </main>
    )
  }

  if (!prayer) {
    return null
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) {
      return {
        relative: 'Unknown time',
        full: 'Unknown date'
      }
    }
    const date = new Date(dateString)
    return {
      relative: formatDistanceToNow(date, { addSuffix: true }),
      full: date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }

  const dateInfo = formatDate(prayer.created_at)

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-4">🙏</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Shared Prayer</h1>
          <p className="text-gray-600">
            A prayer shared from the Prayer Wall community
          </p>
        </div>

        {/* Prayer Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          {/* Author Info */}
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-lg">
              {(prayer.author_name || 'U').trim().slice(0, 2).toUpperCase()}
            </div>
            <div className="ml-4">
              <div className="text-lg font-semibold text-gray-800">
                {prayer.author_name || 'Anonymous'}
              </div>
              <div className="text-sm text-gray-500" title={dateInfo.full}>
                {dateInfo.relative}
              </div>
            </div>
          </div>

          {/* Prayer Content */}
          <div className="mb-6">
            <blockquote className="text-lg leading-relaxed text-gray-800 italic border-l-4 border-indigo-200 pl-6 py-4">
              &ldquo;{prayer.content}&rdquo;
            </blockquote>
          </div>

          {/* Engagement Stats */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-100">
            <div className="flex items-center gap-2 text-gray-600">
              <span className="text-red-500">💙</span>
              <span className="text-sm">
                {prayer.like_count || 0} {(prayer.like_count || 0) === 1 ? 'like' : 'likes'}
              </span>
            </div>
            <div className="text-xs text-gray-400">
              Prayer ID: {prayer.id.substring(0, 8)}...
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">
              Join Our Prayer Community
            </h2>
            <p className="text-gray-600 mb-4">
              Share your own prayers and connect with others in faith and hope.
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/"
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                Visit Prayer Wall
              </Link>
              <Link
                href="/login"
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Join Community
              </Link>
            </div>
          </div>

          {/* Share Info */}
          <div className="text-sm text-gray-500">
            <p>
              This prayer was shared from{' '}
              <Link href="/" className="text-indigo-600 hover:underline">
                Prayer Wall
              </Link>
              {' '}• A community space for faith and hope
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}