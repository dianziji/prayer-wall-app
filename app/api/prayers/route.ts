import { createClient } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = createClient()
  const { data } = await supabase.from("prayers").select("*").order("created_at", { ascending: false })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const supabase = createClient()
  const body = await req.json()

  if (!body.content || body.content.length > 500) {
    return new NextResponse("Invalid input", { status: 400 })
  }

  const { data, error } = await supabase.from("prayers").insert([{ content: body.content, author_name: body.author || "Anonymous" }])
  if (error) return new NextResponse(error.message, { status: 500 })

  return NextResponse.json(data)
}
