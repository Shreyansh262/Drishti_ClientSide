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
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Personal History</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Safety Score </CardTitle>
            <Trophy className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>

            <div className="text-2xl font-bold">{historyData.weeklySafetyScore}</div>
            <Progress value={historyData.weeklySafetyScore} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              Based on Last 7 Days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Incidents</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{historyData.totalIncidents}</div>
            <p className="text-xs text-muted-foreground">From Google Cloud data</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{historyData.monthlyIncidents}</div>
            <p className="text-xs text-muted-foreground">Recent incidents</p>
          </CardContent>
        </Card>
      </div>

      {/* Incidents List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Incidents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {historyData.incidents.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No incidents found</p>
            ) : (
              historyData.incidents.map((incident) => (
                <div key={incident.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge className={getSeverityColor(incident.severity)}>{incident.severity}</Badge>
                      <span className="font-medium">{incident.type}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
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

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4" />
                    {incident.location}
                  </div>

                  <p className="text-sm text-gray-700">{incident.description}</p>

                  <div className="flex justify-end">
                    <Button variant="outline" size="sm" onClick={() => handleRaiseTicket(incident)}>
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
  )
}