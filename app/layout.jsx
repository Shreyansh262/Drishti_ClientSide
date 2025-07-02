import "./globals.css"
import { Inter } from "next/font/google"
import { Footer } from "@/components/layout/footer"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Drishti - Driver Monitoring System",
  description: "Advanced driver safety and monitoring system with real-time alerts",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Drishti",
  },
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#3b82f6",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head />
      <body className={`flex flex-col min-h-screen ${inter.className}`}>
        {/* <Header /> */}
        <main className="flex-grow">{children}</main>
        <Footer />
      </body>
    </html>
  )
}

