'use client'

import { useCallback } from 'react'
import useSWR from 'swr'
import { createBrowserSupabase } from '@/lib/supabase-browser'
import { useSession } from '@/lib/useSession'
import type { Comment } from '@/types/models'
import { CommentItem } from '@/components/comment-item'
import { Separator } from '@/components/ui/separator'

/**
 * 列出并管理指定祷告的评论
 * - 登录用户可以编辑 / 删除自己的评论
 * - 未登录用户只读
 */
export function CommentList({ prayerId }: { prayerId: string }) {
  const { session } = useSession()
  const supa = createBrowserSupabase()

  /* ---------------- fetcher ---------------- */
  const fetchComments = async (): Promise<Comment[]> => {
    // 1) fetch comments (no implicit joins)
    const { data: comments, error: cErr } = await supa
      .from('comments')
      .select('id, content, user_id, created_at, prayer_id')
      .eq('prayer_id', prayerId)
      .order('created_at', { ascending: false })
    if (cErr) throw cErr

    const rows = (comments ?? []) as Comment[]

    // 2) build unique user id list
    const ids = Array.from(new Set(rows.map(r => r.user_id).filter((x): x is string => Boolean(x))))

    if (ids.length === 0) {
      // No authors to resolve; return with fallback name
      return rows.map(r => ({ ...r, author_name: '匿名' }))
    }

    // 3) fetch profiles in bulk
    const { data: profiles, error: pErr } = await supa
      .from('user_profiles')
      .select('user_id, username')
      .in('user_id', ids)
    if (pErr) throw pErr

    const nameMap = new Map((profiles ?? []).map(p => [p.user_id as string, (p as any).username as string]))

    // 4) enrich rows with author_name for UI
    return rows.map(r => ({
      ...r,
      author_name: nameMap.get(r.user_id ?? '') ?? '匿名',
    })) as Comment[]
  }

  /* key 形如 ['comments', prayerId] 便于全局去重与缓存 */
  const {
    data: comments = [],
    error,
    isLoading,
    mutate,
  } = useSWR<Comment[], Error>(['comments', prayerId], fetchComments)

  /** 删除评论（仅本人） */
  const handleDelete = useCallback(
    async (id: string) => {
      const { error } = await supa.from('comments').delete().eq('id', id)
      if (!error) mutate()
    },
    [mutate, supa]
  )

  /** 更新评论内容（仅本人） */
  const handleEdit = useCallback(
    async (id: string, content: string) => {
      const { error } = await supa
        .from('comments')
        .update({ content })
        .eq('id', id)
      if (!error) mutate()
    },
    [mutate, supa]
  )

  if (error) return <p className="text-sm text-destructive">加载评论失败</p>
  if (isLoading) return <p className="text-sm text-muted-foreground">加载中…</p>

  if (comments.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-4">暂无评论</p>
  }

  return (
    <div className="space-y-0">
      {comments.map((c, index) => (
        <div key={c.id}>
          <CommentItem
            comment={c}
            isMine={session?.user.id === c.user_id}
            onDelete={handleDelete}
            onEdit={handleEdit}
          />
          {index < comments.length - 1 && (
            <Separator className="opacity-20 my-2" />
          )}
        </div>
      ))}
    </div>
  )
}