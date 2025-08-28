'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Locale, DEFAULT_LOCALE, detectLocale, validateLocale, translations, formatDate, formatNumber, formatWeekDisplay } from '@/lib/i18n'
import { useSession } from '@/lib/useSession'
import { createBrowserSupabase } from '@/lib/supabase-browser'
import { getFellowshipInfo as getFellowshipInfoModel, parseContentWithMarkers, FELLOWSHIP_OPTIONS } from '@/types/models'
import type { TablesUpdate } from '@/types/database.types'

interface LocaleContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string) => string
}

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined)

interface LocaleProviderProps {
  children: ReactNode
  initialLocale?: Locale
  organizationLocale?: Locale | null
}

export function LocaleProvider({ 
  children, 
  initialLocale,
  organizationLocale 
}: LocaleProviderProps) {
  const { session, profile } = useSession()
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE)
  
  // Simple client-side initialization
  useEffect(() => {
    // Load saved locale from localStorage or use default
    const savedLocale = typeof window !== 'undefined' 
      ? localStorage.getItem('preferred-locale') 
      : null
      
    if (savedLocale && validateLocale(savedLocale) !== DEFAULT_LOCALE) {
      console.log('💾 Loading saved locale:', savedLocale)
      setLocaleState(validateLocale(savedLocale))
    }
  }, [])

  // Update locale when user profile loads with saved preference
  useEffect(() => {
    if (profile?.language_preference && profile.language_preference !== locale) {
      console.log('👤 Using user profile locale:', profile.language_preference)
      setLocaleState(validateLocale(profile.language_preference))
    }
  }, [profile?.language_preference, locale])

  const setLocale = async (newLocale: Locale) => {
    const validated = validateLocale(newLocale)
    console.log(`🌍 Language change: ${locale} -> ${validated}`)
    console.log('🔄 Updating locale state...')
    setLocaleState(validated)
    
    // Save to localStorage for persistence
    if (typeof window !== 'undefined') {
      localStorage.setItem('preferred-locale', validated)
    }
    
    // Update user profile in database if authenticated
    if (session?.user?.id) {
      try {
        const supabase = createBrowserSupabase()
        await supabase
          .from('user_profiles')
          .update({ language_preference: validated } as TablesUpdate<'user_profiles'>)
          .eq('user_id', session.user.id)
      } catch (error) {
        console.warn('Failed to save language preference:', error)
      }
    }
  }

  // Simple translation function
  const t = (key: string): string => {
    const localeTranslations = translations[locale] as Record<string, string>
    const defaultTranslations = translations[DEFAULT_LOCALE] as Record<string, string>
    return localeTranslations?.[key] || defaultTranslations?.[key] || key
  }

  const value: LocaleContextValue = {
    locale,
    setLocale,
    t
  }

  return (
    <LocaleContext.Provider value={value}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale() {
  const context = useContext(LocaleContext)
  if (context === undefined) {
    throw new Error('useLocale must be used within a LocaleProvider')
  }
  return context
}

// Hook for fellowship localization
export function useFellowshipInfo() {
  const { locale } = useLocale()
  
  return {
    getFellowshipInfo: (fellowship: string | null) => {
      return getFellowshipInfoModel(fellowship, locale === 'en' ? 'en' : 'zh-CN')
    },
    getFellowshipOptions: () => {
      return FELLOWSHIP_OPTIONS
    }
  }
}

// Hook for content parsing with locale
export function useContentParser() {
  const { locale } = useLocale()
  
  return {
    parseContentWithMarkers: (content: string) => {
      return parseContentWithMarkers(content, locale === 'en' ? 'en' : 'zh-CN')
    },
    generateMarkedContent: (thanksgiving: string | null, intercession: string | null) => {
      // Simple implementation to generate marked content
      if (thanksgiving && intercession) {
        return `感恩:${thanksgiving}|代祷:${intercession}`
      } else if (thanksgiving) {
        return `感恩:${thanksgiving}`
      } else if (intercession) {
        return `代祷:${intercession}`
      }
      return ''
    }
  }
}

// Helper hook for date/number formatting
export function useFormatting() {
  const { locale } = useLocale()
  
  return {
    formatDate: (date: string | Date) => {
      return formatDate(date, locale)
    },
    formatNumber: (num: number) => {
      return formatNumber(num, locale)
    },
    formatWeekDisplay: (weekStart: string) => {
      return formatWeekDisplay(weekStart, locale)
    }
  }
}