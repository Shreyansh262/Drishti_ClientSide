import { NextResponse } from "next/server"
import { getTailContent } from "@/lib/sshClient"
import { parse } from "csv-parse/sync"

export async function GET() {
  try {
    const filePath = "/home/fast-and-furious/main/section_1_test_drive/visibility_log.csv"
    const content = await getTailContent(filePath, 100)

    const records = parse(content, { skip_empty_lines: true })

    const latest = records.at(-1)
    if (!latest || latest.length < 4) {
      throw new Error("Incomplete or corrupt visibility data row")
    }

    const date = latest[0]
    const time = latest[1]
    const rawScore = parseFloat(latest[3] || "0")
    const timestamp = `${date} ${time}`
    const visibilityScore = Math.round(rawScore)

    return NextResponse.json({ success: true, visibilityScore, timestamp })
  } catch (err) {
    console.error("Visibility Error:", err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
