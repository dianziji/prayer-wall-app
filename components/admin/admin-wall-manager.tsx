"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { PrayerWall } from '@/types/models'

type UserRole = {
  role: string
  organization_id: string
}

interface AdminWallManagerProps {
  currentWall: PrayerWall | null
  userRoles: UserRole[]
}

export function AdminWallManager({ currentWall, userRoles }: AdminWallManagerProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  const [theme, setTheme] = useState({
    title: currentWall?.theme?.title || '本周祷告',
    description: currentWall?.theme?.description || '在主里彼此代祷，分享感恩',
    color: currentWall?.theme?.color || '#ddeee1'
  })

  const handleSave = async () => {
    if (!currentWall) return
    
    setLoading(true)
    setMessage(null)
    
    try {
      const response = await fetch(`/api/admin/prayer-walls/${currentWall.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme: {
            title: theme.title,
            description: theme.description,
            color: theme.color
          }
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update wall theme')
      }

      setMessage({ type: 'success', text: 'Prayer wall theme updated successfully!' })
      setIsEditing(false)
      
      // Refresh page to show changes
      setTimeout(() => {
        window.location.reload()
      }, 1500)
      
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update theme. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const canManage = userRoles.some(role => ['admin', 'moderator'].includes(role.role))

  if (!canManage) {
    return (
      <Alert>
        <AlertDescription>
          You don&apos;t have permission to manage prayer wall settings.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Current Wall Status */}
      <Card>
        <CardHeader>
          <CardTitle>Current Week Prayer Wall</CardTitle>
        </CardHeader>
        <CardContent>
          {currentWall ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Week Start</Label>
                  <p className="text-lg font-mono">{currentWall.week_start}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Status</Label>
                  <p className={`text-lg ${currentWall.is_active ? 'text-green-600' : 'text-red-600'}`}>
                    {currentWall.is_active ? 'Active' : 'Inactive'}
                  </p>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-700">Prayer Count</Label>
                <p className="text-2xl font-bold">{currentWall.stats?.prayer_count || 0}</p>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">No prayer wall found for current week</p>
          )}
        </CardContent>
      </Card>

      {/* Theme Management */}
      {currentWall && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Prayer Wall Theme</CardTitle>
            {!isEditing && (
              <Button 
                variant="outline" 
                onClick={() => setIsEditing(true)}
              >
                Edit Theme
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={theme.title}
                    onChange={(e) => setTheme(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Prayer wall title"
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={theme.description}
                    onChange={(e) => setTheme(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Prayer wall description"
                    rows={3}
                  />
                </div>
                
                <div>
                  <Label htmlFor="color">Background Color</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      id="color"
                      type="color"
                      value={theme.color}
                      onChange={(e) => setTheme(prev => ({ ...prev, color: e.target.value }))}
                      className="w-16 h-10"
                    />
                    <Input
                      value={theme.color}
                      onChange={(e) => setTheme(prev => ({ ...prev, color: e.target.value }))}
                      placeholder="#ddeee1"
                      className="font-mono"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={handleSave} disabled={loading}>
                    {loading ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsEditing(false)
                      setTheme({
                        title: currentWall.theme?.title || '本周祷告',
                        description: currentWall.theme?.description || '在主里彼此代祷，分享感恩',
                        color: currentWall.theme?.color || '#ddeee1'
                      })
                    }}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Title</Label>
                  <p className="text-lg">{currentWall.theme?.title || 'No title set'}</p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-700">Description</Label>
                  <p className="text-gray-600">{currentWall.theme?.description || 'No description set'}</p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-700">Background Color</Label>
                  <div className="flex gap-2 items-center">
                    <div 
                      className="w-8 h-8 rounded border border-gray-300"
                      style={{ backgroundColor: currentWall.theme?.color || '#ddeee1' }}
                    />
                    <p className="font-mono text-sm">{currentWall.theme?.color || '#ddeee1'}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Messages */}
      {message && (
        <Alert className={message.type === 'success' ? 'border-green-500' : 'border-red-500'}>
          <AlertDescription className={message.type === 'success' ? 'text-green-700' : 'text-red-700'}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      {/* User Roles Info */}
      <Card>
        <CardHeader>
          <CardTitle>Your Permissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {userRoles.map((role) => (
              <div key={role.organization_id} className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Organization: {role.organization_id.substring(0, 8)}...</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  role.role === 'admin' ? 'bg-red-100 text-red-700' :
                  role.role === 'moderator' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {role.role}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}