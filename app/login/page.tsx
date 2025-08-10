'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabase } from '@/lib/supabase-browser'
import { validate as isEmail } from 'email-validator'
import { getOAuthCallbackUrl } from '@/lib/app-config'

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
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white p-8 rounded-xl shadow space-y-4">
        <h1 className="text-center text-2xl font-semibold text-gray-800">Welcome to Prayer Wall</h1>

        {/* <input
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full border rounded p-2"
        /> */}

        {/* <button
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? 'Sending...' : 'Send Magic Link'}
        </button> */}


{/* Google 登录按钮 */}
<button
  type="button"
  onClick={() => {
    const callbackUrl = getOAuthCallbackUrl()
    console.log('🔍 OAuth Debug - Callback URL:', callbackUrl)
    console.log('🔍 Current origin:', typeof window !== 'undefined' ? window.location.origin : 'server-side')
    
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: callbackUrl, // ← 使用统一的回调URL获取
        queryParams: {
          prompt: 'select_account', // 每次都显示账号选择器
          // 如果你还想每次都重新授权，同步弹出权限页，再加上：
          // prompt: 'select_account consent'
        },
      },
    })
  }}
  className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600 mt-2"
>
  Continue with Google
</button>
        {msg && <p className="text-sm text-center text-gray-600">{msg}</p>}
      </form>
    </main>
  )
}