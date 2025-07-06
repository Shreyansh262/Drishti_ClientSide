"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Moon, Sun, Bell, Volume2, Shield, Settings, Palette } from "lucide-react"
import { useTheme } from "next-themes" // Import useTheme

export default function SettingsPage() {
  const { theme, setTheme } = useTheme() // Use useTheme hook
  const [settings, setSettings] = useState({
    // darkMode: false, // Handled by next-themes
    notifications: true,
    soundAlerts: true,
    alertVolume: 75,
    autoSync: true,
    dataCollection: true,
    language: "en",
    alertSensitivity: "medium",
    // theme: "blue", // Handled by next-themes if it controls multiple themes
  })

  const [saveStatus, setSaveStatus] = useState("")

  useEffect(() => {
    // Load other settings from localStorage, excluding dark mode
    if (typeof window !== "undefined") {
      const savedSettings = localStorage.getItem("drishti-settings")
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings)
        setSettings(prev => ({
          ...prev,
          ...parsedSettings,
          // darkMode: theme === "dark" // Sync internal state with next-themes
        }))
      }
    }
  }, [theme]) // Re-run if theme changes externally (e.g., system preference)

  const updateSetting = (key, value) => {
    if (key === "darkMode") {
      setTheme(value ? "dark" : "light") // Use next-themes' setTheme
      // No need to manually toggle document class
    } else {
      setSettings((prev) => ({ ...prev, [key]: value }))
      // For custom themes beyond light/dark managed by next-themes, keep this logic
      if (key === "theme") {
        document.documentElement.className = document.documentElement.className.replace(/theme-\w+/g, "")
        document.documentElement.classList.add(`theme-${value}`)
      }
    }
  }

  const handleSaveSettings = () => {
    setIsSubmitting(true)
    // Simulate API call
    setTimeout(() => {
      // Save settings (excluding darkMode as it's handled by next-themes' persistence)
      localStorage.setItem(
        "drishti-settings",
        JSON.stringify({
          notifications: settings.notifications,
          soundAlerts: settings.soundAlerts,
          alertVolume: settings.alertVolume,
          autoSync: settings.autoSync,
          dataCollection: settings.dataCollection,
          language: settings.language,
          alertSensitivity: settings.alertSensitivity,
          theme: settings.theme, // If you have multiple themes beyond light/dark
        })
      )
      setSaveStatus("success")
      setIsSubmitting(false)
      setTimeout(() => setSaveStatus(""), 3000)
    }, 1000)
  }

  const [isSubmitting, setIsSubmitting] = useState(false) // State for submission status

  return (
    <div className="space-y-6 p-4 md:p-6 bg-background text-foreground"> {/* Added bg-background and text-foreground */}
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-3">
        <Settings className="h-7 w-7 text-primary" />
        Settings
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Dark Mode Toggle */}
        <Card className="p-4 shadow-md bg-card text-card-foreground">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-semibold">Theme</CardTitle>
            <Palette className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="dark-mode" className="flex items-center gap-2">
                {theme === "dark" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                Dark Mode
              </Label>
              <Switch
                id="dark-mode"
                checked={theme === "dark"} // Control switch with next-themes' theme
                onCheckedChange={(checked) => updateSetting("darkMode", checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="p-4 shadow-md bg-card text-card-foreground">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-semibold">Notifications</CardTitle>
            <Bell className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="notifications">Enable Push Notifications</Label>
              <Switch
                id="notifications"
                checked={settings.notifications}
                onCheckedChange={(checked) => updateSetting("notifications", checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="sound-alerts">Sound Alerts</Label>
              <Switch
                id="sound-alerts"
                checked={settings.soundAlerts}
                onCheckedChange={(checked) => updateSetting("soundAlerts", checked)}
              />
            </div>
            {settings.soundAlerts && (
              <div>
                <Label htmlFor="alert-volume" className="flex items-center gap-2 mb-2">
                  <Volume2 className="h-4 w-4" />
                  Alert Volume: {settings.alertVolume}%
                </Label>
                <Slider
                  id="alert-volume"
                  min={0}
                  max={100}
                  step={1}
                  value={[settings.alertVolume]}
                  onValueChange={([value]) => updateSetting("alertVolume", value)}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Data & Sync */}
        <Card className="p-4 shadow-md bg-card text-card-foreground">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-semibold">Data & Sync</CardTitle>
            <Shield className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-sync">Auto Sync Data</Label>
              <Switch
                id="auto-sync"
                checked={settings.autoSync}
                onCheckedChange={(checked) => updateSetting("autoSync", checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="data-collection">Data Collection Consent</Label>
              <Switch
                id="data-collection"
                checked={settings.dataCollection}
                onCheckedChange={(checked) => updateSetting("dataCollection", checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Language & Preferences */}
        <Card className="p-4 shadow-md bg-card text-card-foreground">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-semibold">Preferences</CardTitle>
            <Settings className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="language" className="mb-2 block">
                Language
              </Label>
              <Select
                value={settings.language}
                onValueChange={(value) => updateSetting("language", value)}
              >
                <SelectTrigger id="language">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="hi">Hindi</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="alert-sensitivity" className="mb-2 block">
                Alert Sensitivity
              </Label>
              <Select
                value={settings.alertSensitivity}
                onValueChange={(value) => updateSetting("alertSensitivity", value)}
              >
                <SelectTrigger id="alert-sensitivity">
                  <SelectValue placeholder="Select sensitivity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

      </div>

      <div className="mt-8 flex justify-end">
        <Button onClick={handleSaveSettings} disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Settings"}
        </Button>
      </div>

      {saveStatus === "success" && (
        <p className="mt-4 text-center text-green-600 font-medium animate-fadeIn">
          Settings saved successfully!
        </p>
      )}
      {saveStatus === "error" && (
        <p className="mt-4 text-center text-red-600 font-medium animate-fadeIn">
          Failed to save settings. Please try again.
        </p>
      )}
    </div>
  )
}