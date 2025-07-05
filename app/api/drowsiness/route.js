import { NextResponse } from "next/server"
import { getTailContent } from "@/lib/sshClient"
import { parse } from "csv-parse/sync"

export async function GET() {
  try {
    const filePath = "/home/fast-and-furious/main/section_2_test_drive/drowsiness_log.csv"
    const content = await getTailContent(filePath, 100)

    const records = parse(content, {
      columns: false, // no headers
      skip_empty_lines: true,
      relax_column_count: true
    })

    const latest = records.at(-1)
    const timestamp = latest?.[1] || null
    const alertRaw = latest?.[6]?.toLowerCase?.() || ""

    let state = "Unknown"
    if (alertRaw.includes("awake")) state = "Awake"
    else if (alertRaw.includes("drowsiness")) state = "Drowsy"
    else if (alertRaw.includes("sleepiness")) state = "Sleepy"
    else if (alertRaw.includes("no driver")) state = "No Face Detected"

    return NextResponse.json({
      success: true,
      state,
      timestamp,
      raw: latest
    })
  } catch (err) {
    console.error("Drowsiness Error:", err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
