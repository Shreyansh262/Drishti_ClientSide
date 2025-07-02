import { NextResponse } from "next/server"
import { appendToFile } from "@/lib/sshClient"

const FEEDBACK_PATH = "/home/fast-and-furious/main/drishti/feedback/feedback.csv"

export async function POST(req) {
  try {
    const body = await req.json()
    const { type, message } = body

    if (!type || !message) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    }

    const id = `FDBK${Date.now().toString().slice(-8)}`
    const createdAt = new Date().toISOString()
    const row = `"${id}","${type}","${message.replace(/"/g, '""')}","${createdAt}"\n`

    await appendToFile(FEEDBACK_PATH, row)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("POST /api/feedback error:", err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
