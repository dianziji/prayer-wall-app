'use client'
import { Card, CardContent } from '@/components/ui/card'
import { Info } from 'lucide-react'
import { useLocale } from '@/lib/locale-context'

interface DemoWeekNoticeProps {
  weekStart: string
}

export function DemoWeekNotice({ weekStart }: DemoWeekNoticeProps) {
  const { locale } = useLocale()

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">
              {locale === 'en' ? 'Demo Week View' : '演示周查看'}
            </h3>
            <p className="text-blue-800 text-sm">
              {locale === 'en' 
                ? `Viewing sample prayer data for the week of ${new Date(weekStart).toLocaleDateString('en-US')}. This is demonstration content only.`
                : `查看 ${new Date(weekStart).toLocaleDateString('zh-CN')} 这一周的示例祷告数据。这仅是演示内容。`
              }
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}