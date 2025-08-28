import AdminDemoHeader from '@/components/admin-demo-header'
import { LocaleProvider } from '@/lib/locale-context'

export default function AdminDemoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <LocaleProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200">
        <AdminDemoHeader />
        {children}
      </div>
    </LocaleProvider>
  )
}