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

  const [data, setData] = useState({
    driverScore: 100,
    alcoholLevel: 0.0,
    visibilityScore: 100,
    speed: 0,
    drowsinessState: "Awake",
    isConnected: false,
    lastUpdate: new Date().toISOString(),
    dataAge: 45, // seconds
    recentIncidents: 0,
    activeIncidents: [],
  })

  // Get current IST time
  const getIstNow = () => {
    const istOffsetMs = 5.5 * 60 * 60 * 1000;
    return new Date(new Date().getTime() + istOffsetMs);
  };

  console.log('Client Time (IST):', getIstNow().toISOString(), 'Offset:', getIstNow().getTimezoneOffset());

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case "high": return "bg-red-100 border-red-500 text-red-800 dark:bg-red-900 dark:border-red-700 dark:text-red-200"
      case "medium": return "bg-yellow-100 border-yellow-500 text-yellow-800 dark:bg-yellow-900 dark:border-yellow-700 dark:text-yellow-200"
      case "low": return "bg-blue-100 border-blue-500 text-blue-800 dark:bg-blue-900 dark:border-blue-700 dark:text-blue-200"
      default: return "bg-gray-100 border-gray-500 text-gray-800 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-200"
    }
  }

  const getSeverityBadgeColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case "high": return "bg-red-600 text-white dark:bg-red-800"
      case "medium": return "bg-yellow-600 text-white dark:bg-yellow-800"
      case "low": return "bg-blue-600 text-white dark:bg-blue-800"
      default: return "bg-gray-600 text-white dark:bg-gray-800"
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

  const handleLogout = () => {
    localStorage.removeItem('userToken')
    sessionStorage.clear()
    window.location.href = '/login'
  }

  const fetchLiveData = async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/dashboard/live")
      const body = await res.json()
      console.log('API Response:', body)

      if (body.success) {
        const now = new Date().toISOString()
        const incidentsForDisplay = body.activeIncidents || []
        const obdTime = body.obdTimestamp ? new Date(body.obdTimestamp.replace('+05:30', '')) : null
        // Fix OBD age calculation - both times should be in UTC for comparison
        const ageMs = obdTime && !isNaN(obdTime.getTime()) ? new Date().getTime() - obdTime.getTime() : Infinity
        console.log(`OBD - Client Age: ${ageMs / 1000}s, IsConnected: ${body.isConnected}`)

        setData({
          alcoholLevel: parseFloat(body.alcoholLevel) || 0.0,
          alcoholTimestamp: body.alcoholTimestamp,
          visibilityScore: body.visibilityScore || 0,
          frontcamTimestamp: body.frontcamTimestamp,
          drowsinessState: body.drowsinessState || "Awake",
          dashcamTimestamp: body.dashcamTimestamp,
          speed: body.speed || 0,
          obdTimestamp: body.obdTimestamp,
          coordinates: body.coordinates || { lat: 48.8584, lng: 2.2945 },
          isConnected: body.isConnected && ageMs < 90_000, // Strict UTC check
          lastUpdate: now,
          driverScore: body.driverScore || 100,
          recentIncidents: body.recentIncidents || 0,
          dataAge: body.lastUpdate ? Math.floor((new Date().getTime() - new Date(body.lastUpdate.replace('+05:30', '')).getTime()) / 1000) : 45,
          activeIncidents: incidentsForDisplay.sort((a, b) => new Date(b.time.replace('+05:30', '') || now).getTime() - new Date(a.time.replace('+05:30', '') || now).getTime()),
        })
      } else {
        console.error('API Failure:', body.error)
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
    const interval = setInterval(fetchLiveData, 8000)
    return () => clearInterval(interval)
  }, [])

  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-600 dark:text-green-400"
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400"
    return "text-red-600 dark:text-red-400"
  }

  const getDataAgeStatus = (ageInSeconds) => {
    if (isNaN(ageInSeconds) || ageInSeconds === null) return { color: "gray", text: "No data" }
    if (ageInSeconds < 60) return { color: "green", text: "Live" }
    if (ageInSeconds < 300) return { color: "yellow", text: `${Math.round(ageInSeconds / 60)}m old` }
    return { color: "red", text: "Stale data" }
  }

  const dataStatus = getDataAgeStatus(data.dataAge)

  const sortedIncidents = [...(data.activeIncidents || [])].sort(
    (a, b) => new Date(b.time.replace('+05:30', '') || data.lastUpdate).getTime() - new Date(a.time.replace('+05:30', '') || data.lastUpdate).getTime()
  ).slice(0, 4) // Show only 4 most recent incidents

  const highestSeverity = getHighestSeverity(sortedIncidents)

  // Format timestamp to "01:23 PM" format for all sensors
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "N/A";
    
    // Parse the timestamp - it should already be in UTC with +05:30 suffix
    const utcDate = new Date(timestamp.replace('+05:30', ''));
    if (isNaN(utcDate.getTime())) return "Invalid";
    
    // Use toLocaleString with explicit timezone instead of manual calculation
    return utcDate.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Check if sensor is online based on age (90,000 ms = 1.5 minutes threshold)
  const isSensorOnline = (timestamp) => {
    if (!timestamp) return false;
    // Remove the +05:30 suffix to get the UTC time
    const utcDate = new Date(timestamp.replace('+05:30', ''));
    if (isNaN(utcDate.getTime())) return false;
    
    // Get current UTC time for comparison
    const nowUtc = new Date();
    const ageMs = nowUtc.getTime() - utcDate.getTime();
    
    console.log(`Sensor Online Check - Timestamp: ${timestamp}, UTC: ${utcDate.toISOString()}, Now UTC: ${nowUtc.toISOString()}, Age: ${ageMs / 1000}s`);
    
    return ageMs < 90_000; // Online if less than 1.5 minutes old
  };

  return (
    <div className="space-y-6 p-4 md:p-6 bg-background text-foreground min-h-full">
      {/* Header with Logout */}
      <div className="flex justify-between items-center bg-card p-4 rounded-lg shadow-sm border border-border">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Drishti (दृष्टि) Safety Dashboard</h1>
            <p className="text-sm text-muted-foreground">Vehicle Monitering System</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
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
      <Card className="w-full border border-border shadow-md bg-card">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-800 dark:text-white">Sensor Connectivity</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: "OBD Sensor", key: "obdTimestamp" },
            { name: "Face Cam", key: "dashcamTimestamp" },
            { name: "Dash Cam", key: "frontcamTimestamp" },
            { name: "Alcohol Sensor", key: "alcoholTimestamp" }
          ].map((sensor) => {
            const lastTime = data[sensor.key] ? new Date(data[sensor.key].replace('+05:30', '')) : null;
            const isOnline = isSensorOnline(data[sensor.key]);
            console.log(`Sensor: ${sensor.name}, isOnline: ${isOnline}, Timestamp: ${lastTime?.toISOString() || 'Invalid'}, Age: ${lastTime ? (getIstNow().getTime() - lastTime.getTime()) / 1000 : 'N/A'}s`);
            return (
              <div
                key={sensor.key}
                className={`p-4 rounded-md border ${isOnline ? "bg-green-50 border-green-300 dark:bg-green-800 dark:border-green-600" : "bg-red-50 border-red-300 dark:bg-red-800 dark:border-red-600"}`}
              >
                <h4 className="font-medium text-gray-700 dark:text-gray-200 mb-1">{sensor.name}</h4>
                <Badge
                  variant={isOnline ? "default" : "destructive"}
                  className={`text-sm ${isOnline ? "bg-green-600" : "bg-red-600"} text-white`}
                >
                  {isOnline ? "Online" : "Offline"}
                </Badge>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Last update: {formatTimestamp(data[sensor.key])}
                </p>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Top Row - Driver Score and Enhanced Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Driver Performance Score */}
        <Card className={`${data.driverScore > 80 ? "bg-green-100 border-green-500 dark:bg-green-900 dark:border-green-700" : data.driverScore > 60 ? "bg-yellow-100 border-yellow-500 dark:bg-yellow-900 dark:border-yellow-700" : "bg-red-100 border-red-500 dark:bg-red-900 dark:border-red-700"}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-gray-800 dark:text-black">
              <Trophy className="h-6 w-6 text-yellow-500 dark:text-yellow-300" />
              Safety Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className={`text-6xl font-bold mb-4 ${getScoreColor(data.driverScore)}`}>{Number(data.driverScore).toFixed(2)}</div>
              <Progress value={Number(data.driverScore).toFixed(2)} className="h-3 mb-4" />
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
                <span>Today's incidents: {data.recentIncidents}</span>
                <Badge
                  variant={data.driverScore > 80 ? "default" : data.driverScore > 60 ? "secondary" : "destructive"}
                >
                  {data.driverScore > 80 ? "🏆 Excellent" : data.driverScore > 60 ? "⚠️ Good" : "🚨 Needs Attention"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Live Incidents Card */}
        <Card className={`border ${highestSeverity === "high" ? "bg-red-50 border-red-500 dark:bg-red-900 dark:border-red-700" :
          highestSeverity === "medium" ? "bg-yellow-50 border-yellow-500 dark:bg-yellow-900 dark:border-yellow-700" :
            highestSeverity === "low" ? "bg-blue-50 border-blue-500 dark:bg-blue-900 dark:border-blue-700" :
              "bg-green-50 border-green-500 dark:bg-green-900 dark:border-green-700"
          }`}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-gray-800 dark:text-black">
              <div className="flex items-center gap-2">
                <Shield className={`h-5 w-5 ${highestSeverity === "high" ? "text-red-600 dark:text-red-400" :
                  highestSeverity === "medium" ? "text-yellow-600 dark:text-yellow-400" :
                    highestSeverity === "low" ? "text-blue-600 dark:text-blue-400" :
                      "text-green-600 dark:text-green-400"
                  }`} />
                Live Safety Alerts
              </div>
              <Badge className={`${highestSeverity === "high" ? "bg-red-600" :
                highestSeverity === "medium" ? "bg-yellow-600" :
                  highestSeverity === "low" ? "bg-blue-600" :
                    "bg-green-600"
                } text-white`}>
                {sortedIncidents.length > 0 ? `${sortedIncidents.length} Recent` : "All Clear"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-40 overflow-y-auto">
              {sortedIncidents.length === 0 ? (
                <div className="flex items-center gap-2 text-green-700 bg-green-50 p-3 rounded-lg border border-green-200 dark:text-green-200 dark:bg-green-900 dark:border-green-700">
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
                          <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-200">{incident.type}</h4>
                          <Badge className={`text-xs ${getSeverityBadgeColor(incident.severity)}`}>
                            {incident.severity}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">{incident.description}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                          <Clock className="h-3 w-3" />
                          <span>{formatTimestamp(incident.time)}</span>
                          {incident.continuous && (
                            <Badge variant="outline" className="text-xs dark:text-gray-300 dark:border-gray-600">
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
              <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 text-center dark:text-gray-400">
                  🔴 High alerts  • 🟡 Medium alerts • 🔵 Low alerts
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sensor Data Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Alcohol Level */}
        <Card className="hover:shadow-lg transition-shadow bg-card text-card-foreground">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alcohol Level</CardTitle>
            <Droplets className="h-4 w-4 text-red-600 dark:text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.alcoholLevel.toFixed(2)} mg/L</div>
            <Progress value={Math.min((data.alcoholLevel / 0.008) * 100, 100)} className="mt-2" />
          </CardContent>
        </Card>

        {/* Visibility Score */}
        <Card className="hover:shadow-lg transition-shadow bg-card text-card-foreground">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visibility Score</CardTitle>
            <Eye className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(data.visibilityScore)}%</div>
            <Progress value={data.visibilityScore} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">Front camera analysis</p>
          </CardContent>
        </Card>

        {/* Current Speed */}
        <Card className="hover:shadow-lg transition-shadow bg-card text-card-foreground">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Speed</CardTitle>
            <Gauge className="h-4 w-4 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(data.speed)} km/h</div>
            <p className="text-xs text-muted-foreground mt-1">GPS tracking</p>
          </CardContent>
        </Card>

        {/* Driver State */}
        <Card className="hover:shadow-lg transition-shadow bg-card text-card-foreground">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Driver State</CardTitle>
            <Bed className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{data.drowsinessState}</div>
            <Badge variant={data.drowsinessState === "Awake" ? "default" : "destructive"} className="mt-2">
              {data.drowsinessState === "Awake" ? "✅ Alert" : "⚠️ Attention"}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {data.coordinates && (
        <Card className="bg-card text-card-foreground">
          <CardHeader>
            <CardTitle>Driver Location</CardTitle>
          </CardHeader>
          <CardContent>
            <LocationMap lat={data.coordinates.lat} lng={data.coordinates.lng} />
            <p className="text-sm text-muted-foreground mt-2">Lat: {data.coordinates.lat}, Lng: {data.coordinates.lng}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}