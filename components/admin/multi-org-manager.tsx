'use client'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Church, Users, BarChart3, Palette, Settings, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useLocale } from '@/lib/locale-context'

type UserRole = {
  role: string
  organization_id: string
  organization_name?: string
}

interface MultiOrgManagerProps {
  userRoles: UserRole[]
}

export function MultiOrgManager({ userRoles }: MultiOrgManagerProps) {
  const { locale, t } = useLocale()
  const [selectedOrg, setSelectedOrg] = useState<string>('')
  const [orgStats, setOrgStats] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  // Initialize with first organization
  useEffect(() => {
    if (userRoles.length > 0 && !selectedOrg) {
      setSelectedOrg(userRoles[0].organization_id)
    }
  }, [userRoles, selectedOrg])

  // Fetch organization statistics
  useEffect(() => {
    if (selectedOrg) {
      fetchOrgStats(selectedOrg)
    }
  }, [selectedOrg])

  const fetchOrgStats = async (orgId: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/organizations/${orgId}/stats`)
      if (response.ok) {
        const data = await response.json()
        setOrgStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch org stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const getCurrentRole = () => {
    const role = userRoles.find(r => r.organization_id === selectedOrg)
    return role?.role || 'member'
  }

  const getOrganizations = () => {
    // Map known organization IDs to display names and routes
    const orgConfig: Record<string, { 
      name_en: string, 
      name_zh: string, 
      route: string 
    }> = {
      'e5511cdd-440c-4b18-8c8c-43ea0bf4d1bd': { 
        name_en: 'Demo Community', 
        name_zh: 'Demo社区',
        route: '/demo' // Demo组织跳转到demo页面
      },
      // MGC organization would go to regular prayer wall
      // 'mgc-org-id': { name_en: 'MGC Church', name_zh: 'MGC教会', route: '/week' }
    }

    return userRoles.map(role => ({
      ...role,
      display_name: locale === 'en' 
        ? orgConfig[role.organization_id]?.name_en || `Organization ${role.organization_id.substring(0, 8)}`
        : orgConfig[role.organization_id]?.name_zh || `组织 ${role.organization_id.substring(0, 8)}`,
      route: orgConfig[role.organization_id]?.route || '/week' // 默认路由到当前周祷告墙
    }))
  }

  const getSelectedOrgRoute = () => {
    const org = getOrganizations().find(o => o.organization_id === selectedOrg)
    return org?.route || '/week'
  }

  return (
    <div className="space-y-6">
      {/* Organization Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Church className="w-5 h-5" />
            {locale === 'en' ? 'Organization Management' : '组织管理'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1">
              <Select value={selectedOrg} onValueChange={setSelectedOrg}>
                <SelectTrigger>
                  <SelectValue placeholder={locale === 'en' ? 'Select organization' : '选择组织'} />
                </SelectTrigger>
                <SelectContent>
                  {getOrganizations().map((role) => (
                    <SelectItem key={role.organization_id} value={role.organization_id}>
                      {role.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Badge variant={getCurrentRole() === 'admin' ? 'default' : 'secondary'}>
              {getCurrentRole() === 'admin' 
                ? (locale === 'en' ? 'Admin' : '管理员')
                : (locale === 'en' ? 'Moderator' : '协调员')
              }
            </Badge>
          </div>

          {selectedOrg && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {locale === 'en' ? 'Managing' : '正在管理'}: 
                <span className="font-mono ml-1">{selectedOrg.substring(0, 8)}...</span>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href={getSelectedOrgRoute()} className="flex items-center gap-2">
                  <ExternalLink className="w-4 h-4" />
                  {locale === 'en' ? 'Go to Prayer Wall' : '进入祷告墙'}
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Organization Statistics */}
      {selectedOrg && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">
                    {locale === 'en' ? 'Total Prayers' : '总祷告数'}
                  </p>
                  <p className="text-2xl font-bold">
                    {loading ? '...' : (orgStats?.total_prayers || 0)}
                  </p>
                </div>
                <BarChart3 className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">
                    {locale === 'en' ? 'Active Users' : '活跃用户'}
                  </p>
                  <p className="text-2xl font-bold">
                    {loading ? '...' : (orgStats?.active_users || 0)}
                  </p>
                </div>
                <Users className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">
                    {locale === 'en' ? 'This Week' : '本周祷告'}
                  </p>
                  <p className="text-2xl font-bold">
                    {loading ? '...' : (orgStats?.this_week_prayers || 0)}
                  </p>
                </div>
                <Palette className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">
                    {locale === 'en' ? 'Prayer Walls' : '祷告墙数'}
                  </p>
                  <p className="text-2xl font-bold">
                    {loading ? '...' : (orgStats?.prayer_walls || 0)}
                  </p>
                </div>
                <Settings className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Actions */}
      {selectedOrg && getCurrentRole() === 'admin' && (
        <Card>
          <CardHeader>
            <CardTitle>
              {locale === 'en' ? 'Quick Actions' : '快速操作'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                <Link href={getSelectedOrgRoute()} className="flex items-center gap-2">
                  <ExternalLink className="w-4 h-4" />
                  {locale === 'en' ? 'View Prayer Wall' : '查看祷告墙'}
                </Link>
              </Button>
              <Button variant="outline" size="sm">
                <Palette className="w-4 h-4 mr-2" />
                {locale === 'en' ? 'Manage Themes' : '管理主题'}
              </Button>
              <Button variant="outline" size="sm">
                <Users className="w-4 h-4 mr-2" />
                {locale === 'en' ? 'User Management' : '用户管理'}
              </Button>
              <Button variant="outline" size="sm">
                <BarChart3 className="w-4 h-4 mr-2" />
                {locale === 'en' ? 'Analytics' : '数据分析'}
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                {locale === 'en' ? 'Settings' : '设置'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Permissions Info */}
      <Card>
        <CardHeader>
          <CardTitle>
            {locale === 'en' ? 'Your Permissions' : '您的权限'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {getOrganizations().map((role) => (
              <div key={role.organization_id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{role.display_name}</p>
                  <p className="text-sm text-gray-500">ID: {role.organization_id.substring(0, 8)}...</p>
                </div>
                <Badge variant={role.role === 'admin' ? 'default' : 'secondary'}>
                  {role.role === 'admin' 
                    ? (locale === 'en' ? 'Admin' : '管理员')
                    : (locale === 'en' ? 'Moderator' : '协调员')
                  }
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}