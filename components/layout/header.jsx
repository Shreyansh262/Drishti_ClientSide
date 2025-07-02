"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Car, User, Settings, LogOut, Bell } from "lucide-react"

export function Header() {
  const router = useRouter()
  const [vehicleNumber, setVehicleNumber] = useState("")

  useEffect(() => {
    const storedVehicleNumber = localStorage.getItem("vehicleNumber")
    if (storedVehicleNumber) {
      setVehicleNumber(storedVehicleNumber)
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("vehicleNumber")
    router.push("/login")
  }

  const handleSettingsClick = () => {
    router.push("/dashboard/settings")
  }

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 md:px-6 py-4 relative z-40">
      <div className="flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full text-white">
            <Car className="h-6 w-6" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Drishti</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Driver Safety System</p>
          </div>
        </div>

        {/* Right side - Vehicle & User */}
        <div className="flex items-center gap-2 md:gap-4">
          <div className="hidden sm:block text-sm text-gray-600 dark:text-gray-400">
            Vehicle: <span className="font-medium text-gray-900 dark:text-gray-100">{vehicleNumber}</span>
          </div>

          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full text-xs" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem className="sm:hidden">
                <Car className="h-4 w-4 mr-2" />
                {vehicleNumber}
              </DropdownMenuItem>
              <DropdownMenuItem>
                <User className="h-4 w-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSettingsClick}>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
