import { NextResponse } from "next/server"
import { getTailContent } from "@/lib/sshClient"

export async function GET() {
  try {
    const filePath = "/home/fast-and-furious/main/obd_data/trackLog.csv"
    const content  = await getTailContent(filePath, 100)

    // split into lines and ignore any empty ones
    const lines = content
      .split("\n")
      .map(l => l.trim())
      .filter(l => l.includes(","))

    // pull out the very last line
    const latestLine = lines.at(-1) || ""
    const parts     = latestLine.split(",")

    // adjust these indexes to match your CSV columns:
    // [ Device Time, Latitude, Longitude, Speed (km/h), ... ]
    const timestampRaw = parts[1] || ""
    const latRaw       = parts[3] || ""
    const lngRaw       = parts[2] || ""
    const speedRaw     = parts[29] || "0"

    const timestamp = new Date(timestampRaw).toISOString()
    const lat       = parseFloat(latRaw)
    const lng       = parseFloat(lngRaw)
    const speed     = Math.round(parseFloat(speedRaw))

    // freshness check: offline if more than 1 min old
    const ageMs  = Date.now() - new Date(timestampRaw).getTime()
    const isLive = ageMs <= 60_000

    return NextResponse.json({
      success: true,
      speed,
      coordinates: { lat, lng },
      timestamp,
      isLive
    })
  } catch (err) {
    console.error("OBD Error:", err)
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    )
  }
}
