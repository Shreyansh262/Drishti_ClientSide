"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

export default function DashboardLayout({ children }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const vehicleNumber = localStorage.getItem("vehicleNumber")
      if (!vehicleNumber) {
        router.push("/login")
      } else {
        setIsAuthenticated(true)
      }

      // Load settings
      const savedSettings = localStorage.getItem("drishti-settings")
      if (savedSettings) {
        const settings = JSON.parse(savedSettings)
        document.documentElement.classList.toggle("dark", settings.darkMode || false)
      }

      setIsLoading(false)
    }
  }, [router])

  const getBreadcrumbs = () => {
    const segments = pathname.split("/").filter(Boolean)
    const breadcrumbs = []

    if (segments.length > 1) {
      breadcrumbs.push({ name: "Dashboard", href: "/dashboard" })

      if (segments[1] === "tickets") {
        breadcrumbs.push({ name: "Support", href: "/dashboard/tickets" })
        if (segments[2] === "new") {
          breadcrumbs.push({ name: "New Ticket", href: "/dashboard/tickets/new" })
        }
      } else {
        const pageName = segments[1].charAt(0).toUpperCase() + segments[1].slice(1)
        breadcrumbs.push({ name: pageName, href: pathname })
      }
    }

    return breadcrumbs
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  const breadcrumbs = getBreadcrumbs()

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              {breadcrumbs.map((breadcrumb, index) => (
                <div key={breadcrumb.href} className="flex items-center">
                  {index > 0 && <BreadcrumbSeparator />}
                  <BreadcrumbItem>
                    {index === breadcrumbs.length - 1 ? (
                      <BreadcrumbPage>{breadcrumb.name}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink href={breadcrumb.href}>{breadcrumb.name}</BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </div>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
