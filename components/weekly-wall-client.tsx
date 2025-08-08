// components/weekly-wall-client.tsx
"use client"

import { useState } from "react"
import { PrayerWall } from "@/components/prayer-wall"
import { PrayerForm } from "@/components/prayer-form"
import { Button } from "@/components/ui/button"

type Props = {
  weekStart: string
  readOnly: boolean
}

export function WeeklyWallClient({ weekStart, readOnly }: Props) {
  const [showForm, setShowForm] = useState(false)

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-10">
        {/* Header */}
        <section className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <p className="text-gray-600">
                {readOnly
                  ? "Viewing a past week (read-only)"
                  : "Share your prayers and find strength in community"}
              </p>
              <p className="text-sm text-gray-500 mt-1">Week of {weekStart}</p>
            </div>

            {!readOnly && (
              <Button onClick={() => setShowForm(!showForm)} className="px-6 py-3 text-lg">
                {showForm ? "Cancel" : "Submit a Prayer"}
              </Button>
            )}
          </div>
        </section>

        {/* Wall */}
        <section className="bg-white rounded-xl shadow-sm p-6">
          <PrayerWall weekStart={weekStart} />
        </section>
      </div>

      {/* Modal Form */}
      {!readOnly && showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex justify-center items-center">
          <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-xl mx-4">
            <h2 className="text-2xl font-semibold text-gray-700 mb-6">Share a Prayer</h2>
            <PrayerForm
              weekStart={weekStart}
              onPost={() => {
                setShowForm(false)
                // 简单粗暴：刷新数据（保持你现在的做法）
                window.location.reload()
              }}
              onCancel={() => setShowForm(false)}
            />
          </div>
        </div>
      )}
    </main>
  )
}