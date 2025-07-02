"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Mail, Phone, MapPin, MessageSquare, Send } from "lucide-react"

export default function ContactPage() {
  const [feedbackForm, setFeedbackForm] = useState({
    type: "",
    message: "",
  })

  const [complaintForm, setComplaintForm] = useState({
    feature: "",
    complaint: "",
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedbackForm),
      })

      const data = await response.json()
      if (data.success) {
        alert('Feedback submitted successfully!')
        setFeedbackForm({ type: '', message: '' })
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error("Failed to submit feedback:", error)
      alert("Failed to submit feedback. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleComplaintSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(complaintForm),
      })

      const data = await response.json()
      if (data.success) {
        alert('Complaint submitted successfully!')
        setComplaintForm({ feature: '', complaint: '' })
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error("Failed to submit complaint:", error)
      alert("Failed to submit complaint. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col flex-grow px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold">Contact Us</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Feedback Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Feedback
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleFeedbackSubmit} className="space-y-4">
              <div>
                <Label htmlFor="feedback-type">Feedback Type</Label>
                <Select
                  value={feedbackForm.type}
                  onValueChange={(value) => setFeedbackForm({ ...feedbackForm, type: value })}
                >
                  <SelectTrigger id="feedback-type">
                    <SelectValue placeholder="Select feedback type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="suggestion">Suggestion</SelectItem>
                    <SelectItem value="improvement">Improvement</SelectItem>
                    <SelectItem value="appreciation">Appreciation</SelectItem>
                    <SelectItem value="general">General Feedback</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="feedback-message">Your Message</Label>
                <Textarea
                  id="feedback-message"
                  name="feedback-message"
                  placeholder="Share your feedback with us..."
                  value={feedbackForm.message}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, message: e.target.value })}
                  rows={4}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                <Send className="h-4 w-4 mr-2" />
                {isSubmitting ? "Submitting..." : "Submit Feedback"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Complaint Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Complaint
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleComplaintSubmit} className="space-y-4">
              <div>
                <Label htmlFor="complaint-feature">Feature/Section</Label>
                <Select
                  value={complaintForm.feature}
                  onValueChange={(value) => setComplaintForm({ ...complaintForm, feature: value })}
                >
                  <SelectTrigger id="complaint-feature">
                    <SelectValue placeholder="Select feature" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dashboard">Dashboard</SelectItem>
                    <SelectItem value="sensors">Sensor Readings</SelectItem>
                    <SelectItem value="tickets">Ticket System</SelectItem>
                    <SelectItem value="history">History Section</SelectItem>
                    <SelectItem value="website">Website/App</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="complaint-message">Complaint Details</Label>
                <Textarea
                  id="complaint-message"
                  name="complaint-message"
                  placeholder="Describe your complaint..."
                  value={complaintForm.complaint}
                  onChange={(e) => setComplaintForm({ ...complaintForm, complaint: e.target.value })}
                  rows={4}
                  required
                />
              </div>

              <Button type="submit" className="w-full" variant="destructive" disabled={isSubmitting}>
                <Send className="h-4 w-4 mr-2" />
                {isSubmitting ? "Submitting..." : "Submit Complaint"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
