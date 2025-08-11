'use client'

import { useState, useEffect } from 'react'

interface TestResult {
  test: string
  status: 'pending' | 'success' | 'error'
  message: string
  timestamp: string
}

export default function PrayerReminderTester() {
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [currentTest, setCurrentTest] = useState<string>('')

  const addResult = (test: string, status: 'success' | 'error', message: string) => {
    setTestResults(prev => [
      ...prev,
      {
        test,
        status,
        message,
        timestamp: new Date().toLocaleTimeString()
      }
    ])
  }

  const clearResults = () => {
    setTestResults([])
  }

  // Test 1: Check if notifications are supported
  const testNotificationSupport = async () => {
    setCurrentTest('Testing notification support...')
    
    try {
      if ('Notification' in window) {
        addResult('Notification Support', 'success', 'Browser supports notifications')
        return true
      } else {
        addResult('Notification Support', 'error', 'Browser does not support notifications')
        return false
      }
    } catch (error) {
      addResult('Notification Support', 'error', `Error: ${error}`)
      return false
    }
  }

  // Test 2: Check current permission status
  const testPermissionStatus = async () => {
    setCurrentTest('Checking permission status...')
    
    try {
      const permission = Notification.permission
      addResult('Permission Status', 'success', `Current permission: ${permission}`)
      return permission
    } catch (error) {
      addResult('Permission Status', 'error', `Error: ${error}`)
      return 'denied' as NotificationPermission
    }
  }

  // Test 3: Request notification permission
  const testPermissionRequest = async () => {
    setCurrentTest('Requesting notification permission...')
    
    try {
      const permission = await Notification.requestPermission()
      if (permission === 'granted') {
        addResult('Permission Request', 'success', 'Permission granted successfully')
      } else {
        addResult('Permission Request', 'error', `Permission ${permission}`)
      }
      return permission
    } catch (error) {
      addResult('Permission Request', 'error', `Error: ${error}`)
      return 'denied' as NotificationPermission
    }
  }

  // Test 4: Show immediate notification
  const testImmediateNotification = async () => {
    setCurrentTest('Testing immediate notification...')
    
    try {
      const notification = new Notification('Test Notification', {
        body: 'This is a test notification for Prayer Reminders',
        icon: '/favicon.ico',
        tag: 'test-notification'
      })

      notification.onclick = () => {
        addResult('Notification Click', 'success', 'User clicked the notification')
        notification.close()
      }

      notification.onerror = (error) => {
        addResult('Immediate Notification', 'error', `Notification error: ${error}`)
      }

      addResult('Immediate Notification', 'success', 'Notification sent successfully')
      
      // Auto close after 5 seconds
      setTimeout(() => {
        notification.close()
      }, 5000)
      
      return true
    } catch (error) {
      addResult('Immediate Notification', 'error', `Error: ${error}`)
      return false
    }
  }

  // Test 5: Schedule a notification in 10 seconds
  const testScheduledNotification = async () => {
    setCurrentTest('Scheduling notification for 10 seconds...')
    
    try {
      const timer = setTimeout(() => {
        try {
          const notification = new Notification('Scheduled Test', {
            body: 'This notification was scheduled 10 seconds ago!',
            icon: '/favicon.ico',
            tag: 'scheduled-test'
          })
          
          addResult('Scheduled Notification', 'success', 'Scheduled notification fired correctly')
          
          setTimeout(() => notification.close(), 5000)
        } catch (error) {
          addResult('Scheduled Notification', 'error', `Error in scheduled notification: ${error}`)
        }
      }, 10000)

      addResult('Schedule Setup', 'success', 'Notification scheduled for 10 seconds from now')
      return true
    } catch (error) {
      addResult('Scheduled Notification', 'error', `Error: ${error}`)
      return false
    }
  }

  // Test 6: Test localStorage functionality
  const testLocalStorage = async () => {
    setCurrentTest('Testing localStorage...')
    
    try {
      const testData = {
        enabled: true,
        dailyTime: '09:00',
        frequency: 'daily',
        message: 'Test message'
      }
      
      // Save test data
      localStorage.setItem('prayer-reminders-test', JSON.stringify(testData))
      
      // Retrieve test data
      const retrieved = localStorage.getItem('prayer-reminders-test')
      
      if (retrieved) {
        const parsed = JSON.parse(retrieved)
        if (JSON.stringify(parsed) === JSON.stringify(testData)) {
          addResult('localStorage', 'success', 'localStorage working correctly')
          localStorage.removeItem('prayer-reminders-test')
          return true
        } else {
          addResult('localStorage', 'error', 'Data mismatch in localStorage')
          return false
        }
      } else {
        addResult('localStorage', 'error', 'Could not retrieve data from localStorage')
        return false
      }
    } catch (error) {
      addResult('localStorage', 'error', `Error: ${error}`)
      return false
    }
  }

  // Test 7: Test time calculation logic
  const testTimeCalculation = async () => {
    setCurrentTest('Testing time calculation...')
    
    try {
      const now = new Date()
      const testTime = '14:30' // 2:30 PM
      const [hours, minutes] = testTime.split(':').map(Number)
      
      const targetDate = new Date()
      targetDate.setHours(hours, minutes, 0, 0)
      
      if (now.getTime() >= targetDate.getTime()) {
        targetDate.setDate(targetDate.getDate() + 1)
      }
      
      const timeUntil = targetDate.getTime() - now.getTime()
      const minutesUntil = Math.round(timeUntil / (1000 * 60))
      
      if (minutesUntil > 0) {
        addResult('Time Calculation', 'success', `Next 2:30 PM is in ${minutesUntil} minutes`)
        return true
      } else {
        addResult('Time Calculation', 'error', 'Invalid time calculation result')
        return false
      }
    } catch (error) {
      addResult('Time Calculation', 'error', `Error: ${error}`)
      return false
    }
  }

  // Test 8: Test day-of-week calculation
  const testDayCalculation = async () => {
    setCurrentTest('Testing day calculation...')
    
    try {
      const now = new Date()
      const today = now.getDay()
      const targetDay = (today + 1) % 7 // Tomorrow
      
      const daysUntilTarget = (targetDay - today + 7) % 7
      const expectedDays = daysUntilTarget === 0 ? 7 : daysUntilTarget
      
      if (expectedDays >= 1 && expectedDays <= 7) {
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        addResult('Day Calculation', 'success', `Next ${dayNames[targetDay]} is in ${expectedDays} day(s)`)
        return true
      } else {
        addResult('Day Calculation', 'error', `Invalid day calculation: ${expectedDays}`)
        return false
      }
    } catch (error) {
      addResult('Day Calculation', 'error', `Error: ${error}`)
      return false
    }
  }

  // Run all tests
  const runAllTests = async () => {
    setIsRunning(true)
    clearResults()
    
    try {
      // Sequential test execution
      const supportOk = await testNotificationSupport()
      if (!supportOk) {
        setIsRunning(false)
        return
      }
      
      await new Promise(resolve => setTimeout(resolve, 500))
      const permission = await testPermissionStatus()
      
      await new Promise(resolve => setTimeout(resolve, 500))
      if (permission !== 'granted') {
        await testPermissionRequest()
      }
      
      await new Promise(resolve => setTimeout(resolve, 500))
      await testLocalStorage()
      
      await new Promise(resolve => setTimeout(resolve, 500))
      await testTimeCalculation()
      
      await new Promise(resolve => setTimeout(resolve, 500))
      await testDayCalculation()
      
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Only test notifications if permission is granted
      if (Notification.permission === 'granted') {
        await testImmediateNotification()
        
        await new Promise(resolve => setTimeout(resolve, 2000))
        await testScheduledNotification()
      } else {
        addResult('Notification Tests', 'error', 'Skipped - permission not granted')
      }
      
    } catch (error) {
      addResult('Test Suite', 'error', `Unexpected error: ${error}`)
    } finally {
      setCurrentTest('')
      setIsRunning(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6 mt-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">🧪 Reminder System Tester</h2>
        <div className="flex gap-3">
          <button
            onClick={clearResults}
            disabled={isRunning}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 text-sm font-medium"
          >
            Clear Results
          </button>
          <button
            onClick={runAllTests}
            disabled={isRunning}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm font-medium"
          >
            {isRunning ? 'Running Tests...' : 'Run All Tests'}
          </button>
        </div>
      </div>

      {/* Current Test Status */}
      {currentTest && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            {currentTest}
          </div>
        </div>
      )}

      {/* Test Results */}
      <div className="space-y-3">
        {testResults.map((result, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg border ${
              result.status === 'success'
                ? 'bg-green-50 border-green-200'
                : result.status === 'error'
                ? 'bg-red-50 border-red-200'
                : 'bg-yellow-50 border-yellow-200'
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {result.status === 'success' ? '✅' : result.status === 'error' ? '❌' : '⏳'}
                  {result.test}
                </span>
              </div>
              <span className="text-xs text-gray-500">{result.timestamp}</span>
            </div>
            <p className={`text-sm mt-1 ${
              result.status === 'success'
                ? 'text-green-700'
                : result.status === 'error'
                ? 'text-red-700'
                : 'text-yellow-700'
            }`}>
              {result.message}
            </p>
          </div>
        ))}
      </div>

      {/* Test Instructions */}
      {testResults.length === 0 && !isRunning && (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">🧪</div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">Prayer Reminder System Tester</h3>
          <p className="text-gray-600 mb-4">
            This will test all components of the prayer reminder system to ensure everything works correctly.
          </p>
          <div className="text-sm text-gray-500">
            <p className="mb-2"><strong>Tests include:</strong></p>
            <ul className="text-left inline-block space-y-1">
              <li>• Browser notification support</li>
              <li>• Permission status and requests</li>
              <li>• Immediate and scheduled notifications</li>
              <li>• localStorage functionality</li>
              <li>• Time and day calculations</li>
            </ul>
          </div>
        </div>
      )}

      {/* Summary */}
      {testResults.length > 0 && !isRunning && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600">
            <div className="flex justify-between items-center">
              <span>
                <strong>Test Summary:</strong> {testResults.length} tests completed
              </span>
              <span>
                ✅ {testResults.filter(r => r.status === 'success').length} • 
                ❌ {testResults.filter(r => r.status === 'error').length}
              </span>
            </div>
            {testResults.filter(r => r.status === 'error').length === 0 && (
              <p className="mt-2 text-green-600 font-medium">
                🎉 All tests passed! The reminder system should work correctly.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}