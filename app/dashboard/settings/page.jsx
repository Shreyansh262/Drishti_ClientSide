"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Moon, Sun, Bell, Volume2, Shield, SettingsIcon, Palette } from "lucide-react"

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    darkMode: false,
    notifications: true,
    soundAlerts: true,
    alertVolume: 75,
    autoSync: true,
    dataCollection: true,
    language: "en",
    alertSensitivity: "medium",
    theme: "blue",
  })

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedSettings = localStorage.getItem("drishti-settings")
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings)
        setSettings(parsedSettings)
        document.documentElement.classList.toggle("dark", parsedSettings.darkMode || false)
        document.documentElement.className = document.documentElement.className.replace(/theme-\w+/g, "")
        document.documentElement.classList.add(`theme-${parsedSettings.theme || "blue"}`)
      }
    }
  }, [])

  const updateSetting = (key, value) => {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)

    if (typeof window !== "undefined") {
      localStorage.setItem("drishti-settings", JSON.stringify(newSettings))
    }

    if (key === "darkMode") {
      document.documentElement.classList.toggle("dark", value)
    }

    if (key === "theme") {
      document.documentElement.className = document.documentElement.className.replace(/theme-\w+/g, "")
      document.documentElement.classList.add(`theme-${value}`)
    }
  }

  const handleSaveSettings = () => {
    // BACKEND: Save settings to server/Google Cloud
    console.log("Saving settings:", settings)
    alert("Settings saved successfully!")
  }

  const handleResetSettings = () => {
    const defaultSettings = {
      darkMode: false,
      notifications: true,
      soundAlerts: true,
      alertVolume: 75,
      autoSync: true,
      dataCollection: true,
      language: "en",
      alertSensitivity: "medium",
      theme: "blue",
    }
    setSettings(defaultSettings)
    if (typeof window !== "undefined") {
      localStorage.setItem("drishti-settings", JSON.stringify(defaultSettings))
    }
    document.documentElement.classList.toggle("dark", false)
    document.documentElement.className = document.documentElement.className.replace(/theme-\w+/g, "")
    document.documentElement.classList.add("theme-blue")
    alert("Settings reset to defaults!")
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full text-white">
          <SettingsIcon className="h-6 w-6" />
        </div>
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>

      {/* Appearance Settings */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Appearance
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {settings.darkMode ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              <div>
                <Label className="text-base font-medium">Dark Mode</Label>
                <p className="text-sm text-gray-500">Switch between light and dark themes</p>
              </div>
            </div>
            <Switch checked={settings.darkMode} onCheckedChange={(checked) => updateSetting("darkMode", checked)} />
          </div>

          <div className="space-y-2">
            <Label className="text-base font-medium">Theme Color</Label>
            <Select value={settings.theme} onValueChange={(value) => updateSetting("theme", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="blue">Ocean Blue</SelectItem>
                <SelectItem value="purple">Royal Purple</SelectItem>
                <SelectItem value="green">Nature Green</SelectItem>
                <SelectItem value="orange">Sunset Orange</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications & Alerts
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5" />
              <div>
                <Label className="text-base font-medium">Push Notifications</Label>
                <p className="text-sm text-gray-500">Receive alerts for safety incidents</p>
              </div>
            </div>
            <Switch
              checked={settings.notifications}
              onCheckedChange={(checked) => updateSetting("notifications", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Volume2 className="h-5 w-5" />
              <div>
                <Label className="text-base font-medium">Sound Alerts</Label>
                <p className="text-sm text-gray-500">Play audio alerts for critical warnings</p>
              </div>
            </div>
            <Switch
              checked={settings.soundAlerts}
              onCheckedChange={(checked) => updateSetting("soundAlerts", checked)}
            />
          </div>

          <div className="space-y-3">
            <Label className="text-base font-medium">Alert Volume</Label>
            <div className="px-3">
              <Slider
                value={[settings.alertVolume]}
                onValueChange={(value) => updateSetting("alertVolume", value[0])}
                max={100}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-500 mt-1">
                <span>Quiet</span>
                <span>{settings.alertVolume}%</span>
                <span>Loud</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-base font-medium">Alert Sensitivity</Label>
            <Select
              value={settings.alertSensitivity}
              onValueChange={(value) => updateSetting("alertSensitivity", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">🟢 Low - Only critical alerts</SelectItem>
                <SelectItem value="medium">🟡 Medium - Balanced alerts</SelectItem>
                <SelectItem value="high">🔴 High - All safety alerts</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Data & Privacy */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Data & Privacy
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5" />
              <div>
                <Label className="text-base font-medium">Auto Sync</Label>
                <p className="text-sm text-gray-500">Automatically sync data from Google Cloud</p>
              </div>
            </div>
            <Switch checked={settings.autoSync} onCheckedChange={(checked) => updateSetting("autoSync", checked)} />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5" />
              <div>
                <Label className="text-base font-medium">Data Collection</Label>
                <p className="text-sm text-gray-500">Allow data collection for improvements</p>
              </div>
            </div>
            <Switch
              checked={settings.dataCollection}
              onCheckedChange={(checked) => updateSetting("dataCollection", checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4 pt-6">
        <Button onClick={handleSaveSettings} className="flex-1 h-12 bg-gradient-to-r from-blue-500 to-purple-600">
          Save All Settings
        </Button>
        <Button onClick={handleResetSettings} variant="outline" className="flex-1 h-12 bg-transparent">
          Reset to Defaults
        </Button>
      </div>

      {/* Backend Integration Note */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-800">Backend Integration</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-700 text-sm">
          <p>Settings page needs backend integration to:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Save user preferences to Google Cloud or database</li>
            <li>Sync settings across devices</li>
            <li>Apply notification preferences to alert system</li>
            <li>Handle data collection consent</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
