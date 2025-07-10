"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Trophy, AlertTriangle, MapPin, Clock, TrendingUp } from "lucide-react"
import { useRouter } from "next/navigation"


export default function HistoryPage() {
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()


  // BACKEND: Replace with actual API calls
  const [historyData, setHistoryData] = useState({

  })

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const vehicleNumber = localStorage.getItem("vehicleNumber")
        if (!vehicleNumber) return

        const res = await fetch(`/api/history?vehicleNumber=${vehicleNumber}`)
        const data = await res.json()

        // Convert string time to Date object and sort in descending order (most recent first)
        const parsedIncidents = data.incidents.map((incident) => ({
          ...incident,
          time: new Date(incident.time),
        })).sort((a, b) => b.time.getTime() - a.time.getTime()) // Sort in descending order


        setHistoryData({ ...data, incidents: parsedIncidents })
      } catch (error) {
        console.error("Failed to fetch history:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchHistory()
  }, [])

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case "high":
        return "bg-red-100 text-red-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleRaiseTicket = (incident) => {
    const incidentDate = new Date(incident.time);
    const queryParams = new URLSearchParams({
      issueType: incident.type.toLowerCase().replace(/\s+/g, "-"),
      title: `${incident.type} Incident`,
      date: incidentDate.toLocaleDateString('en-CA'), // YYYY-MM-DD format
      time: incidentDate.toLocaleTimeString('en-IN', { 
        timeZone: 'Asia/Kolkata',
        hour12: false,
        hour: '2-digit',
        minute: '2-digit'
      }), // HH:MM format in IST
    })

    router.push(`/dashboard/tickets/new?${queryParams.toString()}`)
  }


  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading history...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-indigo-900 dark:to-purple-950 p-4 md:p-6">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Personal History</h1>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-white/20 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-800 dark:text-white">Weekly Safety Score</CardTitle>
              <Trophy className="h-4 w-4 text-yellow-500 dark:text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-800 dark:text-white">{historyData.weeklySafetyScore}</div>
              <Progress value={historyData.weeklySafetyScore} className="mt-2" />
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                <TrendingUp className="h-3 w-3 inline mr-1" />
                Based on Last 30 Days
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-white/20 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-800 dark:text-white">Total Incidents</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-500 dark:text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-800 dark:text-white">{historyData.totalIncidents}</div>
              <p className="text-xs text-gray-600 dark:text-gray-400">From Google Cloud data</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-white/20 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-800 dark:text-white">This Month</CardTitle>
              <Clock className="h-4 w-4 text-blue-500 dark:text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-800 dark:text-white">{historyData.monthlyIncidents}</div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Recent incidents</p>
            </CardContent>
          </Card>
        </div>

        {/* Incidents List */}
        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-white/20 dark:border-gray-700/50 shadow-lg">
          <CardHeader>
            <CardTitle className="text-gray-800 dark:text-white">Recent Incidents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {historyData.incidents.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">No incidents found</p>
              ) : (
                historyData.incidents.map((incident) => (
                  <div key={incident.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 space-y-3 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm hover:bg-white/70 dark:hover:bg-gray-700/70 transition-all duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge className={`${getSeverityColor(incident.severity)} shadow-sm`}>{incident.severity}</Badge>
                        <span className="font-medium text-gray-800 dark:text-white">{incident.type}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <Clock className="h-4 w-4" />
                        {new Date(incident.time).toLocaleString('en-IN', {
                          timeZone: 'Asia/Kolkata',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <MapPin className="h-4 w-4" />
                      {incident.location}
                    </div>

                    <p className="text-sm text-gray-700 dark:text-gray-300">{incident.description}</p>

                    <div className="flex justify-end">
                      <Button variant="outline" size="sm" onClick={() => handleRaiseTicket(incident)} className="bg-white/70 dark:bg-gray-600/70 hover:bg-white dark:hover:bg-gray-600 border-gray-300 dark:border-gray-500 text-gray-700 dark:text-gray-200">
                        Raise Ticket (False Info)
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}