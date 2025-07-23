"use client"
import { useEffect, useState } from "react"
import { PrayerCard } from "./prayer-card"
import Masonry from 'react-masonry-css'

const breakpointColumnsObj = {
  default: 3,
  1024: 2,
  640: 1,
}

export function PrayerWall() {
  const [prayers, setPrayers] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/prayers")
      .then(res => res.json())
      .then(data => setPrayers(Array.isArray(data) ? data : []))
      .catch(() => setError("Failed to load prayers."))
  }, [])

  return (
    <div className="px-4 py-8 max-w-6xl mx-auto">
      {error && <p className="text-red-500 text-center mb-4">{error}</p>}
      <Masonry
        breakpointCols={breakpointColumnsObj}
        className="flex gap-4"
        columnClassName="space-y-4"
      >
        {prayers.map(p => (
          <PrayerCard
            key={p.id}
            content={p.content}
            authorName={p.author_name}
            createdAt={p.created_at}
          />
        ))}
      </Masonry>
    </div>
  )
}