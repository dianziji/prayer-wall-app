import './globals.css'
import Header from '@/components/header'
import { Analytics } from "@vercel/analytics/next"
export const metadata = {
  title: 'MGC Prayer Wall',
  description: 'A platform for sharing prayers and supporting one another',
    icons: {
    icon: '/christianity.png', // 用 PNG 替代默认 ICO
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gradient-to-br from-slate-50 to-slate-200 min-h-screen">
        <Header />
        {children}
        <Analytics />
      </body>
    </html>
  )
}
