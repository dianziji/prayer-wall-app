"use client"
import { useEffect, useState } from "react"
import { PrayerCard } from "./prayer-card"
import Masonry from 'react-masonry-css'
import type { Prayer, Fellowship } from '@/types/models'
import { useLocale } from '@/lib/locale-context'

const breakpointColumnsObj = {
  default: 4,  // 4 columns for desktop
  1024: 3,     // 3 columns for tablet
  640: 2,      // 2 columns for mobile
}

// Demo fellowship映射
const DEMO_FELLOWSHIP_MAPPING: Record<string, string> = {
  'community': 'sunday',
  'youth': 'ypf', 
  'family': 'jcf',
  'student': 'student',
  'senior': 'lic',
  'weekday': 'weekday'
}

export function DemoPrayerWall({ 
  weekStart, 
  fellowship,
  refreshKey 
}: { 
  weekStart: string;
  fellowship?: string;
  refreshKey?: number;
}) {
  const { t } = useLocale()
  const [prayers, setPrayers] = useState<Prayer[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    let isMounted = true
    setLoading(true)
    setError(null)

    // 将demo fellowship映射到实际的API fellowship参数
    const mappedFellowship = fellowship ? DEMO_FELLOWSHIP_MAPPING[fellowship] || fellowship : undefined
    const fellowshipParam = mappedFellowship ? `&fellowship=${encodeURIComponent(mappedFellowship)}` : ''
    const url = `/api/demo/prayers?week_start=${encodeURIComponent(weekStart)}${fellowshipParam}`
    
    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((data) => {
        if (!isMounted) return
        // Handle both old API format (array) and new API format (object with prayers array)
        if (Array.isArray(data)) {
          // Old format - direct array of prayers
          setPrayers(data)
        } else if (data && Array.isArray(data.prayers)) {
          // New format - object with prayers array and metadata
          setPrayers(data.prayers)
          // TODO: Use other metadata like wall.theme, wall.stats in future
        } else {
          setPrayers([])
        }
      })
      .catch(() => {
        if (!isMounted) return
        setError(t('loading_error'))
        setPrayers([])
      })
      .finally(() => {
        if (!isMounted) return
        setLoading(false)
      })

    return () => { isMounted = false }
  }, [weekStart, fellowship, refreshKey]) // eslint-disable-line react-hooks/exhaustive-deps

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
                  authorAvatarUrl={null} // Demo版本不显示头像
                  onEdit={undefined} // Demo版本不支持编辑
                  onDelete={undefined} // Demo版本不支持删除
                  prayerWeek={weekStart}
                  authorPrivacyWeeks={null} // Demo版本不需要隐私设置
                  readOnly={true} // 设置为只读
                />
              ))
            : [
                <div
                  key="empty"
                  className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center text-gray-500"
                >
                  {t('no_prayers_message')}
                </div>,
              ]}
      </Masonry>
    </div>
  )
}