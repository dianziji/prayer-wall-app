"use client"
import { useEffect, useState } from "react"
import { PrayerCard } from "./prayer-card"
import { PrayerForm } from "./prayer-form"

export function PrayerWall() {
  const [prayers, setPrayers] = useState<any[]>([])

  useEffect(() => {
    fetch("/api/prayers").then(res => res.json()).then(setPrayers)
  }, [])

  return (
    <div>
      <PrayerForm onPost={() => window.location.reload()} />
      <div className="grid gap-4 mt-6">
        {prayers.map(p => <PrayerCard key={p.id} prayer={p} />)}
      </div>
    </div>
  )
}
