'use client'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { 
  Plus, 
  Edit, 
  Archive, 
  Globe,
  Lock,
  Building2,
  Clock,
  Languages,
  Users
} from 'lucide-react'
import { useLocale } from '@/lib/locale-context'

type Organization = {
  id: string
  name: string
  slug: string
  default_language: string | null
  timezone: string | null
  is_public: boolean | null
  created_at: string | null
  updated_at: string | null
}

type Props = {
  currentUserRoles?: any[]
}

export default function OrganizationManager({ currentUserRoles = [] }: Props) {
  const { locale } = useLocale()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingOrganization, setEditingOrganization] = useState<Organization | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    default_language: 'zh-CN',
    timezone: 'America/New_York',
    is_public: false
  })

  useEffect(() => {
    fetchOrganizations()
  }, [])

  const fetchOrganizations = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/organizations')
      if (response.ok) {
        const data = await response.json()
        setOrganizations(data.organizations || [])
        setIsSuperAdmin(data.isSuperAdmin || false)
      } else {
        console.error('Failed to fetch organizations')
      }
    } catch (error) {
      console.error('Error fetching organizations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/admin/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        await fetchOrganizations()
        setIsCreateDialogOpen(false)
        resetForm()
        alert(locale === 'en' ? 'Organization created successfully' : '组织创建成功')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to create organization')
      }
    } catch (error) {
      console.error('Error creating organization:', error)
      alert('Failed to create organization')
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingOrganization) return

    try {
      console.log('Updating organization:', editingOrganization.id)
      const response = await fetch(`/api/admin/organizations/${editingOrganization.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        await fetchOrganizations()
        setIsEditDialogOpen(false)
        setEditingOrganization(null)
        resetForm()
        alert(locale === 'en' ? 'Organization updated successfully' : '组织更新成功')
      } else {
        const error = await response.json()
        console.error('Update error:', error)
        alert(error.error || 'Failed to update organization')
      }
    } catch (error) {
      console.error('Error updating organization:', error)
      alert('Failed to update organization')
    }
  }

  const handleArchive = async (organization: Organization) => {
    const confirmMessage = locale === 'en' 
      ? `Are you sure you want to archive "${organization.name}"? This will make it private and mark it as archived, but preserve all data.`
      : `确定要归档"${organization.name}"吗？这将使其变为私有并标记为已归档，但保留所有数据。`
    
    if (!confirm(confirmMessage)) return

    try {
      const response = await fetch(`/api/admin/organizations/${organization.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        const result = await response.json()
        await fetchOrganizations()
        
        alert(locale === 'en' 
          ? `Organization archived successfully. Preserved: ${result.preservedData?.prayers || 0} prayers, ${result.preservedData?.walls || 0} walls`
          : `组织已成功归档。保留了：${result.preservedData?.prayers || 0} 个祷告，${result.preservedData?.walls || 0} 个祷告墙`
        )
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to archive organization')
      }
    } catch (error) {
      console.error('Error archiving organization:', error)
      alert('Failed to archive organization')
    }
  }

  const openCreateDialog = () => {
    resetForm()
    setIsCreateDialogOpen(true)
  }

  const openEditDialog = (organization: Organization) => {
    setEditingOrganization(organization)
    setFormData({
      name: organization.name,
      slug: organization.slug,
      default_language: organization.default_language || 'zh-CN',
      timezone: organization.timezone || 'America/New_York',
      is_public: organization.is_public || false
    })
    setIsEditDialogOpen(true)
  }

  const getLanguageDisplay = (langCode: string) => {
    const languages: Record<string, string> = {
      'zh-CN': '🇨🇳 中文简体',
      'zh-TW': '🇹🇼 中文繁體',
      'en': '🇺🇸 English',
      'ko': '🇰🇷 한국어',
      'ja': '🇯🇵 日本語',
      'es': '🇪🇸 Español',
      'fr': '🇫🇷 Français',
      'de': '🇩🇪 Deutsch',
      'pt': '🇧🇷 Português',
      'ru': '🇷🇺 Русский',
      'ar': '🇸🇦 العربية',
      'hi': '🇮🇳 हिन्दी'
    }
    return languages[langCode] || langCode
  }

  const getTimezoneDisplay = (timezone: string) => {
    const timezones: Record<string, string> = {
      'America/New_York': '🗽 Eastern Time',
      'America/Chicago': '🏢 Central Time',
      'America/Denver': '🏔️ Mountain Time',
      'America/Los_Angeles': '🌴 Pacific Time',
      'Asia/Shanghai': '🏮 China Time',
      'Asia/Seoul': '🇰🇷 Korea Time',
      'Asia/Tokyo': '🇯🇵 Japan Time',
      'Europe/London': '🇬🇧 London Time',
      'Europe/Paris': '🇫🇷 Paris Time',
      'Europe/Berlin': '🇩🇪 Berlin Time',
      'Australia/Sydney': '🇦🇺 Sydney Time',
      'UTC': '🌍 UTC'
    }
    return timezones[timezone] || timezone?.split('/')[1] || 'Unknown'
  }

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      default_language: 'zh-CN',
      timezone: 'America/New_York',
      is_public: false
    })
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500">
          {locale === 'en' ? 'Loading organizations...' : '正在加载组织列表...'}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="w-6 h-6 text-indigo-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {locale === 'en' ? 'Organization Management' : '组织管理'}
            </h2>
            <p className="text-gray-600">
              {locale === 'en' 
                ? 'Create and manage prayer wall organizations'
                : '创建和管理祷告墙组织'
              }
            </p>
          </div>
        </div>
        
        {isSuperAdmin && (
          <Button onClick={openCreateDialog} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            {locale === 'en' ? 'Create Organization' : '创建组织'}
          </Button>
        )}
      </div>

      {/* Organizations List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {organizations.map((organization) => (
          <Card key={organization.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    {organization.name}
                    {organization.is_public ? (
                      <Globe className="w-4 h-4 text-green-500" />
                    ) : (
                      <Lock className="w-4 h-4 text-gray-400" />
                    )}
                  </CardTitle>
                  <p className="text-sm text-gray-600 font-mono mt-1">
                    /{organization.slug}
                  </p>
                </div>
                
                <Badge variant={organization.is_public ? 'default' : 'secondary'}>
                  {organization.is_public 
                    ? (locale === 'en' ? 'Public' : '公开')
                    : (locale === 'en' ? 'Private' : '私有')
                  }
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Languages className="w-4 h-4 text-gray-400" />
                  <span className="truncate">{getLanguageDisplay(organization.default_language || 'zh-CN')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="truncate text-xs">{getTimezoneDisplay(organization.timezone || 'UTC')}</span>
                </div>
              </div>

              <div className="text-xs text-gray-500">
                {locale === 'en' ? 'Created' : '创建于'}: {' '}
                {organization.created_at 
                  ? new Date(organization.created_at).toLocaleDateString()
                  : 'N/A'
                }
              </div>

              <div className="flex gap-2 pt-2 border-t">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openEditDialog(organization)}
                  className="flex items-center gap-1 flex-1"
                >
                  <Edit className="w-3 h-3" />
                  {locale === 'en' ? 'Edit' : '编辑'}
                </Button>
                
                {isSuperAdmin && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleArchive(organization)}
                    className="flex items-center gap-1 text-orange-600 hover:text-orange-700"
                  >
                    <Archive className="w-3 h-3" />
                    {locale === 'en' ? 'Archive' : '归档'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {locale === 'en' ? 'Create New Organization' : '创建新组织'}
            </DialogTitle>
            <DialogDescription>
              {locale === 'en' 
                ? 'Create a new organization for managing prayer walls and communities.'
                : '创建新组织以管理祷告墙和社区。'
              }
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <Label htmlFor="name">{locale === 'en' ? 'Organization Name' : '组织名称'}</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={locale === 'en' ? 'e.g., My Church Community' : '例：我的教会社区'}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="slug">{locale === 'en' ? 'URL Slug' : 'URL标识'}</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                placeholder="my-church"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                {locale === 'en' 
                  ? 'Used in URLs. Only lowercase letters, numbers, and hyphens.'
                  : '用于URL。仅限小写字母、数字和连字符。'
                }
              </p>
            </div>

            <div>
              <Label htmlFor="default_language">{locale === 'en' ? 'Default Language' : '默认语言'}</Label>
              <Select value={formData.default_language} onValueChange={(value) => setFormData({ ...formData, default_language: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="zh-CN">🇨🇳 中文简体 (Simplified Chinese)</SelectItem>
                  <SelectItem value="zh-TW">🇹🇼 中文繁體 (Traditional Chinese)</SelectItem>
                  <SelectItem value="en">🇺🇸 English</SelectItem>
                  <SelectItem value="ko">🇰🇷 한국어 (Korean)</SelectItem>
                  <SelectItem value="ja">🇯🇵 日本語 (Japanese)</SelectItem>
                  <SelectItem value="es">🇪🇸 Español (Spanish)</SelectItem>
                  <SelectItem value="fr">🇫🇷 Français (French)</SelectItem>
                  <SelectItem value="de">🇩🇪 Deutsch (German)</SelectItem>
                  <SelectItem value="pt">🇧🇷 Português (Portuguese)</SelectItem>
                  <SelectItem value="ru">🇷🇺 Русский (Russian)</SelectItem>
                  <SelectItem value="ar">🇸🇦 العربية (Arabic)</SelectItem>
                  <SelectItem value="hi">🇮🇳 हिन्दी (Hindi)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="timezone">{locale === 'en' ? 'Timezone' : '时区'}</Label>
              <Select value={formData.timezone} onValueChange={(value) => setFormData({ ...formData, timezone: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/New_York">🗽 Eastern Time (UTC-5/-4)</SelectItem>
                  <SelectItem value="America/Chicago">🏢 Central Time (UTC-6/-5)</SelectItem>
                  <SelectItem value="America/Denver">🏔️ Mountain Time (UTC-7/-6)</SelectItem>
                  <SelectItem value="America/Los_Angeles">🌴 Pacific Time (UTC-8/-7)</SelectItem>
                  <SelectItem value="Asia/Shanghai">🏮 China Time (UTC+8)</SelectItem>
                  <SelectItem value="Asia/Seoul">🇰🇷 Korea Time (UTC+9)</SelectItem>
                  <SelectItem value="Asia/Tokyo">🇯🇵 Japan Time (UTC+9)</SelectItem>
                  <SelectItem value="Europe/London">🇬🇧 London Time (UTC+0/+1)</SelectItem>
                  <SelectItem value="Europe/Paris">🇫🇷 Paris Time (UTC+1/+2)</SelectItem>
                  <SelectItem value="Europe/Berlin">🇩🇪 Berlin Time (UTC+1/+2)</SelectItem>
                  <SelectItem value="Australia/Sydney">🇦🇺 Sydney Time (UTC+10/+11)</SelectItem>
                  <SelectItem value="UTC">🌍 UTC</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="is_public">{locale === 'en' ? 'Public Organization' : '公开组织'}</Label>
              <Switch
                id="is_public"
                checked={formData.is_public}
                onCheckedChange={(checked) => setFormData({ ...formData, is_public: checked })}
              />
            </div>
            <p className="text-xs text-gray-500">
              {locale === 'en'
                ? 'Public organizations can be discovered by anyone. Private organizations require invitation.'
                : '公开组织可被任何人发现。私有组织需要邀请。'
              }
            </p>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                {locale === 'en' ? 'Cancel' : '取消'}
              </Button>
              <Button type="submit">
                {locale === 'en' ? 'Create Organization' : '创建组织'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {locale === 'en' ? 'Edit Organization' : '编辑组织'}
            </DialogTitle>
            <DialogDescription>
              {locale === 'en' 
                ? 'Update organization settings and configuration.'
                : '更新组织设置和配置。'
              }
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <Label htmlFor="edit_name">{locale === 'en' ? 'Organization Name' : '组织名称'}</Label>
              <Input
                id="edit_name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="edit_slug">{locale === 'en' ? 'URL Slug' : 'URL标识'}</Label>
              <Input
                id="edit_slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                required
              />
            </div>

            <div>
              <Label htmlFor="edit_default_language">{locale === 'en' ? 'Default Language' : '默认语言'}</Label>
              <Select value={formData.default_language} onValueChange={(value) => setFormData({ ...formData, default_language: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="zh-CN">🇨🇳 中文简体 (Simplified Chinese)</SelectItem>
                  <SelectItem value="zh-TW">🇹🇼 中文繁體 (Traditional Chinese)</SelectItem>
                  <SelectItem value="en">🇺🇸 English</SelectItem>
                  <SelectItem value="ko">🇰🇷 한국어 (Korean)</SelectItem>
                  <SelectItem value="ja">🇯🇵 日本語 (Japanese)</SelectItem>
                  <SelectItem value="es">🇪🇸 Español (Spanish)</SelectItem>
                  <SelectItem value="fr">🇫🇷 Français (French)</SelectItem>
                  <SelectItem value="de">🇩🇪 Deutsch (German)</SelectItem>
                  <SelectItem value="pt">🇧🇷 Português (Portuguese)</SelectItem>
                  <SelectItem value="ru">🇷🇺 Русский (Russian)</SelectItem>
                  <SelectItem value="ar">🇸🇦 العربية (Arabic)</SelectItem>
                  <SelectItem value="hi">🇮🇳 हिन्दी (Hindi)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit_timezone">{locale === 'en' ? 'Timezone' : '时区'}</Label>
              <Select value={formData.timezone} onValueChange={(value) => setFormData({ ...formData, timezone: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/New_York">🗽 Eastern Time (UTC-5/-4)</SelectItem>
                  <SelectItem value="America/Chicago">🏢 Central Time (UTC-6/-5)</SelectItem>
                  <SelectItem value="America/Denver">🏔️ Mountain Time (UTC-7/-6)</SelectItem>
                  <SelectItem value="America/Los_Angeles">🌴 Pacific Time (UTC-8/-7)</SelectItem>
                  <SelectItem value="Asia/Shanghai">🏮 China Time (UTC+8)</SelectItem>
                  <SelectItem value="Asia/Seoul">🇰🇷 Korea Time (UTC+9)</SelectItem>
                  <SelectItem value="Asia/Tokyo">🇯🇵 Japan Time (UTC+9)</SelectItem>
                  <SelectItem value="Europe/London">🇬🇧 London Time (UTC+0/+1)</SelectItem>
                  <SelectItem value="Europe/Paris">🇫🇷 Paris Time (UTC+1/+2)</SelectItem>
                  <SelectItem value="Europe/Berlin">🇩🇪 Berlin Time (UTC+1/+2)</SelectItem>
                  <SelectItem value="Australia/Sydney">🇦🇺 Sydney Time (UTC+10/+11)</SelectItem>
                  <SelectItem value="UTC">🌍 UTC</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="edit_is_public">{locale === 'en' ? 'Public Organization' : '公开组织'}</Label>
              <Switch
                id="edit_is_public"
                checked={formData.is_public}
                onCheckedChange={(checked) => setFormData({ ...formData, is_public: checked })}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                {locale === 'en' ? 'Cancel' : '取消'}
              </Button>
              <Button type="submit">
                {locale === 'en' ? 'Update Organization' : '更新组织'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}