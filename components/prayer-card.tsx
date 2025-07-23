import { formatDistanceToNow } from "date-fns"

export function PrayerCard({
  content,
  authorName,
  createdAt,
}: {
  content: string
  authorName: string
  createdAt?: string | Date
}) {
  const time = typeof createdAt === "string" ? new Date(createdAt) : createdAt ?? new Date()
function truncateName(name: string, maxLen: number) {
  return name.length > maxLen ? name.slice(0, maxLen) + "…" : name
}
  return (
    <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow duration-300 ease-in-out border border-gray-200">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-10 h-10 rounded-full bg-gray-400" />
        <div>
          <p className="text-sm font-semibold text-gray-800">
  {truncateName(authorName || "Unknown", 15)}
</p>
          <p className="text-xs text-gray-500">
            {formatDistanceToNow(time, { addSuffix: true })}
          </p>
        </div>
      </div>
      <div>
        <p className="text-lg font-medium text-gray-900 break-words">{content}</p>
      </div>
    </div>
  )
}