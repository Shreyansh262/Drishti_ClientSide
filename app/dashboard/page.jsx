"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import LocationMap from "@/components/LiveMap"
import {
  Trophy,
  Eye,
  Gauge,
  Bed,
  Database,
  AlertTriangle,
  Droplets,
  Clock,

} from "lucide-react"

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)

  // BACKEND: Replace with actual API calls to Google Cloud/your backend
  const [data, setData] = useState({
    driverScore: 100,
    alcoholLevel: 0.0,
    visibilityScore: 100,
    speed: 0,
    drowsinessState: "Awake",
    isConnected: false,
    lastUpdate: new Date(),
    dataAge: 45, // seconds
    recentIncidents: 0,
    lastSharpTurn: {
    },
    sharpTurnsToday: 0
  })
  const getDrivingInsightsAndSeverity = (data) => {
    const insights = []
    let severity = "safe"

    if (data.alcoholLevel >= 0.08) {
      insights.push("🚨 Driver is above legal alcohol limit")
      severity = "danger"
    }

    if (data.drowsinessState !== "Awake" && data.drowsinessState !== "No Face Detected") {
      insights.push("⚠️ Driver appears drowsy")
      severity = "danger"
    }
    if (data.drowsinessState === "No Face Detected") {
      insights.push("⚠️ Driver not detected")
      severity = "warning"
    }

    if (data.speed > 80 && data.speed <= 130) {
      insights.push(`⚠️ High speed detected: ${data.speed} km/h`)
      if (severity === "safe") severity = "warning"
    }
    if (data.speed > 130) {
      insights.push(`⚠️ High speed detected: ${data.speed} km/h`)
      severity = "danger"
    }

    if (data.visibilityScore < 60) {
      insights.push(`⚠️ Low visibility: ${data.visibilityScore}%`)
      if (severity === "safe") severity = "warning"
    }

    if (data.sharpTurnsToday > 3) {
      insights.push(`⚠️ Multiple sharp turns today (${data.sharpTurnsToday})`)
      if (severity === "safe") severity = "warning"
    }

    if (data.lastSharpTurn && ["Medium", "High"].includes(data.lastSharpTurn.severity)) {
      insights.push(`⚠️ Recent sharp turn: ${data.lastSharpTurn.description}`)
      if (severity === "safe") severity = "warning"
    }

    if (insights.length === 0) {
      insights.push("✅ All driving conditions look safe")
    }

    return { insights, severity }
  }

  const fetchLiveData = async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/dashboard/live")
      const body = await res.json()

      const now = new Date()

      setData({
        alcoholLevel: body.alcoholLevel,
        alcoholTimestamp: body.alcoholTimestamp,
        visibilityScore: body.visibilityScore,
        frontcamTimestamp: body.frontcamTimestamp,
        drowsinessState: body.drowsinessState,
        dashcamTimestamp: body.dashcamTimestamp,
        speed: body.speed,
        obdTimestamp: body.obdTimestamp,
        coordinates: body.coordinates,
        isConnected: true,
        lastUpdate: now,
        driverScore: body.driverScore,
        sharpTurnsToday: body.sharpTurnsToday,
        recentIncidents: body.recentIncidents,
        lastSharpTurn: body.lastSharpTurn,
        dataAge: 0
      })
    } catch (error) {
      console.error("Failed to fetch live data:", error)
      setData((prev) => ({ ...prev, isConnected: false }))
    } finally {
      setIsLoading(false)
    }
  }



  const triggerSync = async () => {
    setIsSyncing(true)
    try {
      // BACKEND: Replace with actual sync API call
      await fetch("/api/sync", { method: "POST" })


      setTimeout(fetchLiveData, 1000)
    } catch (error) {
      console.error("Sync failed:", error)
    } finally {
      setIsSyncing(false)
    }
  }

  useEffect(() => {
    fetchLiveData()
    // Auto-refresh every 2 seconds
    const interval = setInterval(fetchLiveData, 2000)
    return () => clearInterval(interval)
  }, [])

  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getDataAgeStatus = (ageInSeconds) => {
    if (!ageInSeconds) return { color: "gray", text: "No data" }
    if (ageInSeconds < 60) return { color: "green", text: "Live" }
    if (ageInSeconds < 300) return { color: "yellow", text: `${Math.round(ageInSeconds / 60)}m old` }
    return { color: "red", text: "Stale data" }
  }

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return "Never"
    const minutes = Math.floor((Date.now() - new Date(timestamp).getTime()) / 60000)
    if (minutes < 1) return "Just now"
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    return `${hours}h ago`
  }

  const dataStatus = getDataAgeStatus(data.dataAge)

  return (
    <div className="space-y-6">
      {/* Header */}

      <Card className="w-full border border-gray-200 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-800">Sensor Connectivity</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: "OBD Sensor", key: "obdTimestamp" },
            { name: "Dash Cam", key: "dashcamTimestamp" },
            { name: "Front Cam", key: "frontcamTimestamp" },
            { name: "Alcohol Sensor", key: "alcoholTimestamp" }
          ].map((sensor) => {
            const lastTime = data[sensor.key] ? new Date(data[sensor.key]) : null
            const isOnline = lastTime && (Date.now() - lastTime.getTime()) < 60_000
            return (
              <div
                key={sensor.key}
                className={`p-4 rounded-md border ${isOnline ? "bg-green-50 border-green-300" : "bg-red-50 border-red-300"
                  }`}
              >
                <h4 className="font-medium text-gray-700 mb-1">{sensor.name}</h4>
                <Badge
                  variant={isOnline ? "default" : "destructive"}
                  className={`text-sm ${isOnline ? "bg-green-600" : "bg-red-600"} text-white`}
                >
                  {isOnline ? "Online" : "Offline"}
                </Badge>
                <p className="text-xs text-gray-500 mt-1">
                  Last update: {lastTime ? lastTime.toLocaleTimeString() : "N/A"}
                </p>
              </div>
            )
          })}
        </CardContent>
      </Card>


      {/* Top Row - Driver Score and Insite */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Driver Performance Score */}
        <Card className={`${data.driverScore > 80 ? "bg-green-100 border-green-500" : data.driverScore > 60 ? "bg-yellow-100 border-yellow-500" : "bg-red-100 border-red-500"}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Trophy className="h-6 w-6 text-yellow-500" />
              Driver Safety Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className={`text-6xl font-bold mb-4 ${getScoreColor(data.driverScore)}`}>{data.driverScore}</div>
              <Progress value={data.driverScore} className="h-3 mb-4" />
              <div className="flex justify-between text-sm text-gray-600">
                <span>Recent incidents: {data.recentIncidents}</span>
                <Badge
                  variant={data.driverScore > 80 ? "default" : data.driverScore > 60 ? "secondary" : "destructive"}
                >
                  {data.driverScore > 80 ? "🏆 Excellent" : data.driverScore > 60 ? "⚠️ Good" : "🚨 Needs Attention"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Driving Insights Summary */}
        {(() => {
          const { insights, severity } = getDrivingInsightsAndSeverity(data)

          const cardStyles = {
            safe: "bg-green-100 border-green-500",
            warning: "bg-yellow-100 border-yellow-500",
            danger: "bg-red-100 border-red-500"
          }

          const icon = {
            safe: "🟢",
            warning: "🟡",
            danger: "🔴"
          }

          return (
            <Card className={`${cardStyles[severity]} border`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className={`h-5 w-5 ${severity === "danger" ? "text-red-600" : severity === "warning" ? "text-yellow-600" : "text-green-600"}`} />
                  Driving Insights {icon[severity]}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside text-sm text-gray-800 space-y-1">
                  {insights.map((msg, idx) => (
                    <li key={idx} className={msg.startsWith("✅") ? "text-green-700 font-medium" : ""}>
                      {msg}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )
        })()}

      </div>

      {/* Sensor Data Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Alcohol Level */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alcohol Level</CardTitle>
            <Droplets className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.alcoholLevel.toFixed(3)} mg/L</div>
            <Progress value={Math.min((data.alcoholLevel / 0.08) * 100, 100)} className="mt-2" />
            <p className="text-xs text-gray-500 mt-1">Legal limit: 0.080 mg/L</p>
            {/* change karna hai */}
          </CardContent>
        </Card>

        {/* Visibility Score */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visibility Score</CardTitle>
            <Eye className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(data.visibilityScore)}%</div>
            <Progress value={data.visibilityScore} className="mt-2" />
            <p className="text-xs text-gray-500 mt-1">Front camera analysis</p>
          </CardContent>
        </Card>

        {/* Current Speed */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Speed</CardTitle>
            <Gauge className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(data.speed)} km/h</div>
            <p className="text-xs text-gray-500 mt-1">GPS tracking</p>
          </CardContent>
        </Card>

        {/* Driver State */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Driver State</CardTitle>
            <Bed className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{data.drowsinessState}</div>
            <Badge variant={data.drowsinessState === "Awake" ? "default" : "destructive"} className="mt-2">
              {data.drowsinessState === "Awake" ? "✅ Alert" : "⚠️ Attention"}
            </Badge>
          </CardContent>

        </Card>
        {data.coordinates && (
          <Card>
            <CardHeader>
              <CardTitle>Driver Location</CardTitle>
            </CardHeader>
            <CardContent>
              <LocationMap lat={data.coordinates.lat} lng={data.coordinates.lng} />
              <p className="text-sm text-gray-500 mt-2">Lat: {data.coordinates.lat}, Lng: {data.coordinates.lng}</p>
            </CardContent>
          </Card>
        )}
      </div>

    </div>
  )
}
