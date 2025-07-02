import { NextResponse } from "next/server"

export async function GET() {
  try {
    const sources = [
      fetch("http://localhost:3000/api/alcohol"),
      fetch("http://localhost:3000/api/visibility"),
      fetch("http://localhost:3000/api/drowsiness"),
      fetch("http://localhost:3000/api/obd")
    ]

    const [alcohol, visibility, drowsiness, obd] = await Promise.all(
      sources.map(r => r.then(res => res.json()))
    )

    // 🧪 Calculate BAC inside the function
    const rawAlcohol = alcohol?.alcoholLevel || 0
    const voltage = (rawAlcohol / 1023.0) * 5.0
    const ratio = (5.0 - voltage) / voltage
    const rs_ro = (ratio * 200000) / 42500
    const bacEstimate = 0.4 * (rs_ro ** -1.5) * 1.22e-3

    return NextResponse.json({
      success: true,
      alcoholLevel: bacEstimate || 0,
      alcoholTimestamp: alcohol?.timestamp || null,

      visibilityScore: visibility?.visibilityScore || 0,
      frontcamTimestamp: visibility?.timestamp || null,

      drowsinessState: drowsiness?.state || "Awake",
      dashcamTimestamp: drowsiness?.timestamp || null,

      speed: obd?.speed || 0,
      obdTimestamp: obd?.timestamp || null,

      coordinates: obd?.coordinates || { lat: 0, lng: 0 },
      isConnected: true,
      lastUpdate: new Date(),
      driverScore: 80,
      sharpTurnsToday: 2,
      recentIncidents: 0,
      lastSharpTurn: {
        severity: "Low",
        description: "Turned at 50 km/h"
      },
      dataAge: 10
    })
  } catch (error) {
    console.error("Dashboard combine failed", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
