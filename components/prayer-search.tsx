"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Search, Filter, X } from 'lucide-react'
import { useLocale, useFellowshipInfo } from '@/lib/locale-context'
import type { Fellowship } from '@/types/models'

interface SearchFilters {
  text?: string
  fellowship?: Fellowship | 'all'
  prayerType?: 'all' | 'thanksgiving' | 'intercession' | 'both'
  dateRange?: 'week' | 'month' | 'all'
}

interface PrayerSearchProps {
  onFiltersChange: (filters: SearchFilters) => void
  currentWeek: string
}

export function PrayerSearch({ onFiltersChange, currentWeek }: PrayerSearchProps) {
  const { t } = useLocale()
  const { getFellowshipOptions } = useFellowshipInfo()
  const [isExpanded, setIsExpanded] = useState(false)
  const [filters, setFilters] = useState<SearchFilters>({
    fellowship: 'all',
    prayerType: 'all', 
    dateRange: 'week'
  })

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const clearFilters = () => {
    const clearedFilters: SearchFilters = {
      fellowship: 'all',
      prayerType: 'all',
      dateRange: 'week'
    }
    setFilters(clearedFilters)
    onFiltersChange(clearedFilters)
  }

  const hasActiveFilters = filters.text || 
    filters.fellowship !== 'all' || 
    filters.prayerType !== 'all' ||
    filters.dateRange !== 'week'

  return (
    <div className="space-y-3">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder={t('search_placeholder')}
          value={filters.text || ''}
          onChange={(e) => updateFilter('text', e.target.value || undefined)}
          className="pl-10"
        />
      </div>

      {/* Filter Toggle */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2"
        >
          <Filter className="w-4 h-4" />
          {t('filters')}
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-1">
              {Object.values(filters).filter(v => v && v !== 'all' && v !== 'week').length}
            </Badge>
          )}
        </Button>
        
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="flex items-center gap-1 text-gray-500"
          >
            <X className="w-3 h-3" />
            {t('clear')}
          </Button>
        )}
      </div>

      {/* Advanced Filters */}
      {isExpanded && (
        <div className="grid gap-3 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Fellowship Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('fellowship')}</label>
              <Select value={filters.fellowship} onValueChange={(value) => updateFilter('fellowship', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('all')}</SelectItem>
                  {getFellowshipOptions().map(option => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Prayer Type Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('prayer_type')}</label>
              <Select value={filters.prayerType} onValueChange={(value) => updateFilter('prayerType', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('all')}</SelectItem>
                  <SelectItem value="thanksgiving">{t('thanksgiving_content')}</SelectItem>
                  <SelectItem value="intercession">{t('intercession_content')}</SelectItem>
                  <SelectItem value="both">{t('both_types')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Range Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('date_range')}</label>
              <Select value={filters.dateRange} onValueChange={(value) => updateFilter('dateRange', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">{t('this_week')}</SelectItem>
                  <SelectItem value="month">{t('this_month')}</SelectItem>
                  <SelectItem value="all">{t('all_time')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}