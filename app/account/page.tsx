'use client'
import { useEffect, useState } from 'react'
import { createBrowserSupabase } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'

export default function AccountPage() {
  const router = useRouter()
  const [profile, setProfile] = useState({ username: '', avatar_url: '' })
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState<string | null>(null)
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    const supabase = createBrowserSupabase()
    ;(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        // Wait for any onAuthStateChange (e.g., after redirect)
        supabase.auth.onAuthStateChange((_event, sess) => {
          if (sess?.user) {
            fetchProfile(sess.user.id, sess.user.email ?? '')
          } else {
            router.replace('/login')
          }
          setAuthChecked(true)
        })
        return
      }
      await fetchProfile(session.user.id, session.user.email ?? '')
      setAuthChecked(true)
    })()
  }, [])

  async function fetchProfile(uid: string, email: string) {
    const supabase = createBrowserSupabase()

    // 0) Try to read Google metadata (name/avatar) from the current auth user
    const { data: authData } = await supabase.auth.getUser()
    const authUser = authData?.user
    const meta: any = authUser?.user_metadata ?? {}
    const identities: any[] = (authUser as any)?.identities ?? []
    const idMeta: any = identities?.[0]?.identity_data ?? {}

    // Prefer Google-provided fields, then fallback to email local-part, then uid
    const googleName: string | undefined = meta.full_name || meta.name || idMeta.full_name || idMeta.name
    const googleAvatar: string | undefined = meta.avatar_url || meta.picture || idMeta.avatar_url || idMeta.picture
    const fallbackNameFromEmail = (email || '').split('@')[0] || `user-${uid.slice(0, 6)}`

    // 1) Fetch existing profile row (0 rows is OK)
    const { data, error } = await supabase
      .from('user_profiles')
      .select('username,avatar_url')
      .eq('user_id', uid)
      .maybeSingle()

    const currentName = data?.username ?? ''
    const currentAvatar = data?.avatar_url ?? ''

    // Decide the desired (next) values
    const desiredName = currentName || googleName || fallbackNameFromEmail
    const desiredAvatar = currentAvatar || googleAvatar || ''

    // 2) Upsert only when missing row or missing critical fields
    if (!data || !currentName || (!currentAvatar && googleAvatar)) {
      await supabase
        .from('user_profiles')
        .upsert({
          user_id: uid,
          username: desiredName || null,
          avatar_url: desiredAvatar || null,
        })

      setProfile({ username: desiredName, avatar_url: desiredAvatar })
    } else {
      // already has both; just reflect it in UI
      setProfile({ username: currentName, avatar_url: currentAvatar })
    }

    setLoading(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createBrowserSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const { error } = await supabase.from('user_profiles').upsert({
      user_id: user.id,
      username: profile.username || null,
      avatar_url: profile.avatar_url || null
    })
    setLoading(false)
    setMsg(error ? error.message : 'Saved!')
  }

  if (!authChecked || loading) return <p className="p-8">Loading...</p>

  return (
    <main className="max-w-lg mx-auto p-8 space-y-6">
      <h1 className="text-2xl font-semibold">Account</h1>

      <form onSubmit={handleSave} className="space-y-4">
        <label className="block">
          <span className="text-sm text-gray-600">Username</span>
          <input
            type="text"
            maxLength={32}
            value={profile.username}
            onChange={e => setProfile({ ...profile, username: e.target.value })}
            className="w-full border rounded p-2"
          />
        </label>

        {/* 头像上传可后做；暂时只手动填 URL */}
        <label className="block">
          <span className="text-sm text-gray-600">Avatar URL</span>
          <input
            type="url"
            value={profile.avatar_url}
            onChange={e => setProfile({ ...profile, avatar_url: e.target.value })}
            className="w-full border rounded p-2"
          />
        </label>

        <button
          disabled={loading}
          className="bg-indigo-600 text-white rounded py-2 px-6 hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save'}
        </button>

        {msg && <p className="text-sm text-center text-gray-600">{msg}</p>}
      </form>
    </main>
  )
}