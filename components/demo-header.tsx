'use client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useLocale } from '@/lib/locale-context'

export default function DemoHeader() {
  const { locale, setLocale, t } = useLocale()

  const toggleLocale = () => {
    setLocale(locale === 'en' ? 'zh-CN' : 'en')
  }

  return (
    <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-30">
      <div className="h-14 sm:h-16 max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between">
        <Link href="/demo" className="font-bold text-base sm:text-lg text-gray-900 hover:text-indigo-600 transition-colors focus:outline-none focus:text-gray-900 active:text-gray-900">
          {locale === 'en' ? 'Prayer Wall Demo' : '祷告墙演示'}
        </Link>

        {/* Demo专用的右侧按钮 */}
        <div className="flex items-center gap-2">
          {/* 语言切换按钮 */}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={toggleLocale}
            className="focus:outline-none focus:bg-transparent active:bg-transparent"
          >
            {locale === 'en' ? '中文' : 'English'}
          </Button>
          
          <Button variant="ghost" size="sm" asChild>
            <Link href="/demo/archive" className="focus:outline-none focus:bg-transparent active:bg-transparent">
              {t('archive')}
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/login" className="focus:outline-none focus:bg-transparent active:bg-transparent">
              {t('login')}
            </Link>
          </Button>
        </div>
      </div>
    </header>
  )
}