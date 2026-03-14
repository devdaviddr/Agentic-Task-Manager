import { useState } from 'react'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Select from '../ui/Select'
import IconButton from '../ui/IconButton'
import { PencilIcon, TrashIcon, ExclamationTriangleIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline'

interface Tag {
  id: number
  name: string
  color: string
  created_at: string
  updated_at: string
}

interface PendingCreateTag {
  name: string
  color: string
  id: string
  status: 'pending_create'
  pendingIndex: number
}

type DisplayTag = Tag & { status: 'existing' | 'pending_delete' } | PendingCreateTag

interface PendingChanges {
  general: {
    name?: string
    background?: string
    columnTheme?: string
  }
  tags: {
    toCreate: Array<{ name: string; color: string }>
    toUpdate: Array<{ id: number; name: string; color: string }>
    toDelete: number[]
  }
  actions: {
    archive?: boolean
    delete?: boolean
  }
}

interface BoardSettingsModalProps {
  isOpen: boolean
  editBoardName: string
  editBackground: string
  editColumnTheme: string
  onNameChange: (value: string) => void
  onBackgroundChange: (value: string) => void
  onThemeChange: (value: string) => void
  onSave: () => void
  onClose: () => void
  onArchive: () => void
  onDelete: () => void
  tags: Tag[]
  onCreateTag: (name: string, color: string) => Promise<void>
  editingTagId: number | null
  editTagName: string
  editTagColor: string
  onEditTagNameChange: (value: string) => void
  onEditTagColorChange: (value: string) => void
  onStartEditTag: (tag: Tag) => void
  onSaveEditTag: (id: number, name: string, color: string) => Promise<void>
  onCancelEditTag: () => void
  onDeleteTag: (id: number) => Promise<void>
}

export default function BoardSettingsModal({
  isOpen,
  editBoardName,
  editBackground,
  editColumnTheme,
  onNameChange,
  onBackgroundChange,
  onThemeChange,
  onSave,
  onClose,
  onArchive,
  onDelete,
  tags,
  onCreateTag,
  editingTagId,
  editTagName,
  editTagColor,
  onEditTagNameChange,
  onEditTagColorChange,
  onStartEditTag,
  onSaveEditTag,
  onCancelEditTag,
  onDeleteTag
}: BoardSettingsModalProps) {
  const [selectedTab, setSelectedTab] = useState<'general' | 'tags' | 'danger'>('general')
  const [pendingChanges, setPendingChanges] = useState<PendingChanges>({
    general: {},
    tags: { toCreate: [], toUpdate: [], toDelete: [] },
    actions: {}
  })
  const [hasChanges, setHasChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editingPendingTagIndex, setEditingPendingTagIndex] = useState<number | null>(null)
  const [editingPendingTagName, setEditingPendingTagName] = useState('')
  const [editingPendingTagColor, setEditingPendingTagColor] = useState('#3B82F6')

  // Track changes across all tabs
  const trackChange = (tab: keyof PendingChanges, field: string, value: unknown) => {
    setPendingChanges(prev => ({
      ...prev,
      [tab]: { ...prev[tab], [field]: value }
    }))
    setHasChanges(true)
  }

  const resetChanges = () => {
    setPendingChanges({
      general: {},
      tags: { toCreate: [], toUpdate: [], toDelete: [] },
      actions: {}
    })
    setHasChanges(false)
  }

  // Universal save handler
  const handleUniversalSave = async () => {
    try {
      setIsSaving(true)
      
      // Execute all pending changes in order
      if (Object.keys(pendingChanges.general).length > 0) {
        await onSave()
      }
      
      // Execute tag operations
      if (pendingChanges.tags.toCreate.length > 0) {
        for (const tag of pendingChanges.tags.toCreate) {
          await onCreateTag(tag.name, tag.color)
        }
      }
      
      if (pendingChanges.tags.toUpdate.length > 0) {
        for (const tag of pendingChanges.tags.toUpdate) {
          await onSaveEditTag(tag.id, tag.name, tag.color)
        }
      }
      
      if (pendingChanges.tags.toDelete.length > 0) {
        for (const tagId of pendingChanges.tags.toDelete) {
          await onDeleteTag(tagId)
        }
      }
      
      // Execute danger actions
      if (pendingChanges.actions.archive) {
        await onArchive()
      }
      
      if (pendingChanges.actions.delete) {
        await onDelete()
      }
      
      // Reset state on success
      resetChanges()
      onClose()
      
    } catch (error) {
      console.error('Failed to save changes:', error)
    } finally {
      setIsSaving(false)
    }
  }

  // Universal cancel handler
  const handleUniversalCancel = () => {
    if (hasChanges) {
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to cancel?'
      )
      if (!confirmed) return
    }
    
    resetChanges()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-page/70 flex items-center justify-center z-50">
      <div className="card p-0 w-[600px] max-h-[90vh] overflow-hidden shadow-xl">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-heading">Board Settings</h2>
              {hasChanges && (
                <div className="flex items-center mt-1">
                  <div className="w-2 h-2 bg-secondary rounded-full mr-2"></div>
                  <span className="text-sm text-secondary">Unsaved changes</span>
                </div>
              )}
            </div>
            <div className="flex space-x-2">
              <IconButton
                icon={XMarkIcon}
                onClick={handleUniversalCancel}
                size="sm"
              />
              <IconButton 
                icon={CheckIcon}
                onClick={handleUniversalSave} 
                disabled={!hasChanges || isSaving}
                size="sm"
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {/* Tab Navigation */}
            <div className="border-b border-border mb-6">
              <nav className="-mb-px flex space-x-1 bg-panel p-1 rounded-lg">
                <button
                  onClick={() => setSelectedTab('general')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                    selectedTab === 'general'
                      ? 'bg-primary/10 text-primary shadow-sm'
                      : 'text-muted hover:text-body'
                  }`}
                >
                  General
                </button>
                <button
                  onClick={() => setSelectedTab('tags')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                    selectedTab === 'tags'
                      ? 'bg-primary/10 text-primary shadow-sm'
                      : 'text-muted hover:text-body'
                  }`}
                >
                  Tags
                </button>
                <button
                  onClick={() => setSelectedTab('danger')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                    selectedTab === 'danger'
                      ? 'bg-danger/10 text-danger shadow-sm border border-danger/30'
                      : 'text-muted hover:text-body'
                  }`}
                >
                  Danger Zone
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            {selectedTab === 'general' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-body">Board Name</label>
                    <Input
                      type="text"
                      value={editBoardName}
                      onChange={(e) => {
                        onNameChange(e.target.value)
                        trackChange('general', 'name', e.target.value)
                      }}
                      placeholder="Enter board name"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-body">Background</label>
                      <Select
                        value={editBackground}
                        onChange={(e) => {
                          onBackgroundChange(e.target.value)
                          trackChange('general', 'background', e.target.value)
                        }}
                      >
                        <option value="bg-page">Page (default)</option>
                        <option value="bg-panel">Panel</option>
                        <option value="bg-primary/10">Primary</option>
                        <option value="bg-secondary/10">Secondary</option>
                        <option value="bg-tertiary/10">Tertiary</option>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-body">Column Theme</label>
                      <Select
                        value={editColumnTheme}
                        onChange={(e) => {
                          onThemeChange(e.target.value)
                          trackChange('general', 'columnTheme', e.target.value)
                        }}
                      >
                        <option value="dark">Dark</option>
                        <option value="light">Light</option>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedTab === 'tags' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-heading">Tags</h3>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={() => {
                      // Directly add a new tag with default name "New Tag"
                      const newTag = { name: 'New Tag', color: '#3B82F6' }
                      trackChange('tags', 'toCreate', [...pendingChanges.tags.toCreate, newTag])
                    }}
                  >
                    Add Tag
                  </Button>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {/* Combine existing tags with pending changes */}
                  {[
                    // Existing tags (not marked for deletion)
                    ...tags
                      .filter(tag => !pendingChanges.tags.toDelete.includes(tag.id))
                      .map(tag => ({ ...tag, status: 'existing' as const } as DisplayTag)),
                    // Pending create tags
                    ...pendingChanges.tags.toCreate.map((tag, index) => ({ 
                      ...tag, 
                      id: `pending-create-${index}`, 
                      status: 'pending_create' as const,
                      pendingIndex: index
                    } as DisplayTag)),
                    // Existing tags marked for deletion
                    ...tags
                      .filter(tag => pendingChanges.tags.toDelete.includes(tag.id))
                      .map(tag => ({ ...tag, status: 'pending_delete' as const } as DisplayTag))
                  ].map((tag: DisplayTag) => (
                        <div key={tag.id} className={`flex items-center justify-between p-3 rounded-card border ${
                      tag.status === 'pending_create' 
                        ? 'bg-secondary/15 border-secondary' 
                        : tag.status === 'pending_delete'
                        ? 'bg-danger/15 border-danger'
                        : 'bg-panel border-border'
                    }`}>
                      {editingTagId === tag.id ? (
                        <div className="flex items-center space-x-3 flex-1">
                          <input
                            type="color"
                            value={editTagColor}
                            onChange={(e) => onEditTagColorChange(e.target.value)}
                            className="w-6 h-6 rounded border border-border"
                          />
                          <Input
                            type="text"
                            value={editTagName}
                            onChange={(e) => onEditTagNameChange(e.target.value)}
                            className="flex-1"
                          />
                          <div className="flex space-x-2">
                            <IconButton
                              icon={CheckIcon}
                              onClick={() => {
                                if (editTagName.trim() && editingTagId) {
                                  trackChange('tags', 'toUpdate', [...pendingChanges.tags.toUpdate, { id: editingTagId, name: editTagName.trim(), color: editTagColor }])
                                  onCancelEditTag() // Reset edit state
                                }
                              }}
                              size="sm"
                              disabled={!editTagName.trim()}
                            />
                            <IconButton
                              icon={XMarkIcon}
                              onClick={onCancelEditTag}
                              size="sm"
                            />
                          </div>
                        </div>
                      ) : (
                        <>
                           <div className="flex items-center space-x-3 flex-1">
                             <div className="w-4 h-4 rounded-full" style={{backgroundColor: tag.color}}></div>
                             {tag.status === 'pending_create' && editingPendingTagIndex === (tag as PendingCreateTag).pendingIndex ? (
                               <div className="flex items-center space-x-3 flex-1">
                                 <input
                                   type="color"
                                   value={editingPendingTagColor}
                                   onChange={(e) => setEditingPendingTagColor(e.target.value)}
                                    className="w-6 h-6 rounded border border-border"
                                 />
                                 <Input
                                   type="text"
                                   value={editingPendingTagName}
                                   onChange={(e) => setEditingPendingTagName(e.target.value)}
                                   className="flex-1"
                                   autoFocus
                                 />
                                 <div className="flex space-x-2">
                                   <IconButton
                                     icon={CheckIcon}
                                     onClick={() => {
                                       if (editingPendingTagName.trim()) {
                                         // Update the pending create tag
                                         setPendingChanges(prev => ({
                                           ...prev,
                                           tags: {
                                             ...prev.tags,
                                             toCreate: prev.tags.toCreate.map((t, i) => 
                                               i === editingPendingTagIndex 
                                                 ? { name: editingPendingTagName.trim(), color: editingPendingTagColor }
                                                 : t
                                             )
                                           }
                                         }))
                                         setEditingPendingTagIndex(null)
                                         setEditingPendingTagName('')
                                         setEditingPendingTagColor('#3B82F6')
                                       }
                                     }}
                                     size="sm"
                                     disabled={!editingPendingTagName.trim()}
                                   />
                                   <IconButton
                                     icon={XMarkIcon}
                                     onClick={() => {
                                       setEditingPendingTagIndex(null)
                                       setEditingPendingTagName('')
                                       setEditingPendingTagColor('#3B82F6')
                                     }}
                                     size="sm"
                                   />
                                 </div>
                               </div>
                             ) : (
                               <span 
                                 className={`font-medium cursor-pointer hover:text-primary ${
                                   tag.status === 'pending_delete' ? 'line-through text-danger' : 'text-body'
                                 }`}
                                 onClick={() => {
                                   if (tag.status === 'pending_create') {
                                     setEditingPendingTagIndex((tag as PendingCreateTag).pendingIndex)
                                     setEditingPendingTagName(tag.name)
                                     setEditingPendingTagColor(tag.color)
                                   }
                                 }}
                               >
                                 {tag.name}
                               </span>
                             )}
                             {tag.status === 'pending_create' && (
                               <span className="px-2 py-1 text-xs bg-secondary/20 text-secondary rounded-full">New</span>
                             )}
                             {tag.status === 'pending_delete' && (
                               <span className="px-2 py-1 text-xs bg-danger/20 text-danger rounded-full">Will be deleted</span>
                             )}
                           </div>
                          <div className="flex space-x-2">
                            {tag.status === 'existing' && (
                              <>
                                <IconButton
                                  icon={PencilIcon}
                                  onClick={() => onStartEditTag(tag as Tag)}
                                  size="sm"
                                />
                                <IconButton
                                  icon={TrashIcon}
                                  onClick={() => {
                                    if (window.confirm('Are you sure you want to delete this tag? This will remove it from all cards.')) {
                                      trackChange('tags', 'toDelete', [...pendingChanges.tags.toDelete, tag.id])
                                    }
                                  }}
                                  size="sm"
                                />
                              </>
                            )}
                            {tag.status === 'pending_create' && (
                              <IconButton
                                icon={TrashIcon}
                                onClick={() => {
                                  // Remove from pending create
                                  setPendingChanges(prev => {
                                    const newToCreate = prev.tags.toCreate.filter(t => t !== tag)
                                    const newPendingChanges = {
                                      ...prev,
                                      tags: {
                                        ...prev.tags,
                                        toCreate: newToCreate
                                      }
                                    }
                                    // Check if no more changes
                                    if (newToCreate.length === 0 && 
                                        Object.keys(prev.general).length === 0 && 
                                        prev.tags.toUpdate.length === 0 && 
                                        prev.tags.toDelete.length === 0 && 
                                        Object.keys(prev.actions).length === 0) {
                                      setHasChanges(false)
                                    }
                                    return newPendingChanges
                                  })
                                }}
                                size="sm"
                              />
                            )}
                            {tag.status === 'pending_delete' && (
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => {
                                  // Remove from pending delete
                                  setPendingChanges(prev => {
                                    const newToDelete = prev.tags.toDelete.filter(id => id !== tag.id)
                                    const newPendingChanges = {
                                      ...prev,
                                      tags: {
                                        ...prev.tags,
                                        toDelete: newToDelete
                                      }
                                    }
                                    // Check if no more changes
                                    if (newToDelete.length === 0 && 
                                        Object.keys(prev.general).length === 0 && 
                                        prev.tags.toCreate.length === 0 && 
                                        prev.tags.toUpdate.length === 0 && 
                                        Object.keys(prev.actions).length === 0) {
                                      setHasChanges(false)
                                    }
                                    return newPendingChanges
                                  })
                                }}
                              >
                                Undo
                              </Button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedTab === 'danger' && (
              <div className="bg-panel border border-border rounded-card p-6">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <ExclamationTriangleIcon className="h-6 w-6 text-danger" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-heading">Danger Zone</h3>
                    <p className="mt-1 text-sm text-muted">
                      These actions cannot be undone. Please proceed with caution.
                    </p>
                    <div className="mt-4 flex space-x-3">
                      <Button 
                        variant="secondary"
                        onClick={() => {
                          if (window.confirm('Are you sure you want to archive this board? It will be hidden from your dashboard.')) {
                            trackChange('actions', 'archive', true)
                          }
                        }}
                      >
                        Archive Board
                      </Button>
                      <Button 
                        variant="danger"
                        onClick={() => {
                          if (window.confirm('Are you sure you want to permanently delete this board? This will delete all columns and cards.')) {
                            trackChange('actions', 'delete', true)
                          }
                        }}
                      >
                        Delete Board
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}