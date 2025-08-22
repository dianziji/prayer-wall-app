'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSession } from '@/lib/useSession'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Bell, Clock, Calendar, MessageSquare, Save, AlertTriangle, CheckCircle, XCircle, Loader2 } from 'lucide-react'

interface ReminderSettings {
  enabled: boolean
  dailyTime: string // HH:MM format
  frequency: 'daily' | 'weekly' | 'custom'
  customDays: number[] // 0-6, Sunday = 0
  message: string
}

const defaultSettings: ReminderSettings = {
  enabled: false,
  dailyTime: '09:00',
  frequency: 'daily',
  customDays: [0, 1, 2, 3, 4, 5, 6], // All days
  message: 'Time for prayer and reflection'
}

const STORAGE_KEY = 'prayer-reminders'

export default function PrayerReminders() {
  const { session } = useSession()
  const [settings, setSettings] = useState<ReminderSettings>(defaultSettings)
  const [notificationSupported, setNotificationSupported] = useState(false)
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default')
  const [isLoading, setIsLoading] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  
  // Use ref to store timer IDs to avoid stale closures
  const timersRef = useRef<NodeJS.Timeout[]>([])

  // Load settings on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if ('Notification' in window) {
        setNotificationSupported(true)
        setNotificationPermission(Notification.permission)
      }
      
      // Load saved settings
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        try {
          const parsedSettings = JSON.parse(saved)
          setSettings({ ...defaultSettings, ...parsedSettings })
        } catch (error) {
          console.error('Error parsing reminder settings:', error)
        }
      }
    }
  }, [])

  // Clear all timers
  const clearAllTimers = useCallback(() => {
    timersRef.current.forEach(timer => clearTimeout(timer))
    timersRef.current = []
  }, [])

  // Show notification
  const showNotification = useCallback(() => {
    if (notificationPermission === 'granted' && typeof window !== 'undefined') {
      try {
        new Notification('Prayer Reminder', {
          body: settings.message,
          icon: '/favicon.ico',
          tag: 'prayer-reminder',
          requireInteraction: false,
          silent: false
        })
      } catch (error) {
        console.error('Error showing notification:', error)
      }
    }
  }, [notificationPermission, settings.message])

  // Calculate next reminder time for a specific day
  const getNextReminderTime = useCallback((dayOfWeek: number, timeString: string): Date => {
    const [hours, minutes] = timeString.split(':').map(Number)
    const now = new Date()
    const today = now.getDay()
    
    let targetDate = new Date()
    targetDate.setHours(hours, minutes, 0, 0)
    
    if (dayOfWeek === today) {
      // If it's today, check if the time has already passed
      if (now.getTime() >= targetDate.getTime()) {
        // Time has passed, schedule for next week
        targetDate.setDate(targetDate.getDate() + 7)
      }
    } else {
      // Calculate days until target day
      const daysUntilTarget = (dayOfWeek - today + 7) % 7
      if (daysUntilTarget === 0) {
        // This means target day is next week
        targetDate.setDate(targetDate.getDate() + 7)
      } else {
        targetDate.setDate(targetDate.getDate() + daysUntilTarget)
      }
    }
    
    return targetDate
  }, [])

  // Schedule reminders based on current settings
  const scheduleReminders = useCallback(() => {
    clearAllTimers()
    
    if (!settings.enabled || notificationPermission !== 'granted') {
      return
    }

    let scheduledDays: number[] = []
    
    // Determine which days to schedule
    if (settings.frequency === 'daily') {
      scheduledDays = [0, 1, 2, 3, 4, 5, 6] // All days
    } else if (settings.frequency === 'weekly') {
      scheduledDays = [0] // Sunday only
    } else if (settings.frequency === 'custom') {
      scheduledDays = settings.customDays
    }

    // Schedule for each selected day
    scheduledDays.forEach(dayOfWeek => {
      const nextTime = getNextReminderTime(dayOfWeek, settings.dailyTime)
      const now = new Date()
      const timeUntilNotification = nextTime.getTime() - now.getTime()

      if (timeUntilNotification > 0) {
        const timer = setTimeout(() => {
          showNotification()
          // For testing, we don't auto-reschedule to avoid infinite loops
          // In a real app, you might want to reschedule here
        }, timeUntilNotification)

        timersRef.current.push(timer)

      }
    })
  }, [settings, notificationPermission, clearAllTimers, getNextReminderTime, showNotification])

  // Auto-schedule when settings change
  useEffect(() => {
    if (settings.enabled) {
      scheduleReminders()
    } else {
      clearAllTimers()
    }

    // Cleanup on unmount
    return () => clearAllTimers()
  }, [settings.enabled, settings.dailyTime, settings.frequency, settings.customDays, scheduleReminders, clearAllTimers])

  // Request notification permission
  const requestNotificationPermission = async () => {
    if (!notificationSupported) {
      return 'denied' as NotificationPermission
    }
    
    try {
      const permission = await Notification.requestPermission()
      setNotificationPermission(permission)
      return permission
    } catch (error) {
      console.error('Error requesting notification permission:', error)
      return 'denied' as NotificationPermission
    }
  }

  // Save settings to localStorage
  const saveSettings = () => {
    setIsLoading(true)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    
    setTimeout(() => {
      setIsLoading(false)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2000)
    }, 500)
  }

  // Auto-save settings when they change
  useEffect(() => {
    if (settings !== defaultSettings) {
      const timeoutId = setTimeout(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
      }, 1000) // Debounce saves

      return () => clearTimeout(timeoutId)
    }
  }, [settings])

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  if (!session) {
    return null
  }

  return (
    <Card className="bg-transparent border-none shadow-none">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Prayer Reminders
          </CardTitle>
          <div className="flex items-center gap-2">
            <Switch
              id="reminder-toggle"
              checked={settings.enabled}
              onCheckedChange={async (checked) => {
                if (checked && notificationPermission !== 'granted') {
                  const permission = await requestNotificationPermission()
                  if (permission !== 'granted') {
                    return
                  }
                }
                setSettings(prev => ({ ...prev, enabled: checked }))
              }}
            />
            <Label htmlFor="reminder-toggle" className="text-sm">
              {settings.enabled ? 'Enabled' : 'Disabled'}
            </Label>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Status Messages */}
        {!notificationSupported && (
          <Alert className="mb-4" variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Notifications are not supported in your browser
            </AlertDescription>
          </Alert>
        )}

        {notificationSupported && notificationPermission === 'denied' && (
          <Alert className="mb-4" variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              Notifications are blocked. Please enable them in your browser settings to use reminders.
            </AlertDescription>
          </Alert>
        )}

        {notificationSupported && notificationPermission === 'default' && !settings.enabled && (
          <Alert className="mb-4">
            <Bell className="h-4 w-4" />
            <AlertDescription>
              Enable reminders to allow notifications for prayer reminders.
            </AlertDescription>
          </Alert>
        )}

        {notificationSupported && notificationPermission === 'granted' && settings.enabled && (
          <Alert className="mb-4" variant="default">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Reminders are active! You&apos;ll receive notifications at your selected times.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          {/* Time and Frequency Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Time Setting */}
            <div className="space-y-2">
              <Label htmlFor="reminder-time" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Reminder Time
              </Label>
              <Input
                id="reminder-time"
                type="time"
                value={settings.dailyTime}
                onChange={(e) => setSettings(prev => ({ ...prev, dailyTime: e.target.value }))}
                disabled={!settings.enabled}
                className="w-full max-w-40"
              />
            </div>

            {/* Frequency Setting */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Frequency
              </Label>
              <RadioGroup
                value={settings.frequency}
                onValueChange={(value: 'daily' | 'weekly' | 'custom') => 
                  setSettings(prev => ({ ...prev, frequency: value }))
                }
                disabled={!settings.enabled}
                className="space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="daily" id="daily" disabled={!settings.enabled} />
                  <Label htmlFor="daily" className="text-sm">Daily</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="weekly" id="weekly" disabled={!settings.enabled} />
                  <Label htmlFor="weekly" className="text-sm">Weekly (Sundays)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="custom" id="custom" disabled={!settings.enabled} />
                  <Label htmlFor="custom" className="text-sm">Custom days</Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          {/* Custom Days Selection */}
          {settings.frequency === 'custom' && (
            <div className="space-y-3">
              <Label>Select Days</Label>
              <div className="grid grid-cols-7 gap-2">
                {dayNames.map((day, index) => {
                  const isChecked = settings.customDays.includes(index)
                  return (
                    <div key={index} className="flex flex-col items-center gap-2">
                      <Checkbox
                        id={`day-${index}`}
                        checked={isChecked}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSettings(prev => ({
                              ...prev,
                              customDays: [...prev.customDays, index].sort()
                            }))
                          } else {
                            setSettings(prev => ({
                              ...prev,
                              customDays: prev.customDays.filter(d => d !== index)
                            }))
                          }
                        }}
                        disabled={!settings.enabled}
                      />
                      <Label 
                        htmlFor={`day-${index}`} 
                        className={`text-xs cursor-pointer ${
                          index === 0 || index === 6 ? 'font-medium' : ''
                        }`}
                      >
                        {day.slice(0, 3)}
                      </Label>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Custom Message */}
          <div className="space-y-2">
            <Label htmlFor="reminder-message" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Reminder Message
            </Label>
            <Textarea
              id="reminder-message"
              value={settings.message}
              onChange={(e) => setSettings(prev => ({ ...prev, message: e.target.value }))}
              disabled={!settings.enabled}
              rows={2}
              maxLength={100}
              placeholder="Custom reminder message..."
              className="resize-none"
            />
            <div className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground">
                {settings.message.length}/100 characters
              </p>
              {settings.message.length > 80 && (
                <Badge variant="outline" className="text-xs">
                  {100 - settings.message.length} left
                </Badge>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Primary Actions */}
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={saveSettings}
                  disabled={isLoading}
                  className="flex items-center gap-2 text-black hover:opacity-90"
                  style={{ backgroundColor: '#ffca39' }}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Settings
                    </>
                  )}
                </Button>
              </div>
              
            </div>
            
          </div>

          {/* Success Message */}
          {saveSuccess && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Reminder settings saved successfully!
              </AlertDescription>
            </Alert>
          )}

        </div>
      </CardContent>
    </Card>
  )
}