import DemoHeader from '@/components/demo-header'
import { LocaleProvider } from '@/lib/locale-context'

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <LocaleProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200">
        <DemoHeader />
        {children}
      </div>
    </LocaleProvider>
  )
}