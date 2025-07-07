// route.js - Debug version to trace the issue
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';

    const sources = [
      fetch(`${baseUrl}/api/alcohol`),
      fetch(`${baseUrl}/api/visibility`),
      fetch(`${baseUrl}/api/drowsiness`),
      fetch(`${baseUrl}/api/obd`),
      fetch(`${baseUrl}/api/history`),
    ];


    const [alcohol, visibility, drowsiness, obd, history] = await Promise.all(
      sources.map(r => r.then(res => res.json()))
    )

    // Define a freshness threshold (e.g., 15 seconds)
    const DATA_FRESHNESS_THRESHOLD_MS = 15 * 1000 // 15 seconds

    const currentTime = new Date()

    const isDataFresh = (timestamp) => {
      if (!timestamp) return false
      const dataTime = new Date(timestamp)
      return (currentTime.getTime() - dataTime.getTime()) < DATA_FRESHNESS_THRESHOLD_MS
    }

    const bacEstimate = alcohol?.alcoholLevel || 0

    let dailySafetyScore = 100
    let recentIncidents = []

    if (history?.success && history?.incidents) {
      const now = new Date()
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

      // Filter today's incidents
      const todayIncidents = history.incidents.filter(incident => {
        const incidentTime = new Date(incident.time)
        const isToday = incidentTime >= todayStart && incidentTime <= now
        return isToday
      }).sort((a, b) => new Date(b.time) - new Date(a.time))


      // Calculate penalties for today
      let penalty = 0
      todayIncidents.forEach((incident) => {
        const severity = incident.severity.toLowerCase()
        if (severity === "high") penalty += 0.2
        else if (severity === "medium") penalty += 0.05
        else if (severity === "low") penalty += 0
      })

      // Check for 1 hour without incidents (bonus points)
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
      const recentIncidentsCount = todayIncidents.filter(incident =>
        new Date(incident.time) >= oneHourAgo
      ).length

      if (recentIncidentsCount === 0 && now.getHours() > 0) {
        const hoursWithoutIncidents = Math.floor((now - todayStart) / (60 * 60 * 1000))
        dailySafetyScore += (Math.min(hoursWithoutIncidents, 20))/2
      }

      dailySafetyScore = Math.max(0, Math.min(100, dailySafetyScore - penalty))

      // Strategy 3: Just show the most recent 4 incidents from today
      recentIncidents = todayIncidents.slice(0, 4)
    }
    // 🚨 Check for current live alerts

    const activeIncidents = [...recentIncidents]

    const response = {
      success: true,
      alcoholLevel: (alcohol?.alcoholLevel) / 180 || 0,
      alcoholTimestamp: alcohol?.timestamp || null,

      visibilityScore: visibility?.visibilityScore || 0,
      frontcamTimestamp: visibility?.timestamp || null,

      drowsinessState: drowsiness?.state || "Awake",
      dashcamTimestamp: drowsiness?.timestamp || null,

      speed: obd?.speed || 0,
      obdTimestamp: obd?.timestamp || null,

      coordinates: isDataFresh(obd?.timestamp) ? obd.coordinates : { lat: 48.8584, lng: 2.2945 }, // Default to Eiffel Tower if no data
      isConnected: true,
      lastUpdate: new Date(),
      driverScore: dailySafetyScore,
      recentIncidents: recentIncidents.length,
      dataAge: 10,

      // Enhanced active incidents
      activeIncidents: activeIncidents,
      historicalIncidents: recentIncidents,

    }
    return NextResponse.json(response)
  } catch (error) {
    console.error("Dashboard combine failed", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}