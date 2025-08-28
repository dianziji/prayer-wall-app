'use client'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Shield, 
  ExternalLink, 
  Users, 
  BarChart3, 
  Calendar, 
  MessageCircle,
  Heart,
  Settings,
  Church,
  Building2
} from 'lucide-react'
import { useLocale } from '@/lib/locale-context'
import Link from 'next/link'
import { getCurrentWeekStartET } from '@/lib/utils'
import FellowshipManager from '@/components/admin/fellowship-manager'
import OrganizationManager from '@/components/admin/organization-manager'

type Props = {
  currentWall: any
  userRoles: any[]
  weekStart: string
}

type OrgStats = {
  total_prayers: number
  active_users: number
  this_week_prayers: number
  prayer_walls: number
}

export default function AdminClientNew({ currentWall, userRoles, weekStart }: Props) {
  const { locale } = useLocale()
  const [selectedOrg, setSelectedOrg] = useState<string>('')
  const [orgStats, setOrgStats] = useState<OrgStats | null>(null)
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

  const getOrgConfig = (orgId: string) => {
    const currentWeek = getCurrentWeekStartET()
    
    // Find the organization data from userRoles
    const role = userRoles.find(r => r.organization_id === orgId)
    const orgData = role?.organizations || role?.organization
    
    if (orgData) {
      // Handle special routes for known organizations
      if (orgData.slug === 'demo') {
        return {
          name_en: orgData.name,
          name_zh: orgData.name,
          route: '/demo',
          current_week_route: '/demo'
        }
      } else if (orgData.slug === 'mgc') {
        return {
          name_en: orgData.name,
          name_zh: orgData.name,
          route: '/',
          current_week_route: `/week/${currentWeek}`
        }
      } else {
        // Dynamic organization routes
        return {
          name_en: orgData.name,
          name_zh: orgData.name,
          route: `/${orgData.slug}`,
          current_week_route: `/${orgData.slug}/week/${currentWeek}`
        }
      }
    }

    // Fallback for unknown organizations
    return {
      name_en: `Organization ${orgId.substring(0, 8)}`,
      name_zh: `组织 ${orgId.substring(0, 8)}`,
      route: '/week',
      current_week_route: `/week/${currentWeek}`
    }
  }


  const selectedOrgConfig = selectedOrg ? getOrgConfig(selectedOrg) : null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-8 h-8 text-indigo-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {locale === 'en' ? 'Admin Dashboard' : '管理员控制台'}
              </h1>
              <p className="text-gray-600">
                {locale === 'en' ? 'Manage your organizations and prayer communities' : '管理您的组织和祷告社区'}
              </p>
            </div>
          </div>
        </div>

        {/* Organization Selector */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Church className="w-5 h-5" />
              {locale === 'en' ? 'Select Organization' : '选择组织'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userRoles.map((role) => {
                const orgConfig = getOrgConfig(role.organization_id)
                const isSelected = selectedOrg === role.organization_id
                
                return (
                  <Card 
                    key={role.organization_id}
                    className={`cursor-pointer transition-all border-2 ${
                      isSelected 
                        ? 'border-indigo-500 bg-indigo-50' 
                        : 'border-gray-200 hover:border-indigo-300 hover:shadow-md'
                    }`}
                    onClick={() => setSelectedOrg(role.organization_id)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold">
                            {locale === 'en' ? orgConfig.name_en : orgConfig.name_zh}
                          </h3>
                          <p className="text-sm text-gray-600 font-mono">
                            {role.organization_id.substring(0, 8)}...
                          </p>
                        </div>
                        <Badge variant={role.role === 'admin' ? 'default' : 'secondary'}>
                          {role.role === 'admin' 
                            ? (locale === 'en' ? 'Admin' : '管理员')
                            : (locale === 'en' ? 'Moderator' : '协调员')
                          }
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <Button 
                          asChild 
                          size="sm" 
                          variant="outline" 
                          className="w-full"
                        >
                          <Link 
                            href={orgConfig.current_week_route} 
                            className="flex items-center justify-center gap-2"
                            onClick={(e: React.MouseEvent) => e.stopPropagation()}
                          >
                            <Calendar className="w-4 h-4" />
                            {locale === 'en' ? 'Current Week' : '本周祷告墙'}
                          </Link>
                        </Button>
                        
                        <Button 
                          asChild 
                          size="sm" 
                          variant="outline" 
                          className="w-full"
                        >
                          <Link 
                            href={orgConfig.route} 
                            className="flex items-center justify-center gap-2"
                            onClick={(e: React.MouseEvent) => e.stopPropagation()}
                          >
                            <ExternalLink className="w-4 h-4" />
                            {locale === 'en' ? 'Prayer Wall Home' : '祷告墙首页'}
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Main Dashboard Content */}
        {selectedOrg && selectedOrgConfig && (
          <div className="space-y-8">
            {/* Current Organization Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {locale === 'en' ? selectedOrgConfig.name_en : selectedOrgConfig.name_zh}
                </h2>
                <p className="text-gray-600">
                  {locale === 'en' ? 'Organization Management Dashboard' : '组织管理控制台'}
                </p>
              </div>
              <div className="flex gap-2">
                <Button asChild>
                  <Link href={selectedOrgConfig.current_week_route}>
                    <Calendar className="w-4 h-4 mr-2" />
                    {locale === 'en' ? 'View Current Week' : '查看本周'}
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href={selectedOrgConfig.route}>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    {locale === 'en' ? 'Go to Prayer Wall' : '进入祷告墙'}
                  </Link>
                </Button>
              </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {locale === 'en' ? 'Total Prayers' : '总祷告数'}
                  </CardTitle>
                  <MessageCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {loading ? '...' : (orgStats?.total_prayers || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {locale === 'en' ? 'All time prayers' : '历史总计'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {locale === 'en' ? 'Active Users' : '活跃用户'}
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {loading ? '...' : (orgStats?.active_users || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {locale === 'en' ? 'Last 30 days' : '过去30天'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {locale === 'en' ? 'This Week' : '本周祷告'}
                  </CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {loading ? '...' : (orgStats?.this_week_prayers || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {locale === 'en' ? 'Current week' : '当前周'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {locale === 'en' ? 'Prayer Walls' : '祷告墙数'}
                  </CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {loading ? '...' : (orgStats?.prayer_walls || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {locale === 'en' ? 'Total walls' : '历史墙数'}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Management Tabs */}
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList>
                <TabsTrigger value="overview">
                  {locale === 'en' ? 'Overview' : '概览'}
                </TabsTrigger>
                <TabsTrigger value="organizations">
                  {locale === 'en' ? 'Organizations' : '组织管理'}
                </TabsTrigger>
                <TabsTrigger value="walls">
                  {locale === 'en' ? 'Prayer Walls' : '祷告墙管理'}
                </TabsTrigger>
                <TabsTrigger value="fellowships">
                  {locale === 'en' ? 'Fellowships' : '团契管理'}
                </TabsTrigger>
                <TabsTrigger value="users">
                  {locale === 'en' ? 'Users' : '用户管理'}
                </TabsTrigger>
                <TabsTrigger value="settings">
                  {locale === 'en' ? 'Settings' : '设置'}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {locale === 'en' ? 'Recent Activity' : '最近活动'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">
                      {locale === 'en' 
                        ? 'Recent prayer wall activity and user engagement will be displayed here.' 
                        : '最近的祷告墙活动和用户参与情况将在这里显示。'
                      }
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="organizations" className="space-y-4">
                <OrganizationManager currentUserRoles={userRoles} />
              </TabsContent>

              <TabsContent value="walls" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {locale === 'en' ? 'Prayer Wall Management' : '祷告墙管理'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Button asChild>
                        <Link href={selectedOrgConfig.current_week_route}>
                          <Calendar className="w-4 h-4 mr-2" />
                          {locale === 'en' ? 'Manage Current Week' : '管理本周祷告墙'}
                        </Link>
                      </Button>
                      <p className="text-gray-600">
                        {locale === 'en' 
                          ? 'Manage prayer wall themes, content, and weekly settings.' 
                          : '管理祷告墙主题、内容和周设置。'
                        }
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="fellowships" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {locale === 'en' ? 'Fellowship Management' : '团契管理'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">
                      {locale === 'en' 
                        ? 'Create, edit, and manage fellowship categories for prayer organization.' 
                        : '创建、编辑和管理祷告分类的团契类别。'
                      }
                    </p>
                    
                    {/* Fellowship Manager */}
                    <FellowshipManager organizationId={selectedOrg} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="users" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {locale === 'en' ? 'User Management' : '用户管理'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">
                      {locale === 'en' 
                        ? 'User roles, permissions, and community management tools.' 
                        : '用户角色、权限和社区管理工具。'
                      }
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="settings" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {locale === 'en' ? 'Organization Settings' : '组织设置'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">
                      {locale === 'en' 
                        ? 'Configure organization-wide settings and preferences.' 
                        : '配置组织范围的设置和偏好。'
                      }
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  )
}