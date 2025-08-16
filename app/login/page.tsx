'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabase } from '@/lib/supabase-browser'
import { validate as isEmail } from 'email-validator'
import { getOAuthCallbackUrl } from '@/lib/app-config'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Mail, Heart } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createBrowserSupabase()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

async function isDomainDeliverable(addr: string) {
   const res = await fetch('/api/email-verify', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ email: addr }),
   })
   const json = await res.json()
   return json.ok as boolean
 }


  async function handleSubmit(e: React.FormEvent) {
    
    e.preventDefault()

    setLoading(true)
    const trimmedEmail = email.trim()



  // email-validator 只有一个 Boolean 返回值
  if (!isEmail(trimmedEmail)) {
    setMsg('邮箱格式不正确')
    setLoading(false)
    return
  }

   if (!(await isDomainDeliverable(trimmedEmail))) {
        setMsg('该邮箱域名不存在或无法接收邮件')
    setLoading(false)
  
   return
}

    const { error } = await supabase.auth.signInWithOtp({
      email: trimmedEmail,
      options: {
        emailRedirectTo: getOAuthCallbackUrl(),   // ← 使用统一的回调URL获取
        // (默认用 hash 模式即可，不要加 shouldConvertHashToQueryParams)
      },
    })
    setLoading(false)
    setMsg(error ? error.message : 'Magic link 已发送，请查收邮件并返回本站')
    if (!error) setEmail('')
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#F8F6F0' }}>
      <div className="w-full max-w-md">
        <section 
          className="rounded-lg sm:rounded-xl border-0 sm:border sm:border-white/20 shadow-none sm:shadow-sm p-6"
          style={{ 
            background: 'radial-gradient(circle at top left, rgba(255, 215, 111, 0.5) 0%, rgba(255, 185, 108, 0.5) 20%, rgba(253, 226, 195, 0.5) 40%, rgba(168, 199, 255, 0.35) 65%, rgba(221, 238, 225, 0.8) 100%)'
          }}
        >
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-white/80 rounded-full">
                <Heart className="w-8 h-8 text-gray-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Welcome to Prayer Wall</h1>
            <p className="text-sm text-gray-600">
              Join our community of prayer and support
            </p>
          </div>
          
          <div className="space-y-4">
          {/* Email Login Section (commented out but styled) */}
          {/* <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            
            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Sending...' : 'Send Magic Link'}
            </Button>
          </form>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div> */}
          
          {/* Google Login */}
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              const callbackUrl = getOAuthCallbackUrl()
              console.log('🔍 OAuth Debug - Callback URL:', callbackUrl)
              console.log('🔍 Current origin:', typeof window !== 'undefined' ? window.location.origin : 'server-side')
              
              supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                  redirectTo: callbackUrl,
                  queryParams: {
                    prompt: 'select_account',
                  },
                },
              })
            }}
            className="w-full h-12 text-base"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </Button>
          
          {msg && (
            <div className={`text-sm text-center p-3 rounded-md ${
              msg.includes('发送') || msg.includes('Magic link') 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {msg}
            </div>
          )}
          </div>
        </section>
      </div>
    </main>
  )
}