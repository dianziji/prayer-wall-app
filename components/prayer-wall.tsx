"use client"
import { useEffect, useState } from "react"
import { PrayerCard } from "./prayer-card"
import { PrayerForm } from "./prayer-form"

export function PrayerWall() {
  const [prayers, setPrayers] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/prayers")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setPrayers(data)
        } else {
          console.error("Unexpected API response:", data)
          setError("Failed to load prayers.")
        }
      })
      .catch(err => {
        console.error("Fetch error:", err)
        setError("Failed to load prayers.")
      })
  }, [])

  return (
    <div>
      <PrayerForm onPost={() => window.location.reload()} />
      <div className="grid gap-4 mt-6">
        {error && <p className="text-red-500">{error}</p>}
        {Array.isArray(prayers) && prayers.map(p => (
          <PrayerCard key={p.id} prayer={p} />
        ))}
      </div>
    </div>
  )
}
