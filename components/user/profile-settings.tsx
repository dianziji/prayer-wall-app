"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { User, Settings, Save, Upload } from 'lucide-react'
import { useLocale, useFellowshipInfo } from '@/lib/locale-context'
import type { Fellowship } from '@/types/models'

interface UserProfile {
  user_id: string
  username?: string
  avatar_url?: string
  default_fellowship?: Fellowship
  prayers_visibility_weeks?: number
  created_at?: string
  updated_at?: string
}

interface UserStats {
  total_prayers: number
  recent_prayers: any[]
  fellowships_participated: string[]
  first_prayer_date?: string
}

interface ProfileData {
  profile: UserProfile | null
  roles: Array<{ role: string; organization_id: string }>
  stats: UserStats
  user: {
    id: string
    email?: string
    created_at?: string
  }
}

export function ProfileSettings() {
  const { t } = useLocale()
  const { getFellowshipOptions } = useFellowshipInfo()
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    avatar_url: '',
    default_fellowship: 'all' as Fellowship | 'all',
    prayers_visibility_weeks: 4
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/user/profile')
      if (response.ok) {
        const data: ProfileData = await response.json()
        setProfileData(data)
        setFormData({
          username: data.profile?.username || '',
          avatar_url: data.profile?.avatar_url || '',
          default_fellowship: (data.profile?.default_fellowship as Fellowship) || 'all',
          prayers_visibility_weeks: data.profile?.prayers_visibility_weeks || 4
        })
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: formData.username || null,
          avatar_url: formData.avatar_url || null,
          default_fellowship: formData.default_fellowship === 'all' ? null : formData.default_fellowship,
          prayers_visibility_weeks: formData.prayers_visibility_weeks
        })
      })

      if (response.ok) {
        await fetchProfile() // Refresh data
        alert('Profile updated successfully!')
      } else {
        throw new Error('Failed to update profile')
      }
    } catch (error) {
      console.error('Profile update error:', error)
      alert('Failed to update profile. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse bg-gray-200 h-64 rounded-lg" />
        <div className="animate-pulse bg-gray-200 h-48 rounded-lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            {t('profile')}
          </CardTitle>
          <CardDescription>
            Manage your personal information and preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={formData.avatar_url || undefined} />
              <AvatarFallback>
                {formData.username?.charAt(0).toUpperCase() || 
                 profileData?.user.email?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="space-y-2">
                <label className="text-sm font-medium">Avatar URL</label>
                <div className="flex gap-2">
                  <Input
                    value={formData.avatar_url}
                    onChange={(e) => updateField('avatar_url', e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                  />
                  <Button variant="outline" size="sm">
                    <Upload className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Username</label>
              <Input
                value={formData.username}
                onChange={(e) => updateField('username', e.target.value)}
                placeholder="Enter your username"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t('fellowship')}</label>
              <Select 
                value={formData.default_fellowship} 
                onValueChange={(value) => updateField('default_fellowship', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">No Default</SelectItem>
                  {getFellowshipOptions().map(option => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Prayer Visibility (weeks)</label>
            <Select 
              value={formData.prayers_visibility_weeks.toString()} 
              onValueChange={(value) => updateField('prayers_visibility_weeks', parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 week</SelectItem>
                <SelectItem value="2">2 weeks</SelectItem>
                <SelectItem value="4">4 weeks (default)</SelectItem>
                <SelectItem value="8">8 weeks</SelectItem>
                <SelectItem value="12">12 weeks</SelectItem>
                <SelectItem value="0">Always visible</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              Controls how long your prayers remain visible to others after posting
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Account Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            {t('statistics')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {profileData?.stats.total_prayers || 0}
              </div>
              <div className="text-sm text-gray-600">Total Prayers</div>
            </div>
            
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {profileData?.stats.fellowships_participated.length || 0}
              </div>
              <div className="text-sm text-gray-600">Fellowships</div>
            </div>
            
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {profileData?.roles.length || 0}
              </div>
              <div className="text-sm text-gray-600">Roles</div>
            </div>

            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-lg font-bold text-orange-600">
                {profileData?.stats.first_prayer_date ? 
                  Math.ceil((Date.now() - new Date(profileData.stats.first_prayer_date).getTime()) / (1000 * 60 * 60 * 24)) :
                  0
                } days
              </div>
              <div className="text-sm text-gray-600">Member Since</div>
            </div>
          </div>

          {/* Recent Activity */}
          {profileData?.stats.recent_prayers && profileData.stats.recent_prayers.length > 0 && (
            <div className="mt-6">
              <h4 className="font-medium text-gray-900 mb-3">Recent Prayers</h4>
              <div className="space-y-2">
                {profileData.stats.recent_prayers.slice(0, 3).map((prayer: any) => (
                  <div key={prayer.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-sm text-gray-800 line-clamp-2">
                          {prayer.content?.substring(0, 100)}...
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(prayer.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {prayer.fellowship && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {prayer.fellowship}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* User Roles */}
          {profileData?.roles && profileData.roles.length > 0 && (
            <div className="mt-6">
              <h4 className="font-medium text-gray-900 mb-3">Roles & Permissions</h4>
              <div className="flex flex-wrap gap-2">
                {profileData.roles.map((role, index) => (
                  <span 
                    key={index}
                    className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium"
                  >
                    {role.role}
                  </span>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          className="min-w-[120px]"
        >
          {isSaving ? (
            <>Saving...</>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              {t('save')}
            </>
          )}
        </Button>
      </div>
    </div>
  )
}