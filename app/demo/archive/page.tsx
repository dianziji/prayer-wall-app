import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { DemoNotice } from '@/components/demo-notice'
import { DemoArchiveContent } from '@/components/demo-archive-content'

export const dynamic = 'force-dynamic'

export default function DemoArchivePage() {
  return (
    <main className="min-h-screen py-4 sm:py-8" style={{ backgroundColor: '#F8F6F0' }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
        <DemoNotice />
        <DemoArchiveContent />
      </div>
    </main>
  )
}
