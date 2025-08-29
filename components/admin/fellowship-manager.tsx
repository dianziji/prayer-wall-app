'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Heart, 
  Plus, 
  Edit, 
  Archive, 
  Trash2, 
  Users, 
  AlertTriangle,
  Eye,
  EyeOff
} from 'lucide-react'
import { useLocale } from '@/lib/locale-context'

type Fellowship = {
  id: string
  display_name: string
  name_en?: string
  description?: string
  description_en?: string
  color?: string
  is_active: boolean
  sort_order: number
  created_at: string
  organization_id: string
}

type Props = {
  organizationId: string
}

export default function FellowshipManager({ organizationId }: Props) {
  const { locale } = useLocale()
  const [fellowships, setFellowships] = useState<Fellowship[]>([])
  const [loading, setLoading] = useState(true)
  const [editingFellowship, setEditingFellowship] = useState<Fellowship | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    id: '',
    display_name: '',
    name_en: '',
    description: '',
    description_en: '',
    color: '#8b5cf6'
  })

  useEffect(() => {
    fetchFellowships()
  }, [organizationId])

  const fetchFellowships = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/fellowships?orgId=${organizationId}`)
      if (response.ok) {
        const data = await response.json()
        setFellowships(data.fellowships || [])
      }
    } catch (error) {
      console.error('Failed to fetch fellowships:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/admin/fellowships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          organization_id: organizationId
        })
      })

      if (response.ok) {
        await fetchFellowships()
        setIsCreateDialogOpen(false)
        resetForm()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to create fellowship')
      }
    } catch (error) {
      console.error('Error creating fellowship:', error)
      alert('Failed to create fellowship')
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingFellowship) return

    console.log('Updating fellowship:', editingFellowship.id)
    console.log('Form data:', formData)

    try {
      const response = await fetch(`/api/admin/fellowships/${editingFellowship.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        await fetchFellowships()
        setIsEditDialogOpen(false)
        setEditingFellowship(null)
        resetForm()
      } else {
        const error = await response.json()
        console.error('Update failed:', error)
        alert(`Update failed: ${error.error || 'Failed to update fellowship'}`)
      }
    } catch (error) {
      console.error('Error updating fellowship:', error)
      alert('Failed to update fellowship')
    }
  }

  const handleArchive = async (fellowship: Fellowship) => {
    const confirmMessage = locale === 'en' 
      ? `Are you sure you want to archive "${fellowship.display_name}"? This will make it inactive but preserve all associated prayers.`
      : `确定要归档"${fellowship.display_name}"吗？这将使其不活跃但保留所有相关祷告。`
    
    if (!confirm(confirmMessage)) return

    try {
      const response = await fetch(`/api/admin/fellowships/${fellowship.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        const result = await response.json()
        await fetchFellowships()
        
        const successMessage = result.action === 'archived'
          ? (locale === 'en' 
              ? `Fellowship archived successfully (${result.prayerCount} prayers preserved)`
              : `团契已成功归档（保留了 ${result.prayerCount} 个祷告）`)
          : (locale === 'en'
              ? 'Fellowship deactivated successfully'
              : '团契已成功停用')
        
        alert(successMessage)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to archive fellowship')
      }
    } catch (error) {
      console.error('Error archiving fellowship:', error)
      alert('Failed to archive fellowship')
    }
  }

  const handleToggleActive = async (fellowship: Fellowship) => {
    try {
      const response = await fetch(`/api/admin/fellowships/${fellowship.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_active: !fellowship.is_active
        })
      })

      if (response.ok) {
        await fetchFellowships()
      }
    } catch (error) {
      console.error('Error toggling fellowship status:', error)
    }
  }

  const openCreateDialog = () => {
    resetForm()
    setIsCreateDialogOpen(true)
  }

  const openEditDialog = (fellowship: Fellowship) => {
    setEditingFellowship(fellowship)
    setFormData({
      id: fellowship.id,
      display_name: fellowship.display_name,
      name_en: fellowship.name_en || '',
      description: fellowship.description || '',
      description_en: fellowship.description_en || '',
      color: fellowship.color || '#8b5cf6'
    })
    setIsEditDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      id: '',
      display_name: '',
      name_en: '',
      description: '',
      description_en: '',
      color: '#8b5cf6'
    })
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500">
          {locale === 'en' ? 'Loading fellowships...' : '正在加载团契列表...'}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">
            {locale === 'en' ? 'Fellowship Categories' : '团契类别'}
          </h3>
          <p className="text-sm text-gray-600">
            {locale === 'en' 
              ? `${fellowships.length} fellowships configured` 
              : `已配置 ${fellowships.length} 个团契`
            }
          </p>
        </div>
        <Button onClick={openCreateDialog} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          {locale === 'en' ? 'Add Fellowship' : '添加团契'}
        </Button>
      </div>

      {/* Fellowship Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {fellowships.map((fellowship) => (
          <Card key={fellowship.id} className={`relative ${!fellowship.is_active ? 'opacity-60' : ''}`}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: fellowship.color }}
                  />
                  <CardTitle className="text-base">{fellowship.display_name}</CardTitle>
                </div>
                <div className="flex items-center gap-1">
                  {!fellowship.is_active && <EyeOff className="w-4 h-4 text-gray-400" />}
                  <Badge variant={fellowship.is_active ? 'default' : 'secondary'} className="text-xs">
                    {fellowship.is_active ? 
                      (locale === 'en' ? 'Active' : '活跃') : 
                      (locale === 'en' ? 'Archived' : '归档')
                    }
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {fellowship.name_en && (
                  <p className="text-sm text-gray-600">{fellowship.name_en}</p>
                )}
                {fellowship.description && (
                  <p className="text-sm text-gray-700">{fellowship.description}</p>
                )}
                
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditDialog(fellowship)}
                      className="flex items-center gap-1"
                    >
                      <Edit className="w-3 h-3" />
                      {locale === 'en' ? 'Edit' : '编辑'}
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleActive(fellowship)}
                      className="flex items-center gap-1"
                    >
                      {fellowship.is_active ? (
                        <>
                          <Archive className="w-3 h-3" />
                          {locale === 'en' ? 'Archive' : '归档'}
                        </>
                      ) : (
                        <>
                          <Eye className="w-3 h-3" />
                          {locale === 'en' ? 'Restore' : '恢复'}
                        </>
                      )}
                    </Button>
                  </div>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleArchive(fellowship)}
                    className="flex items-center gap-1 text-orange-600 hover:text-orange-700"
                  >
                    <Trash2 className="w-3 h-3" />
                    {locale === 'en' ? 'Archive' : '归档'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {locale === 'en' ? 'Create New Fellowship' : '创建新团契'}
            </DialogTitle>
            <DialogDescription>
              {locale === 'en' 
                ? 'Add a new fellowship category for organizing prayers.'
                : '添加新的团契类别来组织祷告。'
              }
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="id">{locale === 'en' ? 'ID (English)' : 'ID (英文标识)'}</Label>
                <Input
                  id="id"
                  value={formData.id}
                  onChange={(e) => setFormData({ ...formData, id: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                  placeholder="e.g., youngpro"
                  required
                />
              </div>
              <div>
                <Label htmlFor="color">{locale === 'en' ? 'Color' : '颜色'}</Label>
                <Input
                  id="color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="display_name">{locale === 'en' ? 'Chinese Name' : '中文名称'}</Label>
              <Input
                id="display_name"
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                placeholder={locale === 'en' ? 'e.g., Young Professionals Fellowship' : '例：青年专业人士团契'}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="name_en">{locale === 'en' ? 'English Name' : '英文名称'}</Label>
              <Input
                id="name_en"
                value={formData.name_en}
                onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                placeholder="Young Professionals Fellowship"
              />
            </div>
            
            <div>
              <Label htmlFor="description">{locale === 'en' ? 'Chinese Description' : '中文描述'}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={locale === 'en' ? 'Fellowship description in Chinese' : '团契的中文描述'}
              />
            </div>
            
            <div>
              <Label htmlFor="description_en">{locale === 'en' ? 'English Description' : '英文描述'}</Label>
              <Textarea
                id="description_en"
                value={formData.description_en}
                onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                placeholder="Fellowship description in English"
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                {locale === 'en' ? 'Cancel' : '取消'}
              </Button>
              <Button type="submit">
                {locale === 'en' ? 'Create Fellowship' : '创建团契'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {locale === 'en' ? 'Edit Fellowship' : '编辑团契'}
            </DialogTitle>
            <DialogDescription>
              {locale === 'en' 
                ? 'Update fellowship information and settings.'
                : '更新团契信息和设置。'
              }
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_id">{locale === 'en' ? 'ID' : 'ID'}</Label>
                <Input
                  id="edit_id"
                  value={formData.id}
                  disabled
                  className="bg-gray-50"
                />
              </div>
              <div>
                <Label htmlFor="edit_color">{locale === 'en' ? 'Color' : '颜色'}</Label>
                <Input
                  id="edit_color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="edit_display_name">{locale === 'en' ? 'Chinese Name' : '中文名称'}</Label>
              <Input
                id="edit_display_name"
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="edit_name_en">{locale === 'en' ? 'English Name' : '英文名称'}</Label>
              <Input
                id="edit_name_en"
                value={formData.name_en}
                onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="edit_description">{locale === 'en' ? 'Chinese Description' : '中文描述'}</Label>
              <Textarea
                id="edit_description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="edit_description_en">{locale === 'en' ? 'English Description' : '英文描述'}</Label>
              <Textarea
                id="edit_description_en"
                value={formData.description_en}
                onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                {locale === 'en' ? 'Cancel' : '取消'}
              </Button>
              <Button type="submit">
                {locale === 'en' ? 'Update Fellowship' : '更新团契'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}