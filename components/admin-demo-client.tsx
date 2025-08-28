'use client'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { 
  Settings, 
  Users, 
  BarChart3, 
  Calendar, 
  Heart, 
  MessageCircle,
  Church,
  Shield,
  Palette,
  Info,
  ExternalLink
} from 'lucide-react'
import Link from 'next/link'
import { useLocale } from '@/lib/locale-context'

export function AdminDemoClient() {
  const { t, locale } = useLocale()
  const [currentOrg, setCurrentOrg] = useState('demo')
  const [wallStats, setWallStats] = useState<any>(null)
  const [themeData, setThemeData] = useState<any>(null)

  useEffect(() => {
    fetchDemoData()
  }, [])

  const fetchDemoData = async () => {
    try {
      const response = await fetch('/api/demo/prayers')
      const data = await response.json()
      setWallStats(data.wall?.stats)
      setThemeData(data.wall?.theme)
    } catch (error) {
      console.error('Failed to fetch demo data:', error)
    }
  }

  const organizations = [
    { id: 'demo', name: 'Demo Community', name_zh: 'Demo社区', users: 15, active: true },
    { id: 'mgc', name: 'MGC Church', name_zh: 'MGC教会', users: 127, active: true }
  ]

  return (
    <main className="min-h-screen py-4 sm:py-8" style={{ backgroundColor: '#F8F6F0' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
        
        {/* Demo Notice */}
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-amber-900 mb-1">
                  {locale === 'en' ? 'Admin Demo Interface' : '管理员演示界面'}
                </h3>
                <p className="text-amber-800 text-sm">
                  {locale === 'en' 
                    ? 'This is a demonstration of the admin interface with bilingual support. In the full version, this requires admin authentication. Try switching languages!' 
                    : '这是具有双语支持的管理员界面演示。在完整版本中，此功能需要管理员身份认证。试试切换语言！'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Shield className="w-6 h-6 text-indigo-600" />
              {locale === 'en' ? 'Admin Dashboard' : '管理员控制台'}
            </h1>
            <p className="text-gray-600 mt-1">
              {locale === 'en' ? 'Manage organizations and prayer walls' : '管理组织和祷告墙'}
            </p>
          </div>
        </div>

        {/* Organization Selector */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Church className="w-5 h-5" />
              {locale === 'en' ? 'Organization Management' : '组织管理'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {organizations.map((org) => (
                <Card 
                  key={org.id}
                  className={`cursor-pointer transition-all ${
                    currentOrg === org.id 
                      ? 'ring-2 ring-indigo-500 bg-indigo-50' 
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => setCurrentOrg(org.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold">
                          {locale === 'en' ? org.name : org.name_zh}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {org.users} {locale === 'en' ? 'users' : '用户'}
                        </p>
                      </div>
                      <Badge variant={org.active ? 'default' : 'secondary'}>
                        {org.active 
                          ? (locale === 'en' ? 'Active' : '活跃') 
                          : (locale === 'en' ? 'Inactive' : '停用')
                        }
                      </Badge>
                    </div>
                    {/* Go to Prayer Wall button */}
                    <Button 
                      asChild 
                      size="sm" 
                      variant="outline" 
                      className="w-full"
                      onClick={(e: React.MouseEvent) => e.stopPropagation()}
                    >
                      <Link 
                        href={org.id === 'demo' ? '/demo' : '/week'} 
                        className="flex items-center justify-center gap-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        {locale === 'en' ? 'Go to Prayer Wall' : '进入祷告墙'}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">
                    {locale === 'en' ? 'Total Prayers' : '总祷告数'}
                  </p>
                  <p className="text-2xl font-bold">{wallStats?.prayer_count || 7}</p>
                </div>
                <Calendar className="w-8 h-8 text-blue-600" />
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
                  <p className="text-2xl font-bold">{wallStats?.participant_count || 7}</p>
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
                    {locale === 'en' ? 'Total Likes' : '总点赞数'}
                  </p>
                  <p className="text-2xl font-bold">{wallStats?.total_likes || 28}</p>
                </div>
                <Heart className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">
                    {locale === 'en' ? 'Comments' : '评论数'}
                  </p>
                  <p className="text-2xl font-bold">{wallStats?.total_comments || 12}</p>
                </div>
                <MessageCircle className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Prayer Wall Theme Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              {locale === 'en' ? 'Weekly Theme Management' : '每周主题管理'}
            </CardTitle>
            <CardDescription>
              {locale === 'en' 
                ? 'Configure the theme and scripture for the current week' 
                : '配置当前周的主题和经文'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {locale === 'en' ? 'Theme Title (Chinese)' : '主题标题（中文）'}
                  </label>
                  <Input 
                    value={themeData?.title || ''}
                    placeholder="本周祷告主题..."
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {locale === 'en' ? 'Theme Title (English)' : '主题标题（英文）'}
                  </label>
                  <Input 
                    value={themeData?.title_en || ''}
                    placeholder="This week's prayer theme..."
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {locale === 'en' ? 'Description (Chinese)' : '描述（中文）'}
                  </label>
                  <Textarea 
                    value={themeData?.description || ''}
                    placeholder="主题描述和引导语..."
                    rows={3}
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {locale === 'en' ? 'Description (English)' : '描述（英文）'}
                  </label>
                  <Textarea 
                    value={themeData?.description_en || ''}
                    placeholder="Theme description and guidance..."
                    rows={3}
                    readOnly
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {locale === 'en' ? 'Scripture (Chinese)' : '经文（中文）'}
                  </label>
                  <Textarea 
                    value={themeData?.scripture || ''}
                    placeholder="本周经文..."
                    rows={3}
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {locale === 'en' ? 'Scripture (English)' : '经文（英文）'}
                  </label>
                  <Textarea 
                    value={themeData?.scripture_en || ''}
                    placeholder="Weekly scripture..."
                    rows={3}
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {locale === 'en' ? 'Scripture Reference' : '经文出处'}
                  </label>
                  <Input 
                    value={themeData?.scripture_ref || themeData?.scripture_ref_en || ''}
                    placeholder="马太福音 5:16 / Matthew 5:16"
                    readOnly
                  />
                </div>
                <div className="flex gap-2">
                  <Button disabled className="flex-1">
                    <Settings className="w-4 h-4 mr-2" />
                    {locale === 'en' ? 'Save Theme' : '保存主题'}
                  </Button>
                  <Button variant="outline" disabled>
                    {locale === 'en' ? 'Preview' : '预览'}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fellowship Analytics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              {locale === 'en' ? 'Fellowship Analytics' : '团契分析'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { id: 'community', name: '社区团契', name_en: 'Community Fellowship', count: 2, color: '#8b5cf6' },
                { id: 'youth', name: '青年团契', name_en: 'Youth Fellowship', count: 1, color: '#3b82f6' },
                { id: 'family', name: '家庭团契', name_en: 'Family Fellowship', count: 1, color: '#10b981' },
                { id: 'student', name: '学生团契', name_en: 'Student Fellowship', count: 2, color: '#f59e0b' },
                { id: 'senior', name: '长者团契', name_en: 'Senior Fellowship', count: 1, color: '#ef4444' },
                { id: 'weekday', name: '平日祷告', name_en: 'Weekday Prayer', count: 1, color: '#6b7280' }
              ].map((fellowship) => (
                <Card key={fellowship.id}>
                  <CardContent className="p-3 text-center">
                    <div 
                      className="w-4 h-4 rounded mx-auto mb-2"
                      style={{ backgroundColor: fellowship.color }}
                    />
                    <p className="text-sm font-medium">
                      {locale === 'en' ? fellowship.name_en : fellowship.name}
                    </p>
                    <p className="text-lg font-bold">{fellowship.count}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}