// components/demo-weekly-wall-client.tsx
"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { DemoPrayerWall } from "@/components/demo-prayer-wall"
import { Button } from "@/components/ui/button"
import { useLocale } from '@/lib/locale-context'

// Demo专用的Fellowship定义，避免使用MGC特定的团契
const DEMO_FELLOWSHIPS = {
  community: { 
    id: 'community' as const, 
    name_zh: '社区团契',
    name_en: 'Community Fellowship',
    description_zh: '社区聚会祷告分享',
    description_en: 'Community gathering prayer sharing',
    color: '#8b5cf6' 
  },
  youth: { 
    id: 'youth' as const, 
    name_zh: '青年团契',
    name_en: 'Youth Fellowship', 
    description_zh: '青年人聚会',
    description_en: 'Youth gathering',
    color: '#3b82f6' 
  },
  family: {
    id: 'family' as const,
    name_zh: '家庭团契',
    name_en: 'Family Fellowship',
    description_zh: '家庭聚会祷告',
    description_en: 'Family prayer gathering',
    color: '#10b981'
  },
  student: {
    id: 'student' as const,
    name_zh: '学生团契',
    name_en: 'Student Fellowship',
    description_zh: '在校学生团契',
    description_en: 'Student community fellowship',
    color: '#f59e0b'
  },
  senior: {
    id: 'senior' as const,
    name_zh: '长者团契',
    name_en: 'Senior Fellowship',
    description_zh: '长者聚会',
    description_en: 'Senior community',
    color: '#ef4444'
  },
  weekday: {
    id: 'weekday' as const,
    name_zh: '平日祷告',
    name_en: 'Weekday Prayer',
    description_zh: '日常祷告分享',
    description_en: 'Daily prayer sharing',
    color: '#6b7280'
  }
} as const

type DemoFellowship = keyof typeof DEMO_FELLOWSHIPS

type Props = {
  weekStart: string
}

export function DemoWeeklyWallClient({ weekStart }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t, locale } = useLocale()
  
  const [refreshKey, setRefreshKey] = useState(0)
  const [selectedFellowship, setSelectedFellowship] = useState<DemoFellowship | 'all'>('all')

  // Memoize demo fellowship options to ensure they update when locale changes
  const demoFellowshipOptions = useMemo(() => {
    return Object.values(DEMO_FELLOWSHIPS).map(fellowship => ({
      id: fellowship.id,
      name: locale === 'en' ? fellowship.name_en : fellowship.name_zh,
      description: locale === 'en' ? fellowship.description_en : fellowship.description_zh,
      color: fellowship.color
    }))
  }, [locale])

  // Get demo fellowship info helper
  const getDemoFellowshipInfo = (fellowship: DemoFellowship | string) => {
    const info = DEMO_FELLOWSHIPS[fellowship as DemoFellowship] || DEMO_FELLOWSHIPS.weekday
    return {
      ...info,
      displayName: locale === 'en' ? info.name_en : info.name_zh,
      displayDescription: locale === 'en' ? info.description_en : info.description_zh
    }
  }

  // Get fellowship from URL params
  useEffect(() => {
    const fellowship = searchParams.get('fellowship') as DemoFellowship | null
    setSelectedFellowship(fellowship || 'all')
  }, [searchParams])

  const handleFellowshipChange = (fellowship: DemoFellowship | 'all') => {
    const params = new URLSearchParams(searchParams.toString())
    if (fellowship === 'all') {
      params.delete('fellowship')
    } else {
      params.set('fellowship', fellowship)
    }
    const newUrl = `/demo${params.toString() ? '?' + params.toString() : ''}`
    router.push(newUrl)
  }

  const handleDemoSubmit = () => {
    alert(locale === 'en' 
      ? 'This is a demo. Please sign up to submit prayers.' 
      : '这是演示版本。请注册以提交祷告。'
    )
  }

  return (
    <main className="min-h-screen" style={{ backgroundColor: '#F8F6F0' }}>
      <div className="max-w-6xl lg:max-w-7xl xl:max-w-8xl mx-auto px-2 sm:px-6 py-4 sm:py-8 space-y-4 sm:space-y-6">
        {/* Header - 与真实祷告墙完全一致的布局 */}
        <section 
          className="rounded-lg sm:rounded-xl border-0 sm:border sm:border-white/20 shadow-none sm:shadow-sm p-3 sm:p-6"
          style={{ 
            background: 'radial-gradient(circle at top left, rgba(255, 215, 111, 0.5) 0%, rgba(255, 185, 108, 0.5) 20%, rgba(253, 226, 195, 0.5) 40%, rgba(168, 199, 255, 0.35) 65%, rgba(221, 238, 225, 0.8) 100%)'
          }}
        >
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <p className="text-gray-600">
                {locale === 'en' 
                  ? 'Share your prayers and find strength in our Demo Community' 
                  : '分享您的祷告，在我们的演示社区中寻找力量'
                }
              </p>
              <p className="text-sm text-gray-500 mt-1">{t('week_theme')}: {weekStart}</p>
            </div>

            <Button 
              onClick={handleDemoSubmit} 
              className="px-4 sm:px-6 py-3 text-base sm:text-lg min-h-[44px] touch-manipulation w-full sm:w-auto focus:outline-none focus:bg-transparent active:bg-transparent text-black hover:opacity-90"
              style={{ backgroundColor: '#ffca39' }}
            >
              {t('submit_prayer')}
            </Button>
          </div>
        </section>

        {/* Wall - 与真实祷告墙完全一致的布局 */}
        <section style={{ 
            background: 'linear-gradient(to top right, rgba(255, 215, 111, 0.2) 0%, rgba(255, 185, 108, 0.2) 20%, rgba(253, 226, 195, 0.2) 40%, rgba(168, 199, 255, 0.05) 65%, rgba(221, 238, 225, 0.5) 100%)'
          }} className="bg-transparent sm:bg-white/70 sm:backdrop-blur-sm rounded-lg sm:rounded-xl border-0 sm:border sm:border-white/20 shadow-none sm:shadow-sm p-0 sm:p-6">
         
          {/* Prayer Wall Header with Compact Filter - 与真实版本完全一致 */}
          <div className="flex items-center justify-between mb-2.5 px-0 sm:px-4 mx-auto max-w-6xl lg:max-w-7xl xl:max-w-8xl">
            <div className="flex items-center gap-2">
              <div 
                className="w-2 h-2 sm:w-3 sm:h-3 rounded-full" 
                style={{ 
                  backgroundColor: selectedFellowship === 'all' 
                    ? '#6b7280' 
                    : getDemoFellowshipInfo(selectedFellowship).color 
                }}
              />
              <span className="text-sm font-medium text-gray-700">
                {selectedFellowship === 'all' 
                  ? t('all') 
                  : getDemoFellowshipInfo(selectedFellowship).displayName}
              </span>
            </div>
            
            {/* Compact Fellowship Filter */}
            <select 
              value={selectedFellowship} 
              onChange={(e) => handleFellowshipChange(e.target.value as DemoFellowship | 'all')}
              className="text-xs bg-white/80 border border-white/40 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400 appearance-none cursor-pointer min-w-[80px]"
            >
              <option value="all">{t('all')}</option>
              {demoFellowshipOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>

          <DemoPrayerWall 
            weekStart={weekStart} 
            fellowship={selectedFellowship === 'all' ? undefined : selectedFellowship}
            refreshKey={refreshKey}
          />
        </section>
      </div>
    </main>
  )
}