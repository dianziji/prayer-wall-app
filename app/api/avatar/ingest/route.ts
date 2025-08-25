import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export const runtime = 'nodejs'

const BUCKET = 'avatars'

// Map content-type → file extension
function extFromContentType(ct?: string | null): 'jpg' | 'png' | 'webp' {
  if (!ct) return 'jpg'
  const t = ct.toLowerCase()
  if (t.includes('png')) return 'png'
  if (t.includes('webp')) return 'webp'
  return 'jpg'
}

function sanitizeSourceUrl(url: string) {
  try {
    const u = new URL(url)
    // Allow popular Google avatar hosts; extend if you support other providers
    const allow = new Set([
      'lh3.googleusercontent.com',
      'lh4.googleusercontent.com',
      'lh5.googleusercontent.com',
      'lh6.googleusercontent.com',
      'googleusercontent.com',
    ])
    if (!allow.has(u.hostname)) {
      throw new Error(`Unsupported host: ${u.hostname}`)
    }
    return u.toString()
  } catch (e) {
    throw new Error('Invalid sourceUrl')
  }
}

export async function POST(req: Request) {
  try {
    const supa = await createServerSupabase()

    // Must be logged in; derive uid from session (do NOT trust body.userId)
    const { data: { user } } = await supa.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const uid = user.id

    const { sourceUrl } = await req.json()
    if (!sourceUrl || typeof sourceUrl !== 'string') {
      return NextResponse.json({ error: 'sourceUrl is required' }, { status: 400 })
    }

    const safeUrl = sanitizeSourceUrl(sourceUrl)

    // Fetch the avatar bytes from the provider
    const res = await fetch(safeUrl, { cache: 'no-store' })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      return NextResponse.json({ error: 'Failed to fetch source', status: res.status, body: text?.slice(0, 200) }, { status: 502 })
    }

    const ct = res.headers.get('content-type')
    const ext = extFromContentType(ct)
    const arrayBuffer = await res.arrayBuffer()

    // Upload to Storage (upsert to overwrite old copy)
    const objectPath = `${uid}.${ext}`
    const { error: upErr } = await supa.storage.from(BUCKET).upload(objectPath, Buffer.from(arrayBuffer), {
      contentType: ct ?? (ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg'),
      upsert: true,
    })
    if (upErr) {
      return NextResponse.json({ error: 'Upload failed', details: upErr.message }, { status: 500 })
    }

    // Build public URL
    const { data: pub } = supa.storage.from(BUCKET).getPublicUrl(objectPath)
    const publicUrl = pub.publicUrl

    // Update or create the profile row for this user (RLS: user_id = auth.uid())
    const { error: updErr } = await supa
      .from('user_profiles')
      .upsert({ user_id: uid, avatar_url: publicUrl } as any, { onConflict: 'user_id' })
    if (updErr) {
      return NextResponse.json({ error: 'Profile update failed', details: updErr.message, url: publicUrl }, { status: 500 })
    }

    return NextResponse.json({ url: publicUrl })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Unexpected error' }, { status: 400 })
  }
}
