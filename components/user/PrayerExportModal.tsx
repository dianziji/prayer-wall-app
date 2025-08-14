'use client'

import { useState } from 'react'
import { createBrowserSupabase } from '@/lib/supabase-browser'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, Download, FileText, Code, Table } from 'lucide-react'

interface Prayer {
  id: string
  content: string
  author_name: string | null
  user_id: string | null
  created_at: string | null
  like_count: number | null
  comment_count?: number
}

interface PrayerExportModalProps {
  isOpen: boolean
  onClose: () => void
  prayers: Prayer[]
}

type ExportFormat = 'txt' | 'json' | 'csv'

export default function PrayerExportModal({ 
  isOpen, 
  onClose, 
  prayers 
}: PrayerExportModalProps) {
  const [format, setFormat] = useState<ExportFormat>('txt')
  const [dateRange, setDateRange] = useState('all') // all, this_month, last_3_months
  const [isExporting, setIsExporting] = useState(false)

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Unknown date'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filterPrayersByDate = (prayers: Prayer[]) => {
    if (dateRange === 'all') return prayers

    const now = new Date()
    let cutoffDate: Date

    if (dateRange === 'this_month') {
      cutoffDate = new Date(now.getFullYear(), now.getMonth(), 1)
    } else if (dateRange === 'last_3_months') {
      cutoffDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
    } else {
      return prayers
    }

    return prayers.filter(prayer => {
      if (!prayer.created_at) return false
      return new Date(prayer.created_at) >= cutoffDate
    })
  }

  const exportToTxt = (prayers: Prayer[]) => {
    const content = prayers.map(prayer => {
      return `Date: ${formatDate(prayer.created_at)}
Author: ${prayer.author_name || 'Anonymous'}
Prayer: ${prayer.content}
Likes: ${prayer.like_count || 0}, Comments: ${prayer.comment_count || 0}
${'='.repeat(50)}
`
    }).join('\n')

    const header = `My Prayer Journal Export
Generated on: ${new Date().toLocaleDateString('en-US')}
Total prayers: ${prayers.length}

${'='.repeat(50)}

`

    return header + content
  }

  const exportToJson = (prayers: Prayer[]) => {
    const exportData = {
      export_date: new Date().toISOString(),
      total_prayers: prayers.length,
      prayers: prayers.map(prayer => ({
        id: prayer.id,
        content: prayer.content,
        author_name: prayer.author_name,
        created_at: prayer.created_at,
        like_count: prayer.like_count,
        comment_count: prayer.comment_count
      }))
    }
    
    return JSON.stringify(exportData, null, 2)
  }

  const exportToCsv = (prayers: Prayer[]) => {
    const headers = ['Date', 'Author', 'Content', 'Likes', 'Comments']
    const csvContent = [
      headers.join(','),
      ...prayers.map(prayer => [
        `"${formatDate(prayer.created_at)}"`,
        `"${prayer.author_name || 'Anonymous'}"`,
        `"${prayer.content.replace(/"/g, '""')}"`, // Escape quotes
        prayer.like_count || 0,
        prayer.comment_count || 0
      ].join(','))
    ].join('\n')

    return csvContent
  }

  const handleExport = async () => {
    setIsExporting(true)

    try {
      const filteredPrayers = filterPrayersByDate(prayers)
      
      if (filteredPrayers.length === 0) {
        alert('No prayers to export for the selected date range.')
        return
      }

      let content: string
      let filename: string
      let mimeType: string

      switch (format) {
        case 'txt':
          content = exportToTxt(filteredPrayers)
          filename = `prayers_${dateRange}_${new Date().toISOString().split('T')[0]}.txt`
          mimeType = 'text/plain'
          break
        case 'json':
          content = exportToJson(filteredPrayers)
          filename = `prayers_${dateRange}_${new Date().toISOString().split('T')[0]}.json`
          mimeType = 'application/json'
          break
        case 'csv':
          content = exportToCsv(filteredPrayers)
          filename = `prayers_${dateRange}_${new Date().toISOString().split('T')[0]}.csv`
          mimeType = 'text/csv'
          break
        default:
          throw new Error('Unsupported format')
      }

      // Create and download file
      const blob = new Blob([content], { type: mimeType })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      onClose()
    } catch (error) {
      console.error('Export error:', error)
      alert('Failed to export prayers. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const filteredCount = filterPrayersByDate(prayers).length

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export Prayers
          </DialogTitle>
          <DialogDescription>
            Download your prayers in various formats
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Format selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Export Format</Label>
            <RadioGroup value={format} onValueChange={(value) => setFormat(value as ExportFormat)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="txt" id="txt" disabled={isExporting} />
                <Label htmlFor="txt" className="flex items-center gap-2 text-sm">
                  <FileText className="w-4 h-4" />
                  Text File (.txt) - Readable format
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="json" id="json" disabled={isExporting} />
                <Label htmlFor="json" className="flex items-center gap-2 text-sm">
                  <Code className="w-4 h-4" />
                  JSON (.json) - Structured data
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="csv" id="csv" disabled={isExporting} />
                <Label htmlFor="csv" className="flex items-center gap-2 text-sm">
                  <Table className="w-4 h-4" />
                  CSV (.csv) - Spreadsheet format
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Date range selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Date Range</Label>
            <Select value={dateRange} onValueChange={setDateRange} disabled={isExporting}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time ({prayers.length} prayers)</SelectItem>
                <SelectItem value="this_month">This Month</SelectItem>
                <SelectItem value="last_3_months">Last 3 Months</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {filteredCount} prayers will be exported
            </p>
          </div>

          {/* Export preview info */}
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">
                <p className="font-medium mb-2">Export will include:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Prayer content and dates</li>
                  <li>Author names</li>
                  <li>Like and comment counts</li>
                  <li>Export metadata</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Action buttons */}
          <div className="flex justify-end gap-3">
            <Button
              onClick={onClose}
              disabled={isExporting}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              onClick={handleExport}
              disabled={isExporting || filteredCount === 0}
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                `Export ${filteredCount} Prayers`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}