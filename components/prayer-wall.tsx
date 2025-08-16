"use client"
import { useEffect, useState } from "react"
import { createBrowserSupabase } from '@/lib/supabase-browser'
import { PrayerCard } from "./prayer-card"
import Masonry from 'react-masonry-css'
import type { Prayer, Fellowship } from '@/types/models'
const breakpointColumnsObj = {
  default: 4,  // 4 columns for desktop
  1024: 3,     // 3 columns for tablet
  640: 2,      // 2 columns for mobile
}



export function PrayerWall({ 
  weekStart, 
  fellowship,
  onEdit, 
  onDelete, 
  refreshKey 
}: { 
  weekStart: string;
  fellowship?: Fellowship;
  onEdit?: (prayer: Prayer) => void;
  onDelete?: (prayerId?: string) => void;
  refreshKey?: number;
}) {
  const [prayers, setPrayers] = useState<Prayer[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  const [avatarByUserId, setAvatarByUserId] = useState<Record<string, string | null>>({})
  const supa = createBrowserSupabase()

  useEffect(() => {
    let isMounted = true
    setLoading(true)
    setError(null)

    const fellowshipParam = fellowship ? `&fellowship=${encodeURIComponent(fellowship)}` : ''
    const url = `/api/prayers?week_start=${encodeURIComponent(weekStart)}${fellowshipParam}`
    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((data) => {
        if (!isMounted) return
        setPrayers(Array.isArray(data) ? data : [])
      })
      .catch(() => {
        if (!isMounted) return
        setError("Failed to load prayers.")
        setPrayers([])
      })
      .finally(() => {
        if (!isMounted) return
        setLoading(false)
      })

    return () => { isMounted = false }
  }, [weekStart, fellowship, refreshKey])

  useEffect(() => {
    // Build unique list of user_ids from current prayers
    const ids = Array.from(new Set(
      (prayers || []).map(p => (p as any).user_id).filter((x: any): x is string => Boolean(x))
    ))

    if (ids.length === 0) {
      setAvatarByUserId({})
      return
    }

    let aborted = false
    supa
      .from('user_profiles')
      .select('user_id, avatar_url')
      .in('user_id', ids)
      .then(({ data, error }) => {
        if (aborted || error) return
        const map: Record<string, string | null> = {}
        for (const row of data || []) {
          map[(row as any).user_id as string] = (row as any).avatar_url ?? null
        }
        setAvatarByUserId(map)
      })

    return () => { aborted = true }
  }, [prayers])

  const skeletons = Array.from({ length: 6 }).map((_, i) => (
    <div
      key={`skeleton-${i}`}
      className="h-32 bg-gray-100 animate-pulse rounded-xl border border-gray-200"
    />
  ))

  return (
    <div className="px-0 sm:px-4 pt-0 pb-4 sm:pb-8 max-w-6xl lg:max-w-7xl xl:max-w-8xl mx-auto">
      {error && <p className="text-red-500 text-center mb-4">{error}</p>}

      <Masonry
        breakpointCols={breakpointColumnsObj}
        className="flex gap-1 sm:gap-4"
        columnClassName="space-y-1 sm:space-y-4"
      >
        {loading
          ? skeletons
          : prayers.length > 0
            ? prayers.map((p) => (
                <PrayerCard
                  key={p.id}
                  prayer={p}
                  authorAvatarUrl={avatarByUserId[(p as any).user_id ?? ''] ?? null}
                  onEdit={onEdit}
                  onDelete={onDelete ? () => onDelete() : undefined}
                />
              ))
            : [
                <div
                  key="empty"
                  className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center text-gray-500"
                >
                  这个星期还没有祷告，成为第一位分享的人吧。
                </div>,
              ]}
      </Masonry>
    </div>
  )
}