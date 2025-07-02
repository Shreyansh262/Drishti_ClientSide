import { NextResponse } from "next/server"
import { appendToFile } from "@/lib/sshClient"

const COMPLAINT_PATH = "/home/fast-and-furious/main/drishti/complaints/complaints.csv"

export async function POST(req) {
  try {
    const body = await req.json()
    const { feature, complaint } = body

    if (!feature || !complaint) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    }

    const id = `CMPLT${Date.now().toString().slice(-8)}`
    const createdAt = new Date().toISOString()
    const row = `"${id}","${feature}","${complaint.replace(/"/g, '""')}","${createdAt}"\n`

    await appendToFile(COMPLAINT_PATH, row)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("POST /api/complaints error:", err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
