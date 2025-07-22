import { PrayerWall } from "@/components/prayer-wall"

export default function HomePage() {
  return (
    <main className="p-4 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">🙏 Prayer Wall</h1>
      <PrayerWall />
    </main>
  )
}
