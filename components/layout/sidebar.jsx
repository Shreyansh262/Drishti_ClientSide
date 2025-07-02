"use client"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, Gauge, Ticket, Settings, Car, History, Phone } from "lucide-react"

export function Sidebar({ expanded, locked, onToggle, onHover }) {
  const pathname = usePathname()
  const isActive = (path) => pathname === path

  return (
    <div
      className={`fixed left-0 top-0 h-full bg-gray-900 text-white transition-all duration-300 ${
        expanded ? "w-72" : "w-16"
      } z-50`}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
    >
      <div className="p-4 h-full flex flex-col">
        <div className="flex items-center gap-3 mb-8 mt-16">
          <Button variant="ghost" size="icon" onClick={onToggle} className="text-white">
            <Menu className="h-5 w-5" />
          </Button>
          {expanded && (
            <div className="flex items-center gap-2">
              <Car className="h-6 w-6 text-blue-400" />
              <span className="font-bold text-lg">Drishti</span>
            </div>
          )}
        </div>

        <nav className="space-y-2 flex-1">
          <Link
            href="/dashboard"
            className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
              isActive("/dashboard") ? "bg-blue-600" : "hover:bg-gray-800"
            }`}
          >
            <Gauge className="h-5 w-5" />
            {expanded && <span>Dashboard</span>}
          </Link>

          <Link
            href="/dashboard/history"
            className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
              isActive("/dashboard/history") ? "bg-blue-600" : "hover:bg-gray-800"
            }`}
          >
            <History className="h-5 w-5" />
            {expanded && <span>History</span>}
          </Link>

          <Link
            href="/dashboard/tickets"
            className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
              isActive("/dashboard/tickets") ? "bg-blue-600" : "hover:bg-gray-800"
            }`}
          >
            <Ticket className="h-5 w-5" />
            {expanded && <span>Support</span>}
          </Link>

          <Link
            href="/dashboard/contact"
            className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
              isActive("/dashboard/contact") ? "bg-blue-600" : "hover:bg-gray-800"
            }`}
          >
            <Phone className="h-5 w-5" />
            {expanded && <span>Contact</span>}
          </Link>

          <Link
            href="/dashboard/settings"
            className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
              isActive("/dashboard/settings") ? "bg-blue-600" : "hover:bg-gray-800"
            }`}
          >
            <Settings className="h-5 w-5" />
            {expanded && <span>Settings</span>}
          </Link>
        </nav>
      </div>
    </div>
  )
}
