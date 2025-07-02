"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft } from "lucide-react"

export default function NewTicketPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    issueType: "",
    title: "",
    date: "",
    time: "",
    description: "",
  })

  const searchParams = useSearchParams()

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      issueType: searchParams.get("issueType") || "",
      title: searchParams.get("title") || "",
      date: searchParams.get("date") || "",
      time: searchParams.get("time") || "",
    }))
  }, [searchParams])

  const generateTitle = (issueType) => {
    const titles = {
      "false-speed": "False Speed Reading Detected",
      "false-alcohol": "False Alcohol Reading Alert",
      "false-drowsiness": "Incorrect Drowsiness Detection",
      "false-visibility": "Wrong Visibility Assessment",
      "not-recorded": "Incident Not Properly Recorded",
      "sharp-turn": "False Sharp Turn Detection",
      other: "System Issue Report",
    }
    return titles[issueType] || "System Issue"
  }

  const handleIssueTypeChange = (value) => {
    setFormData({
      ...formData,
      issueType: value,
      title: generateTitle(value),
    })
  }

const handleSubmit = async (e) => {
  e.preventDefault()
  setIsSubmitting(true)

  try {
    const vehicleNumber = localStorage.getItem("vehicleNumber")
    if (!vehicleNumber) {
      alert("Vehicle number not found. Please login again.")
      return
    }

    const response = await fetch("/api/ticket", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vehicleNumber,
        issueType: formData.issueType,
        title: formData.title,
        description: formData.description,
        date: formData.date,
        time: formData.time,
      }),
    })

  const text = await response.text()
console.log("⬇️ Response text from backend:", text)

let result
try {
  result = JSON.parse(text)
} catch (err) {
  throw new Error("Invalid JSON from backend: " + text)
}


    if (response.ok && result.success) {
      alert(`Ticket ${result.ticket.id} created successfully!`)
      router.push("/dashboard/tickets")
    } else {
      alert("Failed to create ticket.")
    }

  } catch (error) {
    console.error("Ticket creation error:", error)
    alert("Failed to create ticket. Please try again.")
  } finally {
    setIsSubmitting(false)
  }
}



  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Raise New Ticket</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report an Issue</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
  <div>
    <Label htmlFor="issueType">Issue Type</Label>
    <Select onValueChange={handleIssueTypeChange} required>
      <SelectTrigger id="issueType" name="issueType">
        <SelectValue placeholder="Select issue type" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="false-speed">False Speed Reading</SelectItem>
        <SelectItem value="false-alcohol">False Alcohol Reading</SelectItem>
        <SelectItem value="false-drowsiness">False Drowsiness Alert</SelectItem>
        <SelectItem value="false-visibility">False Visibility Reading</SelectItem>
        <SelectItem value="sharp-turn">False Sharp Turn Detection</SelectItem>
        <SelectItem value="not-recorded">Incident Not Recorded</SelectItem>
        <SelectItem value="other">Other</SelectItem>
      </SelectContent>
    </Select>
  </div>

  <div>
    <Label htmlFor="title">Issue Title</Label>
    <Input
      id="title"
      name="title"
      value={formData.title}
      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
      placeholder="Brief description of the issue"
      required
    />
  </div>

  <div className="grid grid-cols-2 gap-4">
    <div>
      <Label htmlFor="date">Date</Label>
      <Input
        type="date"
        id="date"
        name="date"
        value={formData.date}
        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
        required
      />
    </div>
    <div>
      <Label htmlFor="time">Estimated Time</Label>
      <Input
        type="time"
        id="time"
        name="time"
        value={formData.time}
        onChange={(e) => setFormData({ ...formData, time: e.target.value })}
        required
      />
    </div>
  </div>

  <div>
    <Label htmlFor="description">Detailed Description</Label>
    <Textarea
      id="description"
      name="description"
      placeholder="Please describe what happened and what the issue is..."
      value={formData.description}
      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
      rows={5}
      required
    />
  </div>

  <div className="flex gap-4">
    <Button type="submit" className="flex-1" disabled={isSubmitting}>
      {isSubmitting ? "Creating Ticket..." : "Submit Ticket"}
    </Button>
    <Button
      type="button"
      variant="outline"
      onClick={() => router.back()}
      disabled={isSubmitting}
    >
      Cancel
    </Button>
  </div>
</form>

        </CardContent>
      </Card>
    </div>
  )
}
