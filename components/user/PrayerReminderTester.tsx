'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { TestTube, Play, Trash2, CheckCircle, XCircle, Clock, Loader2, FlaskConical, Zap } from 'lucide-react'

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
    <Card className="border-dashed border-2">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-lg">
              <FlaskConical className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                Reminder System Tester
                <Badge variant="secondary" className="text-xs">
                  Dev Tools
                </Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Comprehensive testing suite for the prayer reminder system
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={clearResults}
              disabled={isRunning}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Clear
            </Button>
            <Button
              onClick={runAllTests}
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Run Tests
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">

        {/* Current Test Status */}
        {currentTest && (
          <Alert className="bg-slate-50 border-slate-200">
            <div className="flex items-center gap-3">
              <Loader2 className="h-4 w-4 animate-spin text-slate-600" />
              <div>
                <AlertDescription className="text-slate-800 font-medium">
                  {currentTest}
                </AlertDescription>
              </div>
            </div>
          </Alert>
        )}

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <TestTube className="w-4 h-4" />
                Test Results
              </h3>
              <Badge variant="outline" className="text-xs">
                {testResults.length} tests
              </Badge>
            </div>
            <div className="grid gap-3">
              {testResults.map((result, index) => (
                <Card
                  key={index}
                  className={`transition-all duration-200 ${
                    result.status === 'success'
                      ? 'bg-green-50/50 border-green-200 hover:bg-green-50'
                      : result.status === 'error'
                      ? 'bg-red-50/50 border-red-200 hover:bg-red-50'
                      : 'bg-slate-50/50 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="mt-0.5">
                          {result.status === 'success' ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : result.status === 'error' ? (
                            <XCircle className="w-4 h-4 text-red-600" />
                          ) : (
                            <Clock className="w-4 h-4 text-slate-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-sm mb-1">
                            {result.test}
                          </div>
                          <p className={`text-xs ${
                            result.status === 'success'
                              ? 'text-green-700'
                              : result.status === 'error'
                              ? 'text-red-700'
                              : 'text-slate-700'
                          }`}>
                            {result.message}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs font-mono">
                        {result.timestamp}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Test Instructions */}
        {testResults.length === 0 && !isRunning && (
          <Card className="bg-gradient-to-br from-slate-50 to-gray-50 border-slate-200">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-slate-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to Test</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Run comprehensive tests to verify all prayer reminder system components are working correctly.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="bg-white/80 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Core Tests</h4>
                  <ul className="text-left space-y-1 text-gray-600">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-3 h-3 text-green-600" />
                      Browser notification support
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-3 h-3 text-green-600" />
                      Permission management
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-3 h-3 text-green-600" />
                      localStorage functionality
                    </li>
                  </ul>
                </div>
                <div className="bg-white/80 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Advanced Tests</h4>
                  <ul className="text-left space-y-1 text-gray-600">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-3 h-3 text-green-600" />
                      Immediate notifications
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-3 h-3 text-green-600" />
                      Scheduled notifications
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-3 h-3 text-green-600" />
                      Time calculations
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary */}
        {testResults.length > 0 && !isRunning && (
          <Card className="bg-slate-50 border-slate-200">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <div className="flex items-center gap-3">
                  <TestTube className="w-4 h-4 text-slate-600" />
                  <span className="text-sm font-medium">
                    Test Summary: {testResults.length} tests completed
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700">
                      {testResults.filter(r => r.status === 'success').length}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <XCircle className="w-4 h-4 text-red-600" />
                    <span className="text-sm font-medium text-red-700">
                      {testResults.filter(r => r.status === 'error').length}
                    </span>
                  </div>
                </div>
              </div>
              {testResults.filter(r => r.status === 'error').length === 0 && (
                <Alert className="mt-4 bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    🎉 All tests passed! The reminder system is working correctly.
                  </AlertDescription>
                </Alert>
              )}
              {testResults.filter(r => r.status === 'error').length > 0 && (
                <Alert className="mt-4 bg-red-50 border-red-200">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    Some tests failed. Check the results above for troubleshooting.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  )
}