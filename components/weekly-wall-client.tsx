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
    <main className="min-h-screen" style={{ backgroundColor: '#F8F6F0' }}>
      <div className="max-w-6xl lg:max-w-7xl xl:max-w-8xl mx-auto px-2 sm:px-6 py-4 sm:py-8 space-y-4 sm:space-y-6">
        {/* Header */}
        <section 
          className="rounded-lg sm:rounded-xl border-0 sm:border sm:border-white/20 shadow-none sm:shadow-sm p-3 sm:p-6"
          style={{ 
            background: 'radial-gradient(circle at top left, rgba(255, 215, 111, 0.5) 0%, rgba(255, 185, 108, 0.5) 20%, rgba(253, 226, 195, 0.5) 40%, rgba(168, 199, 255, 0.35) 65%, rgba(221, 238, 225, 0.8) 100%)'
          }}
        >
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
              <Button 
                onClick={() => setShowForm(!showForm)} 
                className="px-4 sm:px-6 py-3 text-base sm:text-lg min-h-[44px] touch-manipulation w-full sm:w-auto focus:outline-none focus:bg-transparent active:bg-transparent text-black hover:opacity-90"
                style={{ backgroundColor: '#ffca39' }}
              >
                {showForm ? "Cancel" : "Submit a Prayer"}
              </Button>
            )}
          </div>
        </section>

        {/* Wall */}
        <section className="bg-transparent sm:bg-white/70 sm:backdrop-blur-sm rounded-lg sm:rounded-xl border-0 sm:border sm:border-white/20 shadow-none sm:shadow-sm p-0 sm:p-6">
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
        <div className="fixed inset-0 z-modal bg-black/50 backdrop-blur-sm flex justify-center items-end sm:items-center">
          <div className="bg-white rounded-t-xl sm:rounded-xl shadow-2xl p-4 sm:p-8 w-full max-w-xl mx-0 sm:mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg sm:text-2xl font-semibold text-gray-700 mb-4 sm:mb-6">
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