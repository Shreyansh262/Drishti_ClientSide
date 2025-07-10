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
    coordinates: { lat: 48.8584, lng: 2.2945 }, // Default location
  })

  // Get current IST time
  const getIstNow = () => {
    const istOffsetMs = 5.5 * 60 * 60 * 1000;
    return new Date(new Date().getTime() + istOffsetMs);
  };

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
          alcoholTimestamp: body.alcoholTimestamp || null,
          visibilityScore: body.visibilityScore || 0,
          frontcamTimestamp: body.frontcamTimestamp || null,
          drowsinessState: body.drowsinessState || "Awake",
          dashcamTimestamp: body.dashcamTimestamp || null,
          speed: body.speed || 0,
          obdTimestamp: body.obdTimestamp || null,
          coordinates: body.coordinates || { lat: 48.8584, lng: 2.2945 }, // Default location
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


  // Format timestamp to show date and time
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "N/A";
    
    let utcDate;
    try {
      // Handle different timestamp formats
      if (timestamp.includes('+05:30')) {
        // Format with timezone suffix
        utcDate = new Date(timestamp.replace('+05:30', ''));
      } else if (timestamp.includes(',')) {
        // Handle comma-separated format like "2025-07-10,11:50:02"
        utcDate = new Date(timestamp.replace(',', ' '));
      } else {
        // Standard format
        utcDate = new Date(timestamp);
      }
      
      if (isNaN(utcDate.getTime())) return "N/A";
      
      // Use toLocaleString with explicit timezone to show date and time
      return utcDate.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      console.error('Error formatting timestamp:', timestamp, error);
      return "N/A";
    }
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
    
    return ageMs < 90_000; // Online if less than 1.5 minutes old
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-950 relative overflow-hidden">
      {/* Animated Background Elements - Reduced Size */}
      <div className="absolute inset-0 opacity-40 dark:opacity-30">
        <div className="absolute top-0 left-0 w-72 h-72 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse-slight"></div>
        <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse-slight animation-delay-2000"></div>
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-gradient-to-br from-orange-400 to-red-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse-slight animation-delay-4000"></div>
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-gradient-to-br from-green-400 to-cyan-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse-slight animation-delay-6000"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 space-y-6 p-4 md:p-6">
        {/* Header with Logout */}
        <div className="flex justify-between items-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-4 rounded-lg shadow-lg border border-white/20 dark:border-gray-700/50">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Drishti (दृष्टि) Safety Dashboard</h1>
              <p className="text-sm text-gray-600 dark:text-gray-300">Vehicle Monitering System</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <User className="h-4 w-4" />
              <span>Driver Portal</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg transition-all duration-200 text-sm font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
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
            const isOnline = isSensorOnline(data[sensor.key]);
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
            <Card className={`${data.driverScore > 80 ? "bg-green-100/80 border-green-500 dark:bg-green-900/50 dark:border-green-700" : data.driverScore > 60 ? "bg-yellow-100/80 border-yellow-500 dark:bg-yellow-900/50 dark:border-yellow-700" : "bg-red-100/80 border-red-500 dark:bg-red-900/50 dark:border-red-700"} backdrop-blur-sm shadow-lg`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-gray-800 dark:text-white">
                <Trophy className="h-6 w-6 text-yellow-500 dark:text-yellow-300" />
                Safety Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className={`text-6xl font-bold mb-4 ${getScoreColor(data.driverScore)}`}>{Number(data.driverScore).toFixed(1)}</div>
                <Progress value={Number(data.driverScore).toFixed(1)} className="h-3 mb-4" />
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
                  <span>Last 48 hours incidents: {data.recentIncidents}</span>
                  <Badge
                    variant={data.driverScore > 80 ? "default" : data.driverScore > 60 ? "secondary" : "destructive"}
                    className="shadow-sm"
                  >
                    {data.driverScore > 80 ? "🏆 Excellent" : data.driverScore > 60 ? "⚠️ Good" : "🚨 Needs Attention"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Live Incidents Card */}
          <Card className={`border backdrop-blur-sm shadow-lg ${highestSeverity === "high" ? "bg-red-50/80 border-red-500 dark:bg-red-900/50 dark:border-red-700" :
            highestSeverity === "medium" ? "bg-yellow-50/80 border-yellow-500 dark:bg-yellow-900/50 dark:border-yellow-700" :
              highestSeverity === "low" ? "bg-blue-50/80 border-blue-500 dark:bg-blue-900/50 dark:border-blue-700" :
                "bg-green-50/80 border-green-500 dark:bg-green-900/50 dark:border-green-700"
            }`}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-gray-800 dark:text-white">                  <div className="flex items-center gap-2">
                    <Shield className={`h-5 w-5 ${highestSeverity === "high" ? "text-red-600 dark:text-red-400" :
                      highestSeverity === "medium" ? "text-yellow-600 dark:text-yellow-400" :
                        highestSeverity === "low" ? "text-blue-600 dark:text-blue-400" :
                          "text-green-600 dark:text-green-400"
                      }`} />
                    Live Safety Alerts (Last 48 Hours)
                  </div>
                <Badge className={`${highestSeverity === "high" ? "bg-red-600" :
                  highestSeverity === "medium" ? "bg-yellow-600" :
                    highestSeverity === "low" ? "bg-blue-600" :
                      "bg-green-600"
                  } text-white shadow-sm`}>
                  {sortedIncidents.length > 0 ? `${sortedIncidents.length} Recent` : "All Clear"}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-40 overflow-y-auto">
                {sortedIncidents.length === 0 ? (
                  <div className="flex items-center gap-2 text-green-700 bg-green-50/80 p-3 rounded-lg border border-green-200 dark:text-green-200 dark:bg-green-900/50 dark:border-green-700 backdrop-blur-sm">
                    <CheckCircle className="h-4 w-4" />
                    <span className="font-medium">All systems normal - Safe driving!</span>
                  </div>
                ) : (
                  sortedIncidents.map((incident, index) => (
                    <div
                      key={incident.id || index}
                      className={`p-3 rounded-lg border-l-4 ${getSeverityColor(incident.severity)} backdrop-blur-sm transition-all duration-300 ${incident.severity?.toLowerCase() === 'high' ? 'animate-pulse' : ''}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">{getSeverityIcon(incident.severity)}</span>
                            <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-200">{incident.type}</h4>
                            <Badge className={`text-xs ${getSeverityBadgeColor(incident.severity)} shadow-sm`}>
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
            <Card className="hover:shadow-xl transition-all duration-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-white/20 dark:border-gray-700/50 transform hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-800 dark:text-white">Alcohol Level</CardTitle>
              <Droplets className="h-4 w-4 text-red-600 dark:text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-800 dark:text-white">{data.alcoholLevel.toFixed(2)} mg/L</div>
              <Progress value={Math.min((data.alcoholLevel / 0.008) * 100, 100)} className="mt-2" />
            </CardContent>
          </Card>

          {/* Visibility Score */}
          <Card className="hover:shadow-xl transition-all duration-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-white/20 dark:border-gray-700/50 transform hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-800 dark:text-white">Visibility Score</CardTitle>
              <Eye className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-800 dark:text-white">{Math.round(data.visibilityScore)}%</div>
              <Progress value={data.visibilityScore} className="mt-2" />
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Front camera analysis</p>
            </CardContent>
          </Card>

          {/* Current Speed */}
          <Card className="hover:shadow-xl transition-all duration-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-white/20 dark:border-gray-700/50 transform hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-800 dark:text-white">Current Speed</CardTitle>
              <Gauge className="h-4 w-4 text-green-600 dark:text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-800 dark:text-white">{Math.round(data.speed)} km/h</div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">GPS tracking</p>
            </CardContent>
          </Card>

          {/* Driver State */}
          <Card className="hover:shadow-xl transition-all duration-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-white/20 dark:border-gray-700/50 transform hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-800 dark:text-white">Driver State</CardTitle>
              <Bed className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-gray-800 dark:text-white">{data.drowsinessState}</div>
              <Badge variant={data.drowsinessState === "Awake" ? "default" : "destructive"} className="mt-2 shadow-sm">
                {data.drowsinessState === "Awake" ? "✅ Alert" : "⚠️ Attention"}
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* Location Map (Always visible) */}
        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-white/20 dark:border-gray-700/50 shadow-lg">
          <CardHeader>
            <CardTitle className="text-gray-800 dark:text-white">Driver Location</CardTitle>
          </CardHeader>
          <CardContent>
            <LocationMap 
              lat={data.coordinates?.lat || 48.8584} 
              lng={data.coordinates?.lng || 2.2945} 
            />
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              {data.isConnected ? 
                `Lat: ${data.coordinates?.lat || 48.8584}, Lng: ${data.coordinates?.lng || 2.2945}` : 
                "OBD connection offline - showing default location"}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}