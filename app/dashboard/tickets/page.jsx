"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Ticket, Clock, CheckCircle, AlertCircle, Plus } from "lucide-react"

export default function TicketsPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  // BACKEND: Replace with actual API calls
  const [tickets, setTickets] = useState([

  ])

  const fetchTickets = async () => {
    const vehicleNumber = localStorage.getItem("vehicleNumber")
    if (!vehicleNumber) return

    try {
      // BACKEND: Replace with actual API call
      const response = await fetch(`/api/ticket`, {
        headers: {
          "x-vehicle-number": vehicleNumber,
        },
      })
      const data = await response.json()
      setTickets(data.tickets)

      // Simulate API call
      // await new Promise((resolve) => setTimeout(resolve, 1000))
      console.log("Fetching tickets for:", vehicleNumber)
    } catch (error) {
      console.error("Failed to fetch tickets:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTickets()
  }, [])

  const getStatusIcon = (status) => {
    switch (status) {
      case "resolved":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "processing":
        return <Clock className="h-4 w-4 text-yellow-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-red-600" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "resolved":
        return "bg-green-100 text-green-800"
      case "processing":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-red-100 text-red-800"
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "critical":
        return "bg-red-100 text-red-800"
      case "high":
        return "bg-orange-100 text-orange-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-indigo-900 dark:to-purple-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading tickets...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-indigo-900 dark:to-purple-950 p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Support Tickets</h1>
        <Button onClick={() => router.push("/dashboard/tickets/new")}>
          <Plus className="h-4 w-4 mr-2" />
          New Ticket
        </Button>
      </div>

      {/* Tickets List */}
      <div className="grid gap-4">
        {tickets.length === 0 ? (
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-white/20 dark:border-gray-700/50 shadow-lg">
            <CardContent className="text-center py-8">
              <Ticket className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No tickets found</p>
              <Button className="mt-4" onClick={() => router.push("/dashboard/tickets/new")}>
                Create Your First Ticket
              </Button>
            </CardContent>
          </Card>
        ) : (
          tickets.map((ticket) => (
            <Card key={ticket.id} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-white/20 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg text-gray-800 dark:text-white">{ticket.title}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge className={getPriorityColor(ticket.priority)}>{ticket.priority.toUpperCase()}</Badge>
                    <Badge className={getStatusColor(ticket.status)}>
                      {getStatusIcon(ticket.status)}
                      <span className="ml-1 capitalize">{ticket.status}</span>
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300 mb-4">{ticket.description}</p>

                <div className="grid grid-cols-2 gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                  <div>
                    <span className="font-medium">Incident Date:</span> {ticket.incidentDate}
                  </div>
                  <div>
                    <span className="font-medium">Incident Time:</span> {ticket.incidentTime}
                  </div>
                  <div>
                    <span className="font-medium">Issue Type:</span> {ticket.issueType.replace("-", " ")}
                  </div>
                  <div>
                    <span className="font-medium">Created:</span> {new Date(ticket.createdAt).toLocaleDateString()}
                  </div>
                </div>

                {ticket.adminResponse && (
                  <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">Admin Response:</p>
                    <p className="text-sm text-blue-700 dark:text-blue-400">{ticket.adminResponse}</p>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Ticket #{ticket.id}</div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/contact`)} 
                      className="bg-white/70 dark:bg-gray-600/70 hover:bg-white dark:hover:bg-gray-600 border-gray-300 dark:border-gray-500 text-gray-700 dark:text-gray-200">
                      Contact Us
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}