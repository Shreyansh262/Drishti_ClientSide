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
  const validVehicleNumbers = ["HR20APXXXX"]

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

    await new Promise((resolve) => setTimeout(resolve, 2500))

    if (validVehicleNumbers.includes(vehicleNumber.toUpperCase())) {
      localStorage.setItem("vehicleNumber", vehicleNumber.toUpperCase())
      router.push("/dashboard")
    } else {
      setError("Vehicle not registered. Please contact support.")
    }

    setIsLoading(false)
  }

  return (
<div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-gray-800 via-teal-800 to-blue-800">
          <div className="absolute inset-0 z-0 animated-tech-grid-background" />

      <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/20 dark:bg-gray-900/20 backdrop-blur-xl border border-gray-700/30 dark:border-gray-200/30 shadow-2xl rounded-2xl animate-fade-in-up"> {/* Glassmorphism Card */}
          <form onSubmit={handleLogin}>
            <CardHeader className="text-center p-8 pb-4">
              <div className="mb-6 flex justify-center">
                <div className="relative rounded-full p-5 bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-xl transform hover:scale-105 transition-transform duration-300 ease-in-out cursor-pointer">
                  <Car className="h-10 w-10 animate-pulse-slight" /> {/* Slightly larger, subtle pulse */}
                  <span className="absolute -bottom-1 -right-1 block h-3.5 w-3.5 rounded-full bg-green-400 ring-2 ring-white animate-ping-slow" title="System Online"></span> {/* More prominent, slower ping */}
                </div>
              </div>
              <CardTitle className="text-4xl font-extrabold tracking-tight text-white mt-4 drop-shadow-md">Drishti</CardTitle>
              <CardDescription className="text-lg text-gray-200 dark:text-gray-400 mt-2">
                Your Road to Smarter & Safer Journeys
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="vehicle-number" className="text-base font-semibold text-gray-100">
                    Vehicle Registration Number
                  </Label>
                  <div className="relative">
                    <Car className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="vehicle-number"
                      placeholder="e.g., HR20APXXXX"
                      value={vehicleNumber}
                      onChange={(e) => setVehicleNumber(e.target.value)}
                      className="h-14 text-xl pl-12 rounded-xl bg-gray-700/50 border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 text-white placeholder:text-gray-400 transition-all duration-200"
                      required
                    />
                  </div>
                  <p className="text-sm text-gray-400 mt-1">Try: <code className="font-mono bg-gray-700/70 px-1.5 py-0.5 rounded text-gray-200">HR20APXXXX</code></p>
                </div>
                {error && (
                  <div className="flex items-center gap-3 text-red-300 bg-red-900/40 p-4 rounded-xl border border-red-700 shadow-inner animate-shake">
                    <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-400" />
                    <span className="font-medium">{error}</span>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="p-8 pt-0">
              <Button
                type="submit"
                className="w-full h-14 text-lg font-bold rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out
                disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-600 disabled:to-gray-700 flex items-center justify-center gap-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Verifying...
                  </>
                ) : (
                  "Login to Drishti"
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}