"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Moon, Sun, Bell, Volume2, Shield, Settings, Palette } from "lucide-react"

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

  const [saveStatus, setSaveStatus] = useState("")

  const updateSetting = (key, value) => {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)

    // Apply theme changes immediately
    if (key === "darkMode") {
      document.documentElement.classList.toggle("dark", value)
    }

    if (key === "theme") {
      document.documentElement.className = document.documentElement.className.replace(/theme-\w+/g, "")
      document.documentElement.classList.add(`theme-${value}`)
    }
  }

  const handleSaveSettings = () => {
    // Simulate API call
    setSaveStatus("saving")
    setTimeout(() => {
      console.log("Saving settings:", settings)
      setSaveStatus("saved")
      setTimeout(() => setSaveStatus(""), 2000)
    }, 1000)
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
    document.documentElement.classList.remove("dark")
    document.documentElement.className = document.documentElement.className.replace(/theme-\w+/g, "")
    document.documentElement.classList.add("theme-blue")
    setSaveStatus("reset")
    setTimeout(() => setSaveStatus(""), 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 lg:p-8">
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl text-white shadow-lg">
            <Settings className="h-8 w-8" />
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Settings
          </h1>
        </div>

        {/* Status Message */}
        {saveStatus && (
          <div className={`p-4 rounded-lg text-center font-medium transition-all duration-300 ${
            saveStatus === "saving" ? "bg-blue-100 text-blue-800" :
            saveStatus === "saved" ? "bg-green-100 text-green-800" :
            saveStatus === "reset" ? "bg-orange-100 text-orange-800" : ""
          }`}>
            {saveStatus === "saving" && "Saving settings..."}
            {saveStatus === "saved" && "✓ Settings saved successfully!"}
            {saveStatus === "reset" && "✓ Settings reset to defaults!"}
          </div>
        )}

        {/* Appearance Settings */}
        <Card className="shadow-lg border-0 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Appearance
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6 bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {settings.darkMode ? 
                  <Moon className="h-5 w-5 text-slate-600" /> : 
                  <Sun className="h-5 w-5 text-yellow-500" />
                }
                <div>
                  <Label className="text-base font-medium">Dark Mode</Label>
                  <p className="text-sm text-gray-500">Switch between light and dark themes</p>
                </div>
              </div>
              <Switch 
                checked={settings.darkMode} 
                onCheckedChange={(checked) => updateSetting("darkMode", checked)} 
              />
            </div>

            <div className="space-y-2">
              <Label className="text-base font-medium">Theme Color</Label>
              <Select value={settings.theme} onValueChange={(value) => updateSetting("theme", value)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="blue">🌊 Ocean Blue</SelectItem>
                  <SelectItem value="purple">👑 Royal Purple</SelectItem>
                  <SelectItem value="green">🌿 Nature Green</SelectItem>
                  <SelectItem value="orange">🌅 Sunset Orange</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="shadow-lg border-0 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications & Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6 bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-blue-500" />
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
                <Volume2 className="h-5 w-5 text-green-500" />
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
                <div className="flex justify-between text-sm text-gray-500 mt-2">
                  <span>Quiet</span>
                  <span className="font-medium text-blue-600">{settings.alertVolume}%</span>
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
                <SelectTrigger className="w-full">
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
        <Card className="shadow-lg border-0 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Data & Privacy
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6 bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-green-500" />
                <div>
                  <Label className="text-base font-medium">Auto Sync</Label>
                  <p className="text-sm text-gray-500">Automatically sync data from Google Cloud</p>
                </div>
              </div>
              <Switch 
                checked={settings.autoSync} 
                onCheckedChange={(checked) => updateSetting("autoSync", checked)} 
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-blue-500" />
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
        <div className="flex flex-col sm:flex-row gap-4 lg:gap-6 pt-8">
          <Button 
            onClick={handleSaveSettings} 
            className="flex-1 h-14 text-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg transform hover:scale-[1.02] transition-all duration-200"
            disabled={saveStatus === "saving"}
          >
            {saveStatus === "saving" ? "Saving..." : "Save All Settings"}
          </Button>
          <Button 
            onClick={handleResetSettings} 
            variant="outline" 
            className="flex-1 h-14 text-lg border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transform hover:scale-[1.02] transition-all duration-200"
            disabled={saveStatus === "saving"}
          >
            Reset to Defaults
          </Button>
        </div>

        {/* Backend Integration Note */}
        <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg">
          <CardHeader>
            <CardTitle className="text-blue-800 flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Backend Integration Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="text-blue-700 text-sm">
            <p className="font-medium mb-2">This settings page needs backend integration to:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span>Save user preferences to Google Cloud</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span>Sync settings across devices</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span>Apply notification preferences</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span>Handle data collection consent</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}