"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function RootPage() {
  const router = useRouter()

  useEffect(() => {
    // Check if user is authenticated
    if (typeof window !== "undefined") {
      const vehicleNumber = localStorage.getItem("vehicleNumber")
      if (vehicleNumber) {
        router.push("/dashboard")
      } else {
        router.push("/login")
      }
    }
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading Drishti...</p>
      </div>
    </div>
  )
}
