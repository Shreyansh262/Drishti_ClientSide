"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Separator } from "@/components/ui/separator"
import { Footer } from "@/components/layout/footer"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
// import { useTheme } from "next-themes" // This might be used if theme switcher is here

export default function DashboardLayout({ children }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  // const { theme, setTheme } = useTheme() // For theme switching, if needed here

  useEffect(() => {
    if (typeof window !== "undefined") {
      const vehicleNumber = localStorage.getItem("vehicleNumber")
      if (!vehicleNumber) {
        router.push("/login")
      } else {
        setIsAuthenticated(true)
      }

      // REMOVED: Dark mode loading logic, now handled by next-themes via layout.jsx
      // const savedSettings = localStorage.getItem("drishti-settings")
      // if (savedSettings) {
      //   const settings = JSON.parse(savedSettings)
      //   document.documentElement.classList.toggle("dark", settings.darkMode || false)
      // }

      setIsLoading(false)
    }
  }, [router])

  const getBreadcrumbs = () => {
    const segments = pathname.split("/").filter(Boolean)
    const breadcrumbs = []

    if (segments.length > 1) {
      breadcrumbs.push({ name: "Home", href: "/dashboard" }) // Assuming dashboard is home
    }

    // Map segments to breadcrumbs (e.g., /dashboard/history -> Home > History)
    segments.forEach((segment, index) => {
      if (segment === "dashboard" && index === 0) {
        // Already added "Home"
        return
      }
      const href = "/" + segments.slice(0, index + 1).join("/")
      const name = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ")
      breadcrumbs.push({ name, href })
    })

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
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-background z-20"> {/* Added bg-background and z-20 for header */}
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
        <div className="flex flex-1 flex-col gap-4 p-4 pb-16 overflow-auto"> {/* Added pb-16 to ensure space for fixed footer, and overflow-auto */}
          {children}
        </div>
        <Footer />
      </SidebarInset>
    </SidebarProvider>
  )
}