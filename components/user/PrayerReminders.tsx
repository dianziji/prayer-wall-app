'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSession } from '@/lib/useSession'

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
  message: 'Time for prayer and reflection 🙏'
}

const STORAGE_KEY = 'prayer-reminders'

export default function PrayerReminders() {
  const { session } = useSession()
  const [settings, setSettings] = useState<ReminderSettings>(defaultSettings)
  const [notificationSupported, setNotificationSupported] = useState(false)
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default')
  const [isLoading, setIsLoading] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [debugInfo, setDebugInfo] = useState<string>('')
  
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
    setDebugInfo(prev => prev + '\n🧹 Cleared all existing timers')
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
        setDebugInfo(prev => prev + '\n🔔 Notification shown successfully')
      } catch (error) {
        console.error('Error showing notification:', error)
        setDebugInfo(prev => prev + '\n❌ Error showing notification')
      }
    } else {
      setDebugInfo(prev => prev + '\n⚠️ Cannot show notification - permission not granted')
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
      setDebugInfo(prev => prev + '\n⏹️ Not scheduling - reminders disabled or permission not granted')
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

    setDebugInfo(prev => prev + `\n📅 Scheduling for days: ${scheduledDays.join(', ')} at ${settings.dailyTime}`)

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

        const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayOfWeek]
        const timeFormatted = nextTime.toLocaleString()
        setDebugInfo(prev => prev + `\n⏰ Scheduled for ${dayName} at ${timeFormatted} (in ${Math.round(timeUntilNotification / 1000 / 60)} minutes)`)
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
      setDebugInfo(prev => prev + '\n❌ Notifications not supported')
      return 'denied' as NotificationPermission
    }
    
    try {
      const permission = await Notification.requestPermission()
      setNotificationPermission(permission)
      setDebugInfo(prev => prev + `\n🔐 Permission result: ${permission}`)
      return permission
    } catch (error) {
      console.error('Error requesting notification permission:', error)
      setDebugInfo(prev => prev + '\n❌ Error requesting permission')
      return 'denied' as NotificationPermission
    }
  }

  // Test notification immediately
  const testNotification = () => {
    setDebugInfo(prev => prev + '\n🧪 Testing notification...')
    showNotification()
  }

  // Save settings to localStorage
  const saveSettings = () => {
    setIsLoading(true)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    
    setTimeout(() => {
      setIsLoading(false)
      setSaveSuccess(true)
      setDebugInfo(prev => prev + '\n💾 Settings saved to localStorage')
      setTimeout(() => setSaveSuccess(false), 2000)
    }, 500)
  }

  // Toggle reminders with permission check
  const toggleReminders = async () => {
    if (!settings.enabled && notificationPermission !== 'granted') {
      setDebugInfo(prev => prev + '\n🔐 Requesting notification permission...')
      const permission = await requestNotificationPermission()
      if (permission !== 'granted') {
        setDebugInfo(prev => prev + '\n❌ Permission denied, cannot enable reminders')
        return
      }
    }
    
    setSettings(prev => {
      const newSettings = { ...prev, enabled: !prev.enabled }
      // Auto-save when toggling
      setTimeout(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings))
        setDebugInfo(prevDebug => prevDebug + '\n💾 Auto-saved settings')
      }, 100)
      return newSettings
    })
    
    setDebugInfo(prev => prev + `\n🔄 Reminders ${!settings.enabled ? 'enabled' : 'disabled'}`)
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

  // Clear debug info
  const clearDebugInfo = () => {
    setDebugInfo('')
  }

  // Quick test - schedule a notification in 5 seconds
  const quickTest = () => {
    if (notificationPermission !== 'granted') {
      setDebugInfo(prev => prev + '\n❌ Cannot quick test - permission not granted')
      return
    }

    setDebugInfo(prev => prev + '\n⚡ Quick test: notification in 5 seconds...')
    const timer = setTimeout(() => {
      showNotification()
      setDebugInfo(prev => prev + '\n✅ Quick test notification sent!')
    }, 5000)

    timersRef.current.push(timer)
  }

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  if (!session) {
    return null
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">🔔 Prayer Reminders</h2>
        <div className="flex items-center">
          <input
            type="checkbox"
            id="reminder-toggle"
            checked={settings.enabled}
            onChange={toggleReminders}
            className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
          />
          <label htmlFor="reminder-toggle" className="ml-2 text-sm text-gray-700">
            {settings.enabled ? 'Enabled' : 'Disabled'}
          </label>
        </div>
      </div>

      {/* Status Messages */}
      {!notificationSupported && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-sm">
          ⚠️ Notifications are not supported in your browser
        </div>
      )}

      {notificationSupported && notificationPermission === 'denied' && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          🚫 Notifications are blocked. Please enable them in your browser settings to use reminders.
        </div>
      )}

      {notificationSupported && notificationPermission === 'default' && !settings.enabled && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm">
          💡 Enable reminders to allow notifications for prayer reminders.
        </div>
      )}

      {notificationSupported && notificationPermission === 'granted' && settings.enabled && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          ✅ Reminders are active! You&apos;ll receive notifications at your selected times.
        </div>
      )}

      <div className="space-y-6">
        {/* Time Setting */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reminder Time
          </label>
          <input
            type="time"
            value={settings.dailyTime}
            onChange={(e) => setSettings(prev => ({ ...prev, dailyTime: e.target.value }))}
            disabled={!settings.enabled}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
          />
        </div>

        {/* Frequency Setting */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Frequency
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                value="daily"
                checked={settings.frequency === 'daily'}
                onChange={(e) => setSettings(prev => ({ ...prev, frequency: e.target.value as any }))}
                disabled={!settings.enabled}
                className="mr-2"
              />
              <span className="text-sm">Daily</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="weekly"
                checked={settings.frequency === 'weekly'}
                onChange={(e) => setSettings(prev => ({ ...prev, frequency: e.target.value as any }))}
                disabled={!settings.enabled}
                className="mr-2"
              />
              <span className="text-sm">Weekly (Sundays)</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="custom"
                checked={settings.frequency === 'custom'}
                onChange={(e) => setSettings(prev => ({ ...prev, frequency: e.target.value as any }))}
                disabled={!settings.enabled}
                className="mr-2"
              />
              <span className="text-sm">Custom days</span>
            </label>
          </div>
        </div>

        {/* Custom Days Selection */}
        {settings.frequency === 'custom' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Days
            </label>
            <div className="grid grid-cols-7 gap-2">
              {dayNames.map((day, index) => (
                <label key={index} className="flex flex-col items-center text-xs">
                  <input
                    type="checkbox"
                    checked={settings.customDays.includes(index)}
                    onChange={(e) => {
                      if (e.target.checked) {
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
                    className="mb-1"
                  />
                  <span className={index === 0 || index === 6 ? 'font-medium' : ''}>
                    {day.slice(0, 3)}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Custom Message */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reminder Message
          </label>
          <textarea
            value={settings.message}
            onChange={(e) => setSettings(prev => ({ ...prev, message: e.target.value }))}
            disabled={!settings.enabled}
            rows={2}
            maxLength={100}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
            placeholder="Custom reminder message..."
          />
          <p className="text-xs text-gray-500 mt-1">
            {settings.message.length}/100 characters
          </p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <button
            onClick={saveSettings}
            disabled={isLoading}
            className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 text-sm font-medium"
          >
            {isLoading ? 'Saving...' : 'Save'}
          </button>
          
          {settings.enabled && notificationPermission === 'granted' && (
            <>
              <button
                onClick={testNotification}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Test Now
              </button>
              
              <button
                onClick={quickTest}
                className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
              >
                Test in 5s
              </button>
            </>
          )}
          
          <button
            onClick={clearDebugInfo}
            className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
          >
            Clear Log
          </button>
        </div>

        {/* Success Message */}
        {saveSuccess && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm text-center">
            ✓ Reminder settings saved successfully!
          </div>
        )}

        {/* Debug Information */}
        {debugInfo && (
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-medium text-gray-700">Debug Log</h4>
              <span className="text-xs text-gray-500">
                Active timers: {timersRef.current.length}
              </span>
            </div>
            <pre className="text-xs text-gray-600 whitespace-pre-wrap max-h-40 overflow-y-auto">
              {debugInfo}
            </pre>
          </div>
        )}

        {/* Info Note */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
          <p className="mb-2">
            <strong>How to test:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li><strong>Test Now:</strong> Shows notification immediately</li>
            <li><strong>Test in 5s:</strong> Shows notification after 5 seconds</li>
            <li><strong>Debug Log:</strong> Shows scheduling information and errors</li>
            <li>Make sure your browser allows notifications for this site</li>
          </ul>
        </div>
      </div>
    </div>
  )
}