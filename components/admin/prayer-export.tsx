"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Download, FileText, FileSpreadsheet } from 'lucide-react'
import { useLocale, useFellowshipInfo } from '@/lib/locale-context'
import type { Fellowship } from '@/types/models'

interface ExportFilters {
  dateFrom?: string
  dateTo?: string
  fellowship?: Fellowship | 'all'
  prayerType?: 'all' | 'thanksgiving' | 'intercession' | 'both'
  format: 'csv' | 'json'
}

export function PrayerExport() {
  const { t } = useLocale()
  const { getFellowshipOptions } = useFellowshipInfo()
  const [filters, setFilters] = useState<ExportFilters>({
    fellowship: 'all',
    prayerType: 'all',
    format: 'csv'
  })
  const [isExporting, setIsExporting] = useState(false)

  const updateFilter = (key: keyof ExportFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleExport = async () => {
    setIsExporting(true)
    
    try {
      const params = new URLSearchParams()
      if (filters.dateFrom) params.set('date_from', filters.dateFrom)
      if (filters.dateTo) params.set('date_to', filters.dateTo)
      if (filters.fellowship && filters.fellowship !== 'all') params.set('fellowship', filters.fellowship)
      if (filters.prayerType && filters.prayerType !== 'all') params.set('prayer_type', filters.prayerType)
      params.set('format', filters.format)

      const response = await fetch(`/api/admin/export-prayers?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`)
      }

      if (filters.format === 'json') {
        const data = await response.json()
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `prayers_export_${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      } else {
        // CSV format
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = response.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || 'prayers_export.csv'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }

    } catch (error) {
      console.error('Export error:', error)
      alert('Export failed. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="w-5 h-5" />
          Export Prayers
        </CardTitle>
        <CardDescription>
          Export prayer data with customizable filters and formats
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Date Range */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Date From</label>
            <Input
              type="date"
              value={filters.dateFrom || ''}
              onChange={(e) => updateFilter('dateFrom', e.target.value || undefined)}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Date To</label>
            <Input
              type="date"
              value={filters.dateTo || ''}
              onChange={(e) => updateFilter('dateTo', e.target.value || undefined)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

          {/* Export Format */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Export Format</label>
            <Select value={filters.format} onValueChange={(value) => updateFilter('format', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4" />
                    CSV
                  </div>
                </SelectItem>
                <SelectItem value="json">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    JSON
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Export Button */}
        <div className="pt-4 border-t">
          <Button 
            onClick={handleExport} 
            disabled={isExporting}
            className="w-full md:w-auto"
          >
            {isExporting ? (
              <>Exporting...</>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Export Prayers
              </>
            )}
          </Button>
        </div>

        {/* Export Info */}
        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
          <p className="font-medium mb-1">Export Information:</p>
          <ul className="text-xs space-y-1">
            <li>• Maximum 1000 prayers per export</li>
            <li>• CSV format includes prayer content, author, fellowship, and metadata</li>
            <li>• JSON format includes full prayer objects with relationships</li>
            <li>• Exported data includes like counts and creation timestamps</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}