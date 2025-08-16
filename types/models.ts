import type { Database } from './database.types'

// Fellowship types
export type Fellowship = 'sunday' | 'ypf' | 'jcf' | 'student' | 'lic' | 'weekday'

export const FELLOWSHIPS = {
  sunday: { id: 'sunday' as const, name: '主日祷告', color: '#8b5cf6' },
  ypf: { id: 'ypf' as const, name: 'YPF团契', color: '#3b82f6' },
  jcf: { id: 'jcf' as const, name: 'JCF团契', color: '#10b981' },
  student: { id: 'student' as const, name: '学生团契', color: '#f59e0b' },
  lic: { id: 'lic' as const, name: 'LIC团契', color: '#ef4444' },
  weekday: { id: 'weekday' as const, name: '平日祷告', color: '#6b7280' },
} as const

export const FELLOWSHIP_OPTIONS = Object.values(FELLOWSHIPS)

// Fellowship helper functions
export function getFellowshipInfo(fellowship: Fellowship | string | null) {
  if (!fellowship || !(fellowship in FELLOWSHIPS)) {
    return FELLOWSHIPS.weekday
  }
  return FELLOWSHIPS[fellowship as Fellowship]
}

// 单行别名，之后全项目引用
// 原始表行
type PrayerRow = Database['public']['Tables']['prayers']['Row']

// 在此基础上加视图返回的两个字段
export type Prayer = PrayerRow & {
  like_count: number
  liked_by_me: boolean
  fellowship?: Fellowship | string | null
}

// Note: FellowshipConfig type will be available after running the migration
export type CommentRow= Database['public']['Tables']['comments']['Row']

export type Comment= CommentRow & {
  author_name: string
}

// Prayer category constants and types
export const PRAYER_COLORS = {
  thanksgiving: '#faf0da', // 感恩背景色
  intercession: '#dde4f4',  // 代祷背景色
  mixed: '#ddeee1',        // 混合背景色
} as const

export type PrayerContentType = 'thanksgiving' | 'intercession' | 'mixed' | 'legacy'

// Helper function to parse content with markers
export function parseContentWithMarkers(content: string): {
  thanksgiving: string | null
  intercession: string | null
  hasMarkers: boolean
} {
  if (!content) return { thanksgiving: null, intercession: null, hasMarkers: false }
  
  // Check for new compact format: "感恩:content|代祷:content"
  if (content.includes('感恩:') || content.includes('代祷:')) {
    const parts = content.split('|')
    let thanksgiving = null
    let intercession = null
    
    parts.forEach(part => {
      if (part.startsWith('感恩:')) {
        thanksgiving = part.substring(3).trim()
      } else if (part.startsWith('代祷:')) {
        intercession = part.substring(3).trim()
      }
    })
    
    return { thanksgiving, intercession, hasMarkers: true }
  }
  
  // Fallback to old format: "[感恩] content\n\n[代祷] content"
  const thanksgivingMatch = content.match(/\[感恩\]\s*(.*?)(?=\n\n\[代祷\]|$)/)
  const intercessionMatch = content.match(/\[代祷\]\s*(.*?)(?=\n\n\[感恩\]|$)/)
  
  const thanksgiving = thanksgivingMatch ? thanksgivingMatch[1].trim() : null
  const intercession = intercessionMatch ? intercessionMatch[1].trim() : null
  const hasMarkers = content.includes('[感恩]') || content.includes('[代祷]')
  
  return { thanksgiving, intercession, hasMarkers }
}

// Helper function to determine prayer content type
export function getPrayerContentType(prayer: Prayer): PrayerContentType {
  const hasContent = prayer.content && prayer.content.trim().length > 0
  const hasThanksgiving = (prayer as any).thanksgiving_content && (prayer as any).thanksgiving_content.trim().length > 0
  const hasIntercession = (prayer as any).intercession_content && (prayer as any).intercession_content.trim().length > 0
  
  // Check for new format first
  if (hasThanksgiving && hasIntercession) return 'mixed'
  if (hasThanksgiving) return 'thanksgiving'
  if (hasIntercession) return 'intercession'
  
  // Check for parsed markers in content
  if (hasContent) {
    const parsed = parseContentWithMarkers(prayer.content)
    if (parsed.hasMarkers) {
      if (parsed.thanksgiving && parsed.intercession) return 'mixed'
      if (parsed.thanksgiving) return 'thanksgiving'
      if (parsed.intercession) return 'intercession'
    }
    return 'legacy'
  }
  
  return 'legacy'
}

// Helper function to get prayer border style
export function getPrayerBorderStyle(contentType: PrayerContentType): string {
  switch (contentType) {
    case 'thanksgiving':
      return 'border sm:border-2'
    case 'intercession':
      return 'border sm:border-2'
    case 'mixed':
      return 'border sm:border-2'
    case 'legacy':
    default:
      return 'bg-white border-gray-200'
  }
}

// Helper function to get border color for cards
export function getPrayerBorderColor(contentType: PrayerContentType): string {
  // Convert hex to rgba with full opacity for border
  const hexToRgba = (hex: string, alpha: number = 1) => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  switch (contentType) {
    case 'thanksgiving':
      return hexToRgba(PRAYER_COLORS.thanksgiving)
    case 'intercession':
      return hexToRgba(PRAYER_COLORS.intercession)
    case 'mixed':
      return hexToRgba(PRAYER_COLORS.mixed)
    case 'legacy':
    default:
      return '#e5e7eb' // gray-200
  }
}

// Helper function to get background color for cards
export function getPrayerBackgroundColor(contentType: PrayerContentType): string {
  switch (contentType) {
    case 'thanksgiving':
      return PRAYER_COLORS.thanksgiving
    case 'intercession':
      return PRAYER_COLORS.intercession
    case 'mixed':
      return PRAYER_COLORS.mixed
    case 'legacy':
    default:
      return '#ffffff' // 白色背景
  }
}