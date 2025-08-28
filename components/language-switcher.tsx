'use client'

import { useLocale } from '@/lib/locale-context'
import { Locale, SUPPORTED_LOCALES } from '@/lib/i18n'

interface LanguageSwitcherProps {
  className?: string
}

export function LanguageSwitcher({ className = '' }: LanguageSwitcherProps) {
  const { locale, setLocale } = useLocale()

  const localeNames = {
    'zh-CN': '中文',
    'en': 'English'
  } as const

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {SUPPORTED_LOCALES.map((loc) => (
        <button
          key={loc}
          onClick={() => setLocale(loc)}
          className={`px-3 py-1 text-sm rounded-md transition-colors ${
            locale === loc
              ? 'bg-blue-500 text-white'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          {localeNames[loc]}
        </button>
      ))}
    </div>
  )
}

// Compact version for mobile/header
export function CompactLanguageSwitcher({ className = '' }: LanguageSwitcherProps) {
  const { locale, setLocale } = useLocale()

  const toggleLocale = () => {
    setLocale(locale === 'zh-CN' ? 'en' : 'zh-CN')
  }

  return (
    <button
      onClick={toggleLocale}
      className={`px-2 py-1 text-sm rounded border transition-colors ${
        locale === 'en' 
          ? 'border-blue-500 text-blue-600 bg-blue-50' 
          : 'border-gray-300 text-gray-600 hover:border-gray-400'
      } ${className}`}
      title={locale === 'zh-CN' ? 'Switch to English' : '切换到中文'}
    >
      {locale === 'zh-CN' ? 'EN' : '中'}
    </button>
  )
}