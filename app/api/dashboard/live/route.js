// route.js - Debug version to trace the issue
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const sources = [
      fetch("/api/alcohol"),
      fetch("/api/visibility"),
      fetch("/api/drowsiness"),
      fetch("/api/obd"),
      fetch("/api/history"),
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
        if (severity === "high") penalty += 6
        else if (severity === "medium") penalty += 3
        else if (severity === "low") penalty += 1
      })

      // Check for 1 hour without incidents (bonus points)
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
      const recentIncidentsCount = todayIncidents.filter(incident =>
        new Date(incident.time) >= oneHourAgo
      ).length

      if (recentIncidentsCount === 0 && now.getHours() > 0) {
        const hoursWithoutIncidents = Math.floor((now - todayStart) / (60 * 60 * 1000))
        dailySafetyScore += Math.min(hoursWithoutIncidents, 20)
      }

      dailySafetyScore = Math.max(0, Math.min(100, dailySafetyScore - penalty))

      // Strategy 1: Last 30 minutes
      const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000)
      let filteredIncidents = todayIncidents.filter(incident =>
        new Date(incident.time) >= thirtyMinutesAgo
      )
      // Strategy 2: Last 2 hours if no recent incidents
      if (filteredIncidents.length === 0) {
        const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000)
        filteredIncidents = todayIncidents.filter(incident =>
          new Date(incident.time) >= twoHoursAgo
        )
      }

      // Strategy 3: Just show the most recent 4 incidents from today
      if (filteredIncidents.length === 0 && todayIncidents.length > 0) {
        filteredIncidents = todayIncidents.slice(0, 4)
      }

      // Strategy 4: Show ALL incidents from history (for debugging)
      if (filteredIncidents.length === 0 && history.incidents.length > 0) {
        filteredIncidents = history.incidents
          .sort((a, b) => new Date(b.time) - new Date(a.time))
          .slice(0, 4)
      }

      recentIncidents = filteredIncidents.slice(0, 4)

    }

    // 🚨 Check for current live alerts
    const currentAlerts = []

    // High speed alert
    const currentSpeed = obd?.speed || 0
    if (isDataFresh(obd?.timestamp) && currentSpeed > 80) {
      currentAlerts.push({
        id: `speed-${Date.now()}`,
        type: "High Speed",
        severity: currentSpeed > 130 ? "High" : "Medium",
        description: `Driving at ${currentSpeed} km/h`,
        time: currentTime,
        continuous: true
      })
    }

    // Low visibility alert
    const visScore = visibility?.visibilityScore || 100
    if (isDataFresh(visibility?.timestamp) && visScore < 60) {
      currentAlerts.push({
        id: `visibility-${Date.now()}`,
        type: "Low Visibility",
        severity: visScore < 30 ? "High" : "Medium",
        description: `Visibility: ${visScore}%`,
        time: currentTime,
        continuous: true
      })
    }

    // Drowsiness alert
    const drowsyState = drowsiness?.state || "Awake"
    if (isDataFresh(drowsiness?.timestamp) && drowsyState !== "Awake" && drowsyState !== "No Face Detected") {
      currentAlerts.push({
        id: `drowsy-${Date.now()}`,
        type: "Driver Drowsiness",
        severity: "High",
        description: `Driver state: ${drowsyState}`,
        time: currentTime,
        continuous: true
      })
    }

    // No face detected alert
    if (isDataFresh(drowsiness?.timestamp) && drowsyState === "No Face Detected") {
      currentAlerts.push({
        id: `noface-${Date.now()}`,
        type: "Driver Not Detected",
        severity: "Low",
        description: "No face detected in camera",
        time: currentTime,
        continuous: true
      })
    }
    const activeIncidents = [...currentAlerts, ...recentIncidents]


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
      sharpTurnsToday: 2,
      recentIncidents: recentIncidents.length,
      lastSharpTurn: {
        severity: "Low",
        description: "Turned at 50 km/h"
      },
      dataAge: 10,

      // Enhanced active incidents
      activeIncidents: activeIncidents,
      historicalIncidents: recentIncidents,

      // Debug info
      debug: {
        historySuccess: history?.success,
        totalIncidents: history?.incidents?.length || 0,
        todayIncidents: history?.incidents?.filter(incident => {
          const incidentTime = new Date(incident.time)
          const todayStart = new Date(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getDate())
          return incidentTime >= todayStart && incidentTime <= currentTime
        }).length || 0,
        currentAlertsCount: currentAlerts.length,
        recentIncidentsCount: recentIncidents.length,
        activeIncidentsCount: activeIncidents.length
      }
    }
    return NextResponse.json(response)
  } catch (error) {
    console.error("Dashboard combine failed", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}