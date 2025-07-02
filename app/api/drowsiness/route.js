import { NextResponse } from "next/server"
import { getFileContent } from "@/lib/sshClient"
import { parse } from "csv-parse/sync"

export async function GET() {
  try {
    const filePath = "/home/fast-and-furious/main/section_2_test_drive/drowsiness_log.csv"
    const content = await getFileContent(filePath)

    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true // ⬅️ ignore column mismatches
    }).filter(r => r.timestamp && r.alert) // skip garbage

    const latest = records.at(-1)
    const rawAlert = latest?.alert?.toLowerCase() || ""
    const timestamp = latest?.timestamp || null

    let state = "Unknown"
    if (rawAlert.includes("awake")) state = "Awake"
    else if (rawAlert.includes("drowsiness")) state = "Drowsy"
    else if (rawAlert.includes("no driver")) state = "No Face Detected"

    return NextResponse.json({ success: true, state, timestamp })
  } catch (err) {
    console.error("Drowsiness Error:", err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
