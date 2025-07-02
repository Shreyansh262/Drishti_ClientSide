"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Car, AlertCircle } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [vehicleNumber, setVehicleNumber] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Valid vehicle numbers - BACKEND: Replace with API call to validate vehicle
  const validVehicleNumbers = ["HR20AP0001"]

  useEffect(() => {
    // Load theme settings
    if (typeof window !== "undefined") {
      const savedSettings = localStorage.getItem("drishti-settings")
      if (savedSettings) {
        const settings = JSON.parse(savedSettings)
        document.documentElement.classList.toggle("dark", settings.darkMode || false)
        document.documentElement.className = document.documentElement.className.replace(/theme-\w+/g, "")
        document.documentElement.classList.add(`theme-${settings.theme || "blue"}`)
      }
    }
  }, [])

  const handleLogin = async (event) => {
    event.preventDefault()
    setIsLoading(true)
    setError("")

    // BACKEND: Replace this with actual API call
    // Example: const response = await fetch('/api/auth/login', { method: 'POST', body: JSON.stringify({ vehicleNumber }) })
    await new Promise((resolve) => setTimeout(resolve, 1000))

    if (validVehicleNumbers.includes(vehicleNumber.toUpperCase())) {
      localStorage.setItem("vehicleNumber", vehicleNumber.toUpperCase())
      router.push("/dashboard")
    } else {
      setError("Vehicle not registered. Please contact support.")
    }

    setIsLoading(false)
  }

  return (
    <div className="relative min-h-screen">
      <div className="animated-gradient absolute inset-0 -z-10 h-full w-full" />
      <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl border-0 bg-white dark:bg-gray-800">
          <form onSubmit={handleLogin}>
            <CardHeader className="text-center">
              <div className="mb-4 flex justify-center">
                <div className="rounded-full theme-card p-4 text-white shadow-lg">
                  <Car className="h-8 w-8" />
                </div>
              </div>
              <CardTitle className="text-3xl font-bold theme-text">Drishti</CardTitle>
              <CardDescription className="text-lg text-gray-600 dark:text-gray-300">
                Driver Monitoring & Safety System
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="vehicle-number" className="text-base font-medium text-gray-900 dark:text-gray-100">
                    Vehicle Registration Number
                  </Label>
                  <Input
                    id="vehicle-number"
                    placeholder="e.g., HR20AP0001"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                    className="h-12 text-lg"
                    required
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400">Try: HR20AP0001, MH12AB3456, or DL01CD5678</p>
                </div>
                {error && (
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button
                type="submit"
                className="w-full h-12 text-lg theme-button text-white hover:opacity-90 transition-opacity"
                disabled={isLoading}
              >
                {isLoading ? "Verifying..." : "Login"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
