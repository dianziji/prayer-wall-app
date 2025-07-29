"use client"
import { useEffect, useState } from "react"
import { PrayerCard } from "./prayer-card"
import Masonry from 'react-masonry-css'

const breakpointColumnsObj = {
  default: 3,
  1024: 2,
  640: 1,
}

type Prayer = {
  id: string
  content: string
  author_name: string | null
  created_at: string
}

export function PrayerWall({ weekStart }: { weekStart: string }) {
  const [prayers, setPrayers] = useState<Prayer[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    let isMounted = true
    setLoading(true)
    setError(null)

    const url = `/api/prayers?week_start=${encodeURIComponent(weekStart)}`
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
  }, [weekStart])

  const skeletons = Array.from({ length: 6 }).map((_, i) => (
    <div
      key={`skeleton-${i}`}
      className="h-32 bg-gray-100 animate-pulse rounded-xl border border-gray-200"
    />
  ))

  return (
    <div className="px-4 py-8 max-w-6xl mx-auto">
      {error && <p className="text-red-500 text-center mb-4">{error}</p>}

      <Masonry
        breakpointCols={breakpointColumnsObj}
        className="flex gap-4"
        columnClassName="space-y-4"
      >
        {loading
          ? skeletons
          : prayers.length > 0
            ? prayers.map((p) => (
                <PrayerCard
                  key={p.id}
                  content={p.content}
                  authorName={p.author_name ?? "Anonymous"}
                  createdAt={p.created_at}
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