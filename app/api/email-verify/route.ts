// app/api/email-verify/route.ts
import { NextResponse } from 'next/server'
import dns from 'dns/promises'

export async function POST(req: Request) {
  const { email } = await req.json()

  // 基础格式再检验一次（防止直接打 API）
  if (typeof email !== 'string' || !email.includes('@')) {
    return NextResponse.json({ ok: false, reason: 'invalid_format' }, { status: 400 })
  }

  const domain = email.split('@')[1]
  try {
    const mxRecords = await dns.resolveMx(domain)
    const ok = mxRecords.length > 0
    return NextResponse.json({ ok })
  } catch {
    // 域不存在或解析失败
    return NextResponse.json({ ok: false, reason: 'no_mx' })
  }
}