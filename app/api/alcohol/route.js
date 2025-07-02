import { NextResponse } from "next/server"
import { getTailContent } from "@/lib/sshClient" // 🆕 NEW METHOD

export async function GET() {
  try {
    const filePath = "/home/fast-and-furious/main/section_4_test_drive/mq3_data.csv"
    const content = await getTailContent(filePath, 100) // 🧠 only last 100 lines

    const lines = content.split("\n").map(line => line.trim()).filter(line => line.includes(","))
    const latest = lines.at(-1)

    const [timestamp, sensorLine] = latest.split(",")
    const match = sensorLine?.match(/Sensor Value:\s*(\d+)/)
    const sensorValue = match ? parseInt(match[1], 10) : 0

    return NextResponse.json({
      success: true,
      alcoholLevel: sensorValue,
      timestamp
    })
  } catch (err) {
    console.error("Alcohol Error:", err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
