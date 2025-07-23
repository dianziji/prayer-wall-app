"use client"
import { useState } from "react"

export function PrayerForm({ onPost }: { onPost: () => void }) {
  const [author, setAuthor] = useState("")
  const [content, setContent] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!content || content.length > 500) return
    setLoading(true)
    await fetch("/api/prayers", {
      method: "POST",
      body: JSON.stringify({ author_name: author, content }),
      headers: { "Content-Type": "application/json" }
    })
    setContent("")
    setAuthor("")
    setLoading(false)
    onPost()
  }

  return (
    <div className="mb-6">
      <input className="border p-2 w-full mb-2" placeholder="Your name (optional)" value={author} onChange={e => setAuthor(e.target.value)} />
      <textarea className="border p-2 w-full" placeholder="Write your prayer here..." maxLength={500} value={content} onChange={e => setContent(e.target.value)} />
      <div className="text-sm text-gray-500 text-right mb-2">{content.length}/500</div>
      <button onClick={handleSubmit} disabled={loading} className="bg-blue-500 text-white py-2 px-4 rounded disabled:opacity-50">
        {loading ? "Posting..." : "Post Prayer"}
      </button>
    </div>
  )
}
