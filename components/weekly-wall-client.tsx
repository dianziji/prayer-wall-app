// components/weekly-wall-client.tsx
"use client"

import { useState } from "react"
import { PrayerWall } from "@/components/prayer-wall"
import { PrayerForm } from "@/components/prayer-form"
import { Button } from "@/components/ui/button"
import type { Prayer } from '@/types/models'

type Props = {
  weekStart: string
  readOnly: boolean
}

export function WeeklyWallClient({ weekStart, readOnly }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [editingPrayer, setEditingPrayer] = useState<Prayer | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  
  const handleEdit = (prayer: Prayer) => {
    setEditingPrayer(prayer)
    setShowForm(true)
  }
  
  const handleDelete = (prayerId?: string) => {
    // PrayerId is passed from PrayerCard but we don't need it for refresh
    // In the future, we could use it for optimistic updates
    setRefreshKey(prev => prev + 1) // Force refresh prayer wall
  }
  
  const handleFormClose = () => {
    setShowForm(false)
    setEditingPrayer(null)
    setRefreshKey(prev => prev + 1) // Refresh data
  }

  // Debug logging (remove in production)
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 WeeklyWallClient Debug:', {
      weekStart,
      readOnly,
      hasHandleEdit: typeof handleEdit === 'function',
      hasHandleDelete: typeof handleDelete === 'function',
      refreshKey
    })
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Header */}
        <section className="bg-white/70 backdrop-blur-sm rounded-xl border border-white/20 shadow-sm p-4 sm:p-6">
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
              <Button onClick={() => setShowForm(!showForm)} className="px-4 sm:px-6 py-3 text-base sm:text-lg min-h-[44px] touch-manipulation w-full sm:w-auto">
                {showForm ? "Cancel" : "Submit a Prayer"}
              </Button>
            )}
          </div>
        </section>

        {/* Wall */}
        <section className="bg-white/70 backdrop-blur-sm rounded-xl border border-white/20 shadow-sm p-4 sm:p-6">
          <PrayerWall 
            weekStart={weekStart} 
            onEdit={!readOnly ? handleEdit : undefined}
            onDelete={!readOnly ? handleDelete : undefined}
            refreshKey={refreshKey}
          />
        </section>
      </div>

      {/* Modal Form */}
      {!readOnly && showForm && (
        <div className="fixed inset-0 z-modal bg-black/50 backdrop-blur-sm flex justify-center items-center">
          <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-xl mx-4">
            <h2 className="text-2xl font-semibold text-gray-700 mb-6">
              {editingPrayer ? 'Edit Prayer' : 'Share a Prayer'}
            </h2>
            <PrayerForm
              weekStart={weekStart}
              mode={editingPrayer ? 'edit' : 'create'}
              prayerId={editingPrayer?.id}
              initialValues={editingPrayer ? {
                content: editingPrayer.content,
                author_name: editingPrayer.author_name || ''
              } : undefined}
              onPost={handleFormClose}
              onCancel={handleFormClose}
            />
          </div>
        </div>
      )}
    </main>
  )
}