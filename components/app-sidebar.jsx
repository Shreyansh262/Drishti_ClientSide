"use client"

import { usePathname, useRouter } from "next/navigation"
import { Car, Gauge, History, Ticket, Phone, Settings, Plus } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Gauge },
  { name: "History", href: "/dashboard/history", icon: History },
  { name: "Support", href: "/dashboard/tickets", icon: Ticket },
  { name: "Contact", href: "/dashboard/contact", icon: Phone },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
]

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const isActive = (path) => pathname === path

  const handleRaiseTicket = () => {
    router.push("/dashboard/tickets/new")
  }

  return (
    <Sidebar variant="inset" collapsible="icon" className="bg-gray-900 text-white">
      <SidebarHeader className="border-b border-gray-800 px-4 py-3">
        <div className="flex items-center gap-2">
          <Car className="h-6 w-6 text-blue-400" />
          <span className="font-bold text-lg group-data-[collapsible=icon]:hidden">Drishti</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-gray-400 group-data-[collapsible=icon]:hidden px-4 pt-4">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.href)}
                      tooltip={item.name}
                      className={`text-sm transition-all rounded-lg px-3 py-2 w-full flex items-center gap-3 ${
                        isActive(item.href) ? "bg-blue-600 text-white" : "hover:bg-gray-800 text-gray-300"
                      }`}
                    >
                      <a href={item.href} className="flex items-center gap-3 w-full">
                        <Icon className="h-5 w-5" />
                        <span className="group-data-[collapsible=icon]:hidden">{item.name}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-gray-400 group-data-[collapsible=icon]:hidden px-4 pt-4">Quick Actions</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={handleRaiseTicket}
                  tooltip="Raise New Ticket"
                  className="text-sm transition-all rounded-lg px-3 py-2 w-full flex items-center gap-3 hover:bg-gray-800 text-gray-300"
                >
                  <Plus className="h-5 w-5" />
                  <span className="group-data-[collapsible=icon]:hidden">Raise Ticket</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-4 py-3 text-xs text-gray-500 group-data-[collapsible=icon]:hidden">
        Drishti v1.0
      </SidebarFooter>
    </Sidebar>
  )
}
