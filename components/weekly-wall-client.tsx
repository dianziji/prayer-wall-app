// components/weekly-wall-client.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { PrayerWall } from "@/components/prayer-wall"
import { PrayerForm } from "@/components/prayer-form"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Prayer, Fellowship } from '@/types/models'
import { FELLOWSHIP_OPTIONS, getFellowshipInfo } from '@/types/models'

type Props = {
  weekStart: string
  readOnly: boolean
}

export function WeeklyWallClient({ weekStart, readOnly }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showForm, setShowForm] = useState(false)
  const [editingPrayer, setEditingPrayer] = useState<Prayer | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [selectedFellowship, setSelectedFellowship] = useState<Fellowship | 'all'>('all')

  // Get fellowship from URL params
  useEffect(() => {
    const fellowship = searchParams.get('fellowship') as Fellowship | null
    setSelectedFellowship(fellowship || 'all')
  }, [searchParams])

  const handleFellowshipChange = (fellowship: Fellowship | 'all') => {
    const params = new URLSearchParams(searchParams.toString())
    if (fellowship === 'all') {
      params.delete('fellowship')
    } else {
      params.set('fellowship', fellowship)
    }
    const newUrl = `/week/${weekStart}${params.toString() ? '?' + params.toString() : ''}`
    router.push(newUrl)
  }
  
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
                  : "Share your prayers and find strength in MGC"}
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
        <section          style={{ 
            background: 'linear-gradient(to top right, rgba(255, 215, 111, 0.2) 0%, rgba(255, 185, 108, 0.2) 20%, rgba(253, 226, 195, 0.2) 40%, rgba(168, 199, 255, 0.05) 65%, rgba(221, 238, 225, 0.5) 100%)'
          
          }} className="bg-transparent sm:bg-white/70 sm:backdrop-blur-sm rounded-lg sm:rounded-xl border-0 sm:border sm:border-white/20 shadow-none sm:shadow-sm p-0 sm:p-6">
         
          {/* Prayer Wall Header with Compact Filter - Aligned with cards */}
          <div className="flex items-center justify-between mb-2.5 px-0 sm:px-4 mx-auto max-w-6xl lg:max-w-7xl xl:max-w-8xl">
            <div className="flex items-center gap-2">
              <div 
                className="w-2 h-2 sm:w-3 sm:h-3 rounded-full" 
                style={{ 
                  backgroundColor: selectedFellowship === 'all' 
                    ? '#6b7280' 
                    : getFellowshipInfo(selectedFellowship).color 
                }}
              />
              <span className="text-sm font-medium text-gray-700">
                {selectedFellowship === 'all' 
                  ? '所有祷告' 
                  : getFellowshipInfo(selectedFellowship).name}
              </span>
            </div>
            
            {/* Compact Fellowship Filter */}
            <select 
              value={selectedFellowship} 
              onChange={(e) => handleFellowshipChange(e.target.value as Fellowship | 'all')}
              className="text-xs bg-white/80 border border-white/40 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400 appearance-none cursor-pointer min-w-[80px]"
            >
              <option value="all">全部</option>
              {FELLOWSHIP_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>

          <PrayerWall 
            weekStart={weekStart} 
            fellowship={selectedFellowship === 'all' ? undefined : selectedFellowship}
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
                thanksgiving_content: (editingPrayer as any).thanksgiving_content || undefined,
                intercession_content: (editingPrayer as any).intercession_content || undefined,
                author_name: editingPrayer.author_name || '',
                fellowship: (editingPrayer as any).fellowship || undefined
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