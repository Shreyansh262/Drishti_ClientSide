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
    <Sidebar variant="inset" collapsible="icon" className="bg-gray-900 text-white dark:bg-gray-950 dark:text-gray-100"> {/* Adjusted sidebar background for dark mode */}
      <SidebarHeader className="border-b border-gray-800 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center gap-2">
          <Car className="h-6 w-6 text-blue-400" />
          <span className="font-bold text-lg group-data-[collapsible=icon]:hidden">Drishti</span>
        </div>
      </SidebarHeader>
      <SidebarContent className="flex-1 overflow-auto py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-gray-400 dark:text-gray-500 group-data-[collapsible=icon]:hidden px-4 mb-2">Main Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href)
                return (
                  <SidebarMenuItem key={item.href} className="px-3">
                    <SidebarMenuButton
                      asChild
                      tooltip={item.name}
                      className={`
                        text-sm transition-all rounded-lg px-3 py-2 w-full flex items-center gap-3
                        ${active
                          ? "bg-primary text-primary-foreground hover:bg-primary/90" // Active state
                          : "text-gray-300 hover:bg-gray-800 hover:text-white dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-50" // Inactive state
                        }
                      `}
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
          <SidebarGroupLabel className="text-gray-400 dark:text-gray-500 group-data-[collapsible=icon]:hidden px-4 pt-4">Quick Actions</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={handleRaiseTicket}
                  tooltip="Raise New Ticket"
                  className="text-sm transition-all rounded-lg px-3 py-2 w-full flex items-center gap-3 hover:bg-blue-600 text-white bg-blue-500 dark:bg-blue-700 dark:hover:bg-blue-800" // Styled button for quick action
                >
                  <Plus className="h-5 w-5" />
                  <span className="group-data-[collapsible=icon]:hidden">Raise Ticket</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-4 py-3 text-xs text-gray-500 dark:text-gray-600 group-data-[collapsible=icon]:hidden border-t border-gray-800 dark:border-gray-700"> {/* Added dark mode border */}
        Drishti v1.0
      </SidebarFooter>
    </Sidebar>
  )
}