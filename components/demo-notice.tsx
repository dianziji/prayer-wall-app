'use client'
import { Card, CardContent } from '@/components/ui/card'
import { Info } from 'lucide-react'
import Link from 'next/link'
import { useLocale } from '@/lib/locale-context'

export function DemoNotice() {
  const { locale } = useLocale()

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">
              {locale === 'en' ? 'Prayer Wall Demo' : '祷告墙演示'}
            </h3>
            <p className="text-blue-800 text-sm">
              {locale === 'en' 
                ? 'This is a demonstration of our bilingual prayer wall platform. All data shown here is sample content for demonstration purposes. Try switching languages using the button above!' 
                : '这是我们双语祷告墙平台的演示版本。此处显示的所有数据都是演示用的示例内容。试试点击上方的语言切换按钮！'
              }
            </p>
            <Link 
              href="/login" 
              className="inline-block mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              {locale === 'en' ? '→ Sign up for full version' : '→ 注册使用完整版本'}
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}