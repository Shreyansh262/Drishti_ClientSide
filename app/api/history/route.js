import { NextResponse } from "next/server"
import { getFileContent } from "@/lib/sshClient"

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const vehicleNumber = searchParams.get("vehicleNumber")

    const filePath = "/home/fast-and-furious/main/master_log.csv"
    const content = await getFileContent(filePath)

    const lines = content.trim().split("\n")
    const [header, ...rows] = lines

    const allIncidents = rows
      .map((line, index) => {
        const [datetime, fault_type, severity, location, description] = line.split(",")

        const time = new Date(datetime)
        if (isNaN(time.getTime())) return null

        return {
          id: index + 1,
          type: fault_type.trim(),
          severity: severity.trim(),
          location: location.trim(),
          description: description.trim(),
          time,
        }
      })
      .filter(Boolean)

    const totalIncidents = allIncidents.length
    const currentMonth = new Date().getMonth()

    const monthlyIncidents = allIncidents.filter(
      (incident) => incident.time.getMonth() === currentMonth
    ).length

    // 🔍 Filter incidents from the last 7 days
    const now = new Date()
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(now.getDate() - 7)

    const lastWeekIncidents = allIncidents.filter(
      (incident) => incident.time >= oneWeekAgo && incident.time <= now
    )

    // 🧮 Weekly safety score logic
    let penalty = 0
    lastWeekIncidents.forEach((incident) => {
      const severity = incident.severity.toLowerCase()
      if (severity === "high") penalty += 0.2
      else if (severity === "medium") penalty += 0.05
      else if (severity === "low") penalty += 0
    })

    const weeklySafetyScore = Math.max(0, 100 - (penalty/7))

    return NextResponse.json({
      success: true,
      totalIncidents,
      monthlyIncidents,
      weeklySafetyScore,
      incidents: allIncidents,
    })
  } catch (err) {
    console.error("API /history error:", err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}