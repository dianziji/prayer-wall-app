import type { Database } from './database.types'

// 单行别名，之后全项目引用
// 原始表行
type PrayerRow = Database['public']['Tables']['prayers']['Row']

// 在此基础上加视图返回的两个字段
export type Prayer = PrayerRow & {
  like_count: number
  liked_by_me: boolean
}
export type CommentRow= Database['public']['Tables']['comments']['Row']

export type Comment= CommentRow & {
  author_name: string
}