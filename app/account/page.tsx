'use client'
import { useEffect, useState } from 'react'
import { createBrowserSupabase } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { User, Link as LinkIcon, Bell, Calendar, Eye } from 'lucide-react'
import { BirthdayPicker } from '@/components/ui/birthday-picker'
import PrayerReminders from '@/components/user/PrayerReminders'

export default function AccountPage() {
  const router = useRouter()
  const [profile, setProfile] = useState({ username: '', avatar_url: '', birthday: '', prayers_visibility_weeks: null as number | null })
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
      .select('username,avatar_url,birthday,prayers_visibility_weeks')
      .eq('user_id', uid)
      .maybeSingle()

    const currentName = data?.username ?? ''
    const currentAvatar = data?.avatar_url ?? ''
    const currentBirthday = data?.birthday ?? ''
    const currentPrivacy = data?.prayers_visibility_weeks ?? null

    // Decide the desired (next) values
    const desiredName = currentName || googleName || fallbackNameFromEmail
    const desiredAvatar = currentAvatar || googleAvatar || ''
    const desiredBirthday = currentBirthday || ''
    const desiredPrivacy = currentPrivacy

    // 2) Upsert only when missing row or missing critical fields
    if (!data || !currentName || (!currentAvatar && googleAvatar)) {
      await supabase
        .from('user_profiles')
        .upsert({
          user_id: uid,
          username: desiredName || null,
          avatar_url: desiredAvatar || null,
        })

      setProfile({ username: desiredName, avatar_url: desiredAvatar, birthday: desiredBirthday, prayers_visibility_weeks: desiredPrivacy })
    } else {
      // already has both; just reflect it in UI
      setProfile({ username: currentName, avatar_url: currentAvatar, birthday: currentBirthday, prayers_visibility_weeks: currentPrivacy })
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
      avatar_url: profile.avatar_url || null,
      birthday: profile.birthday || null,
      prayers_visibility_weeks: profile.prayers_visibility_weeks || null
    })
    setLoading(false)
    setMsg(error ? (error instanceof Error ? error.message : 'Save error') : 'Saved!')
  }

  if (!authChecked || loading) {
    return (
      <main className="min-h-screen py-4 sm:py-8" style={{ backgroundColor: '#F8F6F0' }}>
        <div className="max-w-6xl lg:max-w-7xl xl:max-w-8xl mx-auto px-2 sm:px-6">
          <section 
            className="rounded-lg sm:rounded-xl border-0 sm:border sm:border-white/20 shadow-none sm:shadow-sm p-6"
            style={{ 
              background: 'radial-gradient(circle at top left, rgba(255, 215, 111, 0.5) 0%, rgba(255, 185, 108, 0.5) 20%, rgba(253, 226, 195, 0.5) 40%, rgba(168, 199, 255, 0.35) 65%, rgba(221, 238, 225, 0.8) 100%)'
            }}
          >
            <div className="flex items-center justify-center py-8">
              <p className="text-gray-600">Loading...</p>
            </div>
          </section>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen py-4 sm:py-8" style={{ backgroundColor: '#F8F6F0' }}>
      <div className="max-w-6xl lg:max-w-7xl xl:max-w-8xl mx-auto px-2 sm:px-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <section 
          className="rounded-lg sm:rounded-xl border-0 sm:border sm:border-white/20 shadow-none sm:shadow-sm p-3 sm:p-6"
          style={{ 
            background: 'radial-gradient(circle at top left, rgba(255, 215, 111, 0.5) 0%, rgba(255, 185, 108, 0.5) 20%, rgba(253, 226, 195, 0.5) 40%, rgba(168, 199, 255, 0.35) 65%, rgba(221, 238, 225, 0.8) 100%)'
          }}
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/80 rounded-full">
              <User className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1">Account Settings</h1>
              <p className="text-sm text-gray-600">
                Manage your profile information and preferences
              </p>
            </div>
          </div>
        </section>
        
        {/* Profile Settings */}
        <section 
          className="bg-transparent sm:bg-white/70 sm:backdrop-blur-sm rounded-lg sm:rounded-xl border-0 sm:border sm:border-white/20 shadow-none sm:shadow-sm p-0 sm:p-6"
          style={{ 
            background: 'linear-gradient(to top right, rgba(255, 215, 111, 0.2) 0%, rgba(255, 185, 108, 0.2) 20%, rgba(253, 226, 195, 0.2) 40%, rgba(168, 199, 255, 0.05) 65%, rgba(221, 238, 225, 0.5) 100%)'
          }}
        >
          <Card className="bg-transparent border-none shadow-none">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <User className="w-5 h-5" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Update your profile details and avatar
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
            <form onSubmit={handleSave} className="space-y-6">
              {/* Avatar Preview */}
              {profile.avatar_url && (
                <div className="flex justify-center">
                  <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200 border-2 border-gray-300">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={profile.avatar_url} 
                      alt="Profile avatar" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="username" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Username
                </Label>
                <Input
                  id="username"
                  type="text"
                  maxLength={32}
                  value={profile.username}
                  onChange={e => setProfile({ ...profile, username: e.target.value })}
                  placeholder="Enter your username"
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Birthday
                </Label>
                <BirthdayPicker
                  date={profile.birthday ? new Date(profile.birthday + 'T00:00:00') : undefined}
                  onDateChange={(date) => {
                    setProfile({ 
                      ...profile, 
                      birthday: date ? date.toISOString().split('T')[0] : '' 
                    })
                  }}
                  placeholder="Select your birthday"
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Optional - used for birthday greetings
                </p>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Prayer Privacy
                </Label>
                <Select 
                  value={profile.prayers_visibility_weeks?.toString() || "all"} 
                  onValueChange={(value) => setProfile({ 
                    ...profile, 
                    prayers_visibility_weeks: value === "all" ? null : parseInt(value) 
                  })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose privacy setting" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All prayers visible</SelectItem>
                    <SelectItem value="1">Only last 1 week visible</SelectItem>
                    <SelectItem value="3">Only last 3 weeks visible</SelectItem>
                    <SelectItem value="26">Only last 6 months visible</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Controls who can see your older prayers. You always see all your prayers. Current week is always visible to everyone.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="avatar" className="flex items-center gap-2">
                  <LinkIcon className="w-4 h-4" />
                  Avatar URL
                </Label>
                <Input
                  id="avatar"
                  type="url"
                  value={profile.avatar_url}
                  onChange={e => setProfile({ ...profile, avatar_url: e.target.value })}
                  placeholder="https://example.com/avatar.jpg"
                />
                <p className="text-xs text-muted-foreground">
                  Provide a direct link to your profile image
                </p>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full px-4 sm:px-6 py-3 text-base sm:text-lg min-h-[44px] touch-manipulation focus:outline-none focus:bg-transparent active:bg-transparent text-black hover:opacity-90"
                style={{ backgroundColor: '#ffca39' }}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>

              {msg && (
                <div className={`text-sm text-center p-3 rounded-md ${
                  msg === 'Saved!' 
                    ? 'bg-green-50 text-green-700 border border-green-200' 
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {msg}
                </div>
              )}
            </form>
            </CardContent>
          </Card>
        </section>

        {/* Prayer Reminders */}
        <section 
          className="bg-transparent sm:bg-white/70 sm:backdrop-blur-sm rounded-lg sm:rounded-xl border-0 sm:border sm:border-white/20 shadow-none sm:shadow-sm p-0 sm:p-6"
          style={{ 
            background: 'linear-gradient(to top right, rgba(255, 215, 111, 0.2) 0%, rgba(255, 185, 108, 0.2) 20%, rgba(253, 226, 195, 0.2) 40%, rgba(168, 199, 255, 0.05) 65%, rgba(221, 238, 225, 0.5) 100%)'
          }}
        >
          <PrayerReminders />
        </section>
      </div>
    </main>
  )
}