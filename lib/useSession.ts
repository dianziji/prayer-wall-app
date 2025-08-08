// lib/useSession.ts
'use client'

import { useEffect, useState } from 'react'
import { createBrowserSupabase } from '@/lib/supabase-browser'   // ← 你已有的浏览器端 client
import type { User } from '@supabase/supabase-js'

export type UserProfile = {
  user_id: string
  username: string | null
  avatar_url: string | null
}

export function useSession() {
  const supa = createBrowserSupabase()

  const [session, setSession] = useState<{
    user: User
    access_token: string
  } | null>(null)

  const [profile, setProfile] = useState<UserProfile | null>(null)

  // 初次加载
  useEffect(() => {
    supa.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null)
      if (data.session) loadProfile(data.session.user)
    })

    // 监听登录 / 登出
    const { data: { subscription } } = supa.auth.onAuthStateChange(
      (_ev, sess) => {
        setSession(sess)
        if (sess) loadProfile(sess.user)
        else setProfile(null)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // 拉取 / 初始化 profile：若不存在或 username/avatar_url 为空，则用 Google/user_metadata 补全
  async function loadProfile(user: User) {
    const uid = user.id

    const isGoogleAvatar = (u?: string | null) => {
      if (!u) return false
      try {
        const h = new URL(u).hostname
        return h.endsWith('googleusercontent.com')
      } catch {
        return false
      }
    }

    const email = user.email ?? ''
    // Try to get display_name and picture from user_metadata or Google identity
    let displayName: string | null = null
    let avatarUrl: string | null = null
    // user_metadata priority
    if (user.user_metadata) {
      displayName =
        user.user_metadata.full_name ||
        user.user_metadata.name ||
        user.user_metadata.display_name ||
        null
      avatarUrl =
        user.user_metadata.avatar_url ||
        user.user_metadata.picture ||
        null
    }
    // Try Google identity if available
    if ((!displayName || !avatarUrl) && Array.isArray(user.identities) && user.identities.length > 0) {
      const identityData = user.identities[0]?.identity_data
      if (identityData) {
        displayName =
          displayName ||
          identityData.full_name ||
          identityData.name ||
          identityData.display_name ||
          null
        avatarUrl =
          avatarUrl ||
          identityData.avatar_url ||
          identityData.picture ||
          null
      }
    }
    // Fallbacks
    const emailLocal = (email || '').split('@')[0] || ''
    const fallbackName = displayName || emailLocal || `user-${uid.slice(0, 6)}`
    const fallbackAvatar = avatarUrl ?? null

    // 1) 安全查询（0 行不报错）
    const { data: row } = await supa
      .from('user_profiles')
      .select('user_id, username, avatar_url')
      .eq('user_id', uid)
      .maybeSingle()

    const current = row as UserProfile | null

    // 2) 计算目标用户名/头像；头像若为 Google 源则尝试镜像到 Storage
    let desiredName = current?.username || fallbackName
    let desiredAvatar = current?.avatar_url || fallbackAvatar

    // 如果当前没有头像，或头像仍然是 Google 源，而我们拿到了 Google 头像 URL，则触发镜像
    if ((!current?.avatar_url || isGoogleAvatar(current?.avatar_url)) && avatarUrl) {
      try {
        const res = await fetch('/api/avatar/ingest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sourceUrl: avatarUrl })
        })
        if (res.ok) {
          const j = await res.json().catch(() => ({} as any))
          if (j?.url) desiredAvatar = j.url as string
        }
      } catch { /* ignore network errors; fallback to google url or null */ }
    }

    // 若没有行或用户名/头像缺失，或我们刚镜像出新的头像，则 upsert
    const needUpsert = !current || !current.username || !current.avatar_url || desiredAvatar !== current?.avatar_url
    if (needUpsert) {
      const { data: upserted } = await supa
        .from('user_profiles')
        .upsert({
          user_id: uid,
          username: desiredName,
          avatar_url: desiredAvatar ?? null,
        })
        .select('user_id, username, avatar_url')
        .single()

      setProfile(
        (upserted as UserProfile) ?? {
          user_id: uid,
          username: desiredName,
          avatar_url: desiredAvatar ?? null,
        }
      )
      return
    }

    // 3) 已有合法用户名和头像，直接设置
    setProfile(current)
  }

  return { session, profile }
}