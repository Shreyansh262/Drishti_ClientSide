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
  Shield,
  Zap,
  AlertCircle,
  CheckCircle,
  LogOut,
  User
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
    lastSharpTurn: {},
    sharpTurnsToday: 0,
    activeIncidents: [],
    historicalIncidents: []
  })

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case "high": return "bg-red-100 border-red-500 text-red-800"
      case "medium": return "bg-yellow-100 border-yellow-500 text-yellow-800"
      case "low": return "bg-blue-100 border-blue-500 text-blue-800"
      default: return "bg-gray-100 border-gray-500 text-gray-800"
    }
  }

  const getSeverityBadgeColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case "high": return "bg-red-600 text-white"
      case "medium": return "bg-yellow-600 text-white"  
      case "low": return "bg-blue-600 text-white"
      default: return "bg-gray-600 text-white"
    }
  }

  const getSeverityIcon = (severity) => {
    switch (severity?.toLowerCase()) {
      case "high": return "🔴"
      case "medium": return "🟡"
      case "low": return "🔵"
      default: return "⚪"
    }
  }

  const getHighestSeverity = (incidents) => {
    if (!incidents || incidents.length === 0) return "safe"
    
    const severityOrder = { high: 3, medium: 2, low: 1 }
    const highest = incidents.reduce((max, incident) => {
      const currentLevel = severityOrder[incident.severity?.toLowerCase()] || 0
      const maxLevel = severityOrder[max?.toLowerCase()] || 0
      return currentLevel > maxLevel ? incident.severity : max
    }, "safe")
    
    return highest.toLowerCase()
  }

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return "Never"
    const now = new Date()
    const time = new Date(timestamp)
    const diffMs = now - time
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d ago`
  }

  const handleLogout = () => {
    // Clear any stored session data if needed
    localStorage.removeItem('userToken') // Adjust based on your auth system
    sessionStorage.clear()
    
    // Redirect to login page
    window.location.href = '/login' // Adjust path as needed
  }

  const fetchLiveData = async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/dashboard/live")
      const body = await res.json()

      if (body.success) {
        const now = new Date()

        // Filter out expired incidents (older than 1 minute for non-continuous ones)
        const oneMinuteAgo = new Date(now.getTime() - 60 * 1000)
        const filteredIncidents = body.activeIncidents?.filter(incident => {
          if (incident.continuous) return true // Keep continuous alerts
          return new Date(incident.time) >= oneMinuteAgo
        }) || []

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
          dataAge: 0,
          activeIncidents: filteredIncidents.sort((a, b) => new Date(b.time) - new Date(a.time)),
          historicalIncidents: body.historicalIncidents || []
        })
      }
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

  const dataStatus = getDataAgeStatus(data.dataAge)

  // Sort incidents by severity (High -> Medium -> Low) and then by time
  const sortedIncidents = [...(data.activeIncidents || [])].sort((a, b) => {
    const severityOrder = { high: 3, medium: 2, low: 1 }
    const aSeverity = severityOrder[a.severity?.toLowerCase()] || 0
    const bSeverity = severityOrder[b.severity?.toLowerCase()] || 0

    if (aSeverity !== bSeverity) {
      return bSeverity - aSeverity // Higher severity first
    }
    return new Date(b.time) - new Date(a.time) // More recent first
  }).slice(0, 4) // Show max 4 incidents

  const highestSeverity = getHighestSeverity(sortedIncidents)

  return (
    <div className="space-y-6">
      {/* Header with Logout */}
      <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Driver Safety Dashboard</h1>
            <p className="text-sm text-gray-500">Real-time monitoring & safety analytics</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <User className="h-4 w-4" />
            <span>Driver Portal</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200 text-sm font-medium"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>

      {/* Sensor Connectivity */}
      <Card className="w-full border border-gray-200 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-800">Sensor Connectivity</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: "OBD Sensor", key: "obdTimestamp" },
            { name: "Face Cam", key: "dashcamTimestamp" },
            { name: "Dash Cam", key: "frontcamTimestamp" },
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

      {/* Top Row - Driver Score and Enhanced Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Driver Performance Score */}
        <Card className={`${data.driverScore > 80 ? "bg-green-100 border-green-500" : data.driverScore > 60 ? "bg-yellow-100 border-yellow-500" : "bg-red-100 border-red-500"}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Trophy className="h-6 w-6 text-yellow-500" />
              Daily Safety Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className={`text-6xl font-bold mb-4 ${getScoreColor(data.driverScore)}`}>{data.driverScore}</div>
              <Progress value={data.driverScore} className="h-3 mb-4" />
              <div className="flex justify-between text-sm text-gray-600">
                <span>Today's incidents: {data.recentIncidents}</span>
                <Badge
                  variant={data.driverScore > 80 ? "default" : data.driverScore > 60 ? "secondary" : "destructive"}
                >
                  {data.driverScore > 80 ? "🏆 Excellent" : data.driverScore > 60 ? "⚠️ Good" : "🚨 Needs Attention"}
                </Badge>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                <p>Penalties: High -12pts, Medium -6pts, Low -2pts</p>
                <p>Bonus: +2pts per hour without incidents</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Live Incidents Card */}
        <Card className={`border ${
          highestSeverity === "high" ? "bg-red-50 border-red-500" :
          highestSeverity === "medium" ? "bg-yellow-50 border-yellow-500" :
          highestSeverity === "low" ? "bg-blue-50 border-blue-500" :
          "bg-green-50 border-green-500"
        }`}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className={`h-5 w-5 ${
                  highestSeverity === "high" ? "text-red-600" :
                  highestSeverity === "medium" ? "text-yellow-600" :
                  highestSeverity === "low" ? "text-blue-600" :
                  "text-green-600"
                }`} />
                Live Safety Alerts
              </div>
              <Badge className={`${
                highestSeverity === "high" ? "bg-red-600" :
                highestSeverity === "medium" ? "bg-yellow-600" :
                highestSeverity === "low" ? "bg-blue-600" :
                "bg-green-600"
              } text-white`}>
                {sortedIncidents.length > 0 ? `${sortedIncidents.length} Active` : "All Clear"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {sortedIncidents.length === 0 ? (
                <div className="flex items-center gap-2 text-green-700 bg-green-50 p-3 rounded-lg border border-green-200">
                  <CheckCircle className="h-4 w-4" />
                  <span className="font-medium">All systems normal - Safe driving!</span>
                </div>
              ) : (
                sortedIncidents.map((incident, index) => (
                  <div
                    key={incident.id || index}
                    className={`p-3 rounded-lg border-l-4 ${getSeverityColor(incident.severity)} transition-all duration-300 ${incident.severity?.toLowerCase() === 'high' ? 'animate-pulse' : ''}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{getSeverityIcon(incident.severity)}</span>
                          <h4 className="font-semibold text-sm">{incident.type}</h4>
                          <Badge className={`text-xs ${getSeverityBadgeColor(incident.severity)}`}>
                            {incident.severity}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-700 mb-1">{incident.description}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Clock className="h-3 w-3" />
                          <span>{formatTimeAgo(incident.time)}</span>
                          {incident.continuous && (
                            <Badge variant="outline" className="text-xs">
                              <Zap className="h-3 w-3 mr-1" />
                              Live
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {sortedIncidents.length > 0 && (
              <div className="mt-4 pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-500 text-center">
                  🔴 High alerts are continuous • 🟡 Medium alerts fade after 1min • 🔵 Low alerts fade after 1min
                </p>
              </div>
            )}
          </CardContent>
        </Card>
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
      </div>

      {/* Location Map */}
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
  )
}