'use client'

import { useState } from 'react'
import { createBrowserSupabase } from '@/lib/supabase-browser'

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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-modal">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800">
              📥 Export Prayers
            </h2>
            <button
              onClick={onClose}
              disabled={isExporting}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded disabled:opacity-50"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Format selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Export Format
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="txt"
                  checked={format === 'txt'}
                  onChange={(e) => setFormat(e.target.value as ExportFormat)}
                  className="mr-2"
                  disabled={isExporting}
                />
                <span className="text-sm">Text File (.txt) - Readable format</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="json"
                  checked={format === 'json'}
                  onChange={(e) => setFormat(e.target.value as ExportFormat)}
                  className="mr-2"
                  disabled={isExporting}
                />
                <span className="text-sm">JSON (.json) - Structured data</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="csv"
                  checked={format === 'csv'}
                  onChange={(e) => setFormat(e.target.value as ExportFormat)}
                  className="mr-2"
                  disabled={isExporting}
                />
                <span className="text-sm">CSV (.csv) - Spreadsheet format</span>
              </label>
            </div>
          </div>

          {/* Date range selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Range
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              disabled={isExporting}
            >
              <option value="all">All Time ({prayers.length} prayers)</option>
              <option value="this_month">This Month</option>
              <option value="last_3_months">Last 3 Months</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {filteredCount} prayers will be exported
            </p>
          </div>

          {/* Export preview info */}
          <div className="mb-6 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="text-sm text-gray-600">
              <p><strong>Export will include:</strong></p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Prayer content and dates</li>
                <li>Author names</li>
                <li>Like and comment counts</li>
                <li>Export metadata</li>
              </ul>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              disabled={isExporting}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting || filteredCount === 0}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {isExporting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Exporting...
                </div>
              ) : (
                `Export ${filteredCount} Prayers`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}