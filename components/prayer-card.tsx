export function PrayerCard({ prayer }: { prayer: any }) {
  return (
    <div className="p-4 border rounded shadow-sm bg-white">
      <p className="text-gray-800">{prayer.content}</p>
      <p className="text-sm text-gray-500 mt-2 text-right">– {prayer.author_name}</p>
    </div>
  )
}
