// lib/useSession.ts
'use client'

import { useEffect, useState } from 'react'
import { createBrowserSupabase } from '@/lib/supabase-browser'   // ← 你已有的浏览器端 client
import type { User } from '@supabase/supabase-js'

export type UserProfile = {
  user_id: string
  username: string | null
  avatar_url: string | null
  default_fellowship?: string | null
  birthday?: string | null
  prayers_visibility_weeks?: number | null
}

// 全局缓存以避免重复查询同一用户的profile
const profileCache = new Map<string, { profile: UserProfile | null; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5分钟缓存

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
      if (data.session) {
        // 立即设置一个基础profile，避免等待
        const user = data.session.user
        const quickName = user.user_metadata?.full_name || 
                          user.user_metadata?.name || 
                          user.email?.split('@')[0] || 
                          `user-${user.id.slice(0, 6)}`
        
        setProfile({
          user_id: user.id,
          username: quickName,
          avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null
        })
        
        // 然后异步加载完整的profile
        loadProfile(data.session.user)
      }
    })

    // 监听登录 / 登出
    const { data: { subscription } } = supa.auth.onAuthStateChange(
      (_ev, sess) => {
        setSession(sess)
        if (sess) {
          // 同样的立即设置逻辑
          const user = sess.user
          const quickName = user.user_metadata?.full_name || 
                            user.user_metadata?.name || 
                            user.email?.split('@')[0] || 
                            `user-${user.id.slice(0, 6)}`
          
          setProfile({
            user_id: user.id,
            username: quickName,
            avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null
          })
          
          loadProfile(sess.user)
        } else {
          setProfile(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // 拉取 / 初始化 profile：若不存在或 username/avatar_url 为空，则用 Google/user_metadata 补全
  async function loadProfile(user: User) {
    const uid = user.id

    // 检查缓存
    const cached = profileCache.get(uid)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setProfile(cached.profile)
      return
    }

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
    // Note: Birthday is only set manually by users in Account Settings
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
    // Try Google identity if available (prioritize Google over email provider)
    if ((!displayName || !avatarUrl) && Array.isArray(user.identities) && user.identities.length > 0) {
      // Look for Google provider first
      const googleIdentity = user.identities.find(identity => identity.provider === 'google')
      const identityData = googleIdentity?.identity_data || user.identities[0]?.identity_data
      
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
    const fallbackBirthday = null // Birthday is always null from OAuth, only set manually

    // 1) 安全查询（0 行不报错）
    const { data: row } = await supa
      .from('user_profiles')
      .select('user_id, username, avatar_url, default_fellowship, birthday, prayers_visibility_weeks')
      .eq('user_id', uid)
      .maybeSingle()

    const current = row as UserProfile | null
    
    // 快速设置基本profile信息，让username立即可用
    const quickProfile = {
      user_id: uid,
      username: current?.username || fallbackName,
      avatar_url: current?.avatar_url || fallbackAvatar,
      birthday: current?.birthday || fallbackBirthday,
      prayers_visibility_weeks: current?.prayers_visibility_weeks || null,
    }
    setProfile(quickProfile)
    
    // 更新缓存
    profileCache.set(uid, { profile: quickProfile, timestamp: Date.now() })

    // 2) 计算目标用户名/头像/生日；头像若为 Google 源则尝试镜像到 Storage
    let desiredName = current?.username || fallbackName
    let desiredAvatar = current?.avatar_url || fallbackAvatar
    let desiredBirthday = current?.birthday || fallbackBirthday

    // 后台异步处理头像镜像和数据库更新，不阻塞UI
    const needUpsert = !current || !current.username || !current.avatar_url
    const needAvatarMirror = (!current?.avatar_url || isGoogleAvatar(current?.avatar_url)) && avatarUrl

    if (needAvatarMirror || needUpsert) {
      // 异步处理，不阻塞当前设置
      (async () => {
        // 如果需要头像镜像，先处理
        if (needAvatarMirror) {
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

        // 如果需要upsert，执行数据库更新
        if (needUpsert || desiredAvatar !== current?.avatar_url) {
          const { data: upserted } = await supa
            .from('user_profiles')
            .upsert({
              user_id: uid,
              username: desiredName,
              avatar_url: desiredAvatar ?? null,
            })
            .select('user_id, username, avatar_url, default_fellowship, birthday, prayers_visibility_weeks')
            .single()

          // 更新profile状态
          const finalProfile = (upserted as UserProfile) ?? {
            user_id: uid,
            username: desiredName,
            avatar_url: desiredAvatar ?? null,
            birthday: current?.birthday || null,
            prayers_visibility_weeks: current?.prayers_visibility_weeks || null,
          }
          setProfile(finalProfile)
          
          // 更新缓存
          profileCache.set(uid, { profile: finalProfile, timestamp: Date.now() })
        }
      })()
    }
  }

  return { session, profile }
}