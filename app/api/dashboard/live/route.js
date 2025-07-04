// route.js
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const sources = [
      fetch("http://localhost:3000/api/alcohol"),
      fetch("http://localhost:3000/api/visibility"),
      fetch("http://localhost:3000/api/drowsiness"),
      fetch("http://localhost:3000/api/obd"),
      fetch("http://localhost:3000/api/history") // Fetch history for safety score calculation
    ]

    const [alcohol, visibility, drowsiness, obd, history] = await Promise.all(
      sources.map(r => r.then(res => res.json()))
    )

    // Define a freshness threshold (e.g., 15 seconds)
    const DATA_FRESHNESS_THRESHOLD_MS = 15 * 1000 // 15 seconds

    const currentTime = new Date()

    // Helper to check if data is fresh
    const isDataFresh = (timestamp) => {
      if (!timestamp) return false
      const dataTime = new Date(timestamp)
      return (currentTime.getTime() - dataTime.getTime()) < DATA_FRESHNESS_THRESHOLD_MS
    }

    // 🧪 Calculate BAC inside the function
    const rawAlcohol = alcohol?.alcoholLevel || 0
    const voltage = (rawAlcohol / 1023.0) * 5.0
    const ratio = (5.0 - voltage) / voltage
    const rs_ro = (ratio * 200000) / 42500
    const bacEstimate = 0.4 * (rs_ro ** -1.5) * 1.22e-3

    // 🧮 Calculate daily safety score from history
    let dailySafetyScore = 100
    let recentIncidents = []

    if (history?.success && history?.incidents) {
      const now = new Date()
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

      // Filter today's incidents
      const todayIncidents = history.incidents.filter(incident => {
        const incidentTime = new Date(incident.time)
        return incidentTime >= todayStart && incidentTime <= now
      }).sort((a, b) => new Date(b.time) - new Date(a.time)) // Sort by most recent first

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
        // Add bonus for clean driving (every hour without incidents)
        const hoursWithoutIncidents = Math.floor((now - todayStart) / (60 * 60 * 1000))
        dailySafetyScore += Math.min(hoursWithoutIncidents, 20) // Max 20 bonus points
      }

      dailySafetyScore = Math.max(0, Math.min(100, dailySafetyScore - penalty))

      // Get recent incidents (last 5 minutes for display)
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)
      recentIncidents = todayIncidents.filter(incident =>
        new Date(incident.time) >= fiveMinutesAgo
      ).slice(0, 4) // Max 4 incidents displayed
    }

    // 🚨 Check for current live alerts
    const currentAlerts = []

    // High speed alert (only if OBD data is fresh)
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
    } else if (!isDataFresh(obd?.timestamp)) {
        // Optionally add an alert for OBD being offline/stale if critical
        // currentAlerts.push({
        //   id: `obd-offline-${Date.now()}`,
        //   type: "OBD Offline",
        //   severity: "Low",
        //   description: "OBD sensor data is stale or offline.",
        //   time: currentTime,
        //   continuous: true
        // });
    }

    // Alcohol alert (only if alcohol data is fresh)
    if (isDataFresh(alcohol?.timestamp) && bacEstimate >= 0.08) {
      currentAlerts.push({
        id: `alcohol-${Date.now()}`,
        type: "Alcohol Detected",
        severity: "High",
        description: `BAC: ${bacEstimate.toFixed(3)} mg/L (Above legal limit)`,
        time: currentTime,
        continuous: true
      })
    } else if (!isDataFresh(alcohol?.timestamp)) {
        // Optionally add an alert for Alcohol sensor being offline/stale
    }


    // Low visibility alert (only if frontcam data is fresh)
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
    } else if (!isDataFresh(visibility?.timestamp)) {
        // Optionally add an alert for Front Cam being offline/stale
    }

    // Drowsiness alert (only if dashcam data is fresh)
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
    } else if (!isDataFresh(drowsiness?.timestamp)) {
        // Optionally add an alert for Dash Cam being offline/stale
    }


    // No face detected alert (only if dashcam data is fresh)
    if (isDataFresh(drowsiness?.timestamp) && drowsyState === "No Face Detected") {
      currentAlerts.push({
        id: `noface-${Date.now()}`,
        type: "Driver Not Detected",
        severity: "Low",
        description: "No face detected in camera",
        time: currentTime,
        continuous: true
      })
    } else if (!isDataFresh(drowsiness?.timestamp) && drowsyState !== "No Face Detected") {
        // This 'else if' branch will catch if drowsiness data is stale AND
        // it wasn't 'No Face Detected' previously.
        // It's still good to have the explicit check for !isDataFresh.
    //     currentAlerts.push({
    //       id: `dashcam-offline-${Date.now()}`,
    //       type: "Dash Cam Offline",
    //       severity: "Low",
    //       description: "Face cam data is stale or offline, cannot detect driver state.",
    //       time: currentTime,
    //       continuous: true
    //     });
    }


    return NextResponse.json({
      success: true,
      alcoholLevel: alcohol?.bacEstimate || 0,
      alcoholTimestamp: alcohol?.timestamp || null,

      visibilityScore: visibility?.visibilityScore || 0,
      frontcamTimestamp: visibility?.timestamp || null,

      drowsinessState: drowsiness?.state || "Awake",
      dashcamTimestamp: drowsiness?.timestamp || null,

      speed: obd?.speed || 0,
      obdTimestamp: obd?.timestamp || null,

      coordinates: obd?.coordinates || { lat: 0, lng: 0 },
      isConnected: true, // This generally means the API endpoint is connected, not all sensors
      lastUpdate: new Date(),
      driverScore: dailySafetyScore,
      sharpTurnsToday: 2, // Static for now
      recentIncidents: recentIncidents.length,
      lastSharpTurn: { // Static for now
        severity: "Low",
        description: "Turned at 50 km/h"
      },
      dataAge: 10, // This is not correctly calculating age; frontend calculates it based on lastUpdate
      
      // New fields for enhanced insights
      activeIncidents: [...currentAlerts, ...recentIncidents],
      historicalIncidents: recentIncidents
    })
  } catch (error) {
    console.error("Dashboard combine failed", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}