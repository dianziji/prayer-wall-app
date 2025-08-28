'use client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Shield } from 'lucide-react'
import { useLocale } from '@/lib/locale-context'

export default function AdminDemoHeader() {
  const { locale, setLocale, t } = useLocale()

  const toggleLocale = () => {
    setLocale(locale === 'en' ? 'zh-CN' : 'en')
  }

  return (
    <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-30">
      <div className="h-14 sm:h-16 max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
        <Link href="/admin-demo" className="flex items-center gap-2 font-bold text-base sm:text-lg text-gray-900 hover:text-indigo-600 transition-colors">
          <Shield className="w-5 h-5 text-indigo-600" />
          {locale === 'en' ? 'Admin Demo' : '管理员演示'}
        </Link>

        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            {locale === 'en' ? 'Demo Admin' : '演示管理员'}
          </Badge>
          
          {/* 语言切换按钮 */}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={toggleLocale}
            className="focus:outline-none focus:bg-transparent active:bg-transparent"
          >
            {locale === 'en' ? '中文' : 'English'}
          </Button>
          
          <Button variant="outline" size="sm" asChild>
            <Link href="/demo" className="focus:outline-none focus:bg-transparent active:bg-transparent">
              {locale === 'en' ? 'Back to Demo' : '返回演示'}
            </Link>
          </Button>
        </div>
      </div>
    </header>
  )
}