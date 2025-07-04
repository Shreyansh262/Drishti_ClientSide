import "./globals.css";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider"; // Import the new ThemeProvider

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Drishti (दृष्टि) - Driver Monitoring System",
  description: "Advanced driver safety and monitoring system with real-time alerts",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Drishti (दृष्टि)",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#3b82f6",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className={`flex flex-col min-h-screen ${inter.className}`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <main className="flex-grow">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}