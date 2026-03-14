import ModalHeader from '../composites/ModalHeader'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Textarea from '../ui/Textarea'
import Select from '../ui/Select'
import PillInput from '../ui/PillInput'
import { useState } from 'react'

interface User {
  id: number
  email: string
  name?: string
}

interface Item {
  id: number
  column_id: number
  title: string
  description?: string
  position: number
  start_date?: string
  end_date?: string
  effort?: number
  label?: string
  priority?: 'high' | 'medium' | 'low'
  tags?: Tag[]
  assigned_users?: User[]
  archived: boolean
  created_at: string
  updated_at: string
}

interface Tag {
  id: number
  name: string
  color: string
  created_at: string
  updated_at: string
}

interface CardEditModalProps {
  isOpen: boolean
  selectedCard: Item | null
  editTitle: string
  editDescription: string
  editStartDate: string
  editEndDate: string
  editEffort: string
  editLabel: string
  editPriority: string
  editTags: Tag[]
  editUsers: User[]
  availableTags: Tag[]
  availableUsers: User[]
  onTitleChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  onStartDateChange: (value: string) => void
  onEndDateChange: (value: string) => void
  onEffortChange: (value: string) => void
  onLabelChange: (value: string) => void
  onPriorityChange: (value: string) => void
  onTagsChange: (tags: Tag[]) => void
  onUsersChange: (users: User[]) => void
  onSave: () => void
  onDelete: () => void
  onArchive: () => void
  onClose: () => void
  savePending: boolean
  deletePending: boolean
  archivePending: boolean
}

export default function CardEditModal({
  isOpen,
  selectedCard,
  editTitle,
  editDescription,
  editStartDate,
  editEndDate,
  editEffort,
  editLabel,
  editPriority,
  editTags,
  editUsers,
  availableTags,
  availableUsers,
  onTitleChange,
  onDescriptionChange,
  onStartDateChange,
  onEndDateChange,
  onEffortChange,
  onLabelChange,
  onPriorityChange,
  onTagsChange,
  onUsersChange,
  onSave,
  onDelete,
  onArchive,
  onClose,
  savePending,
  deletePending,
  archivePending
}: CardEditModalProps) {
  const [tagInput, setTagInput] = useState('')
  const [showTagDropdown, setShowTagDropdown] = useState(false)
  const [userInput, setUserInput] = useState('')
  const [showUserDropdown, setShowUserDropdown] = useState(false)

  const filteredTags = tagInput
    ? availableTags.filter(tag => tag.name.toLowerCase().includes(tagInput.toLowerCase()) && !editTags.find(t => t.id === tag.id))
    : availableTags.filter(tag => !editTags.find(t => t.id === tag.id))

  const filteredUsers = userInput
    ? availableUsers.filter(user => 
        (user.name?.toLowerCase().includes(userInput.toLowerCase()) || 
         user.email.toLowerCase().includes(userInput.toLowerCase())) && 
        !editUsers.find(u => u.id === user.id)
      )
    : availableUsers.filter(user => !editUsers.find(u => u.id === user.id))

  if (!isOpen || !selectedCard) return null

  return (
    <div className="fixed inset-0 bg-page/70 flex items-center justify-center z-50">
      <div className="card w-full max-w-lg mx-4 shadow-xl">
        <ModalHeader title="Edit Card" onClose={onClose} />

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-body mb-1">
              Title
            </label>
            <Input
              type="text"
              value={editTitle}
              onChange={(e) => onTitleChange(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-body mb-1">
              Description
            </label>
            <Textarea
              value={editDescription}
              onChange={(e) => onDescriptionChange(e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium text-body mb-1">
                Start Date
              </label>
              <Input
                type="date"
                value={editStartDate}
                onChange={(e) => onStartDateChange(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-body mb-1">
                End Date
              </label>
              <Input
                type="date"
                value={editEndDate}
                onChange={(e) => onEndDateChange(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-sm font-medium text-body mb-1">
                Label
              </label>
              <Input
                type="text"
                value={editLabel}
                onChange={(e) => onLabelChange(e.target.value)}
                placeholder="e.g., Bug, Feature"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-body mb-1">
                Effort (1-10)
              </label>
              <Input
                type="number"
                min="1"
                max="10"
                value={editEffort}
                onChange={(e) => onEffortChange(e.target.value)}
                placeholder="1-10"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-body mb-1">
                Priority
              </label>
              <Select
                value={editPriority}
                onChange={(e) => onPriorityChange(e.target.value)}
              >
                <option value="">None</option>
                <option value="high">High (^^^)</option>
                <option value="medium">Medium (^^)</option>
                <option value="low">Low (^)</option>
              </Select>
            </div>
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-body mb-1">
              Tags
            </label>
            <PillInput
              pills={editTags.map(tag => ({ id: tag.id, name: tag.name, removable: true }))}
              value={tagInput}
              onChange={(value) => {
                setTagInput(value)
                setShowTagDropdown(true)
              }}
              onPillRemove={(id) => onTagsChange(editTags.filter(t => t.id !== id))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  const trimmed = tagInput.trim()
                  if (trimmed) {
                    const existing = availableTags.find(t => t.name.toLowerCase() === trimmed.toLowerCase())
                    if (existing && !editTags.find(t => t.id === existing.id)) {
                      onTagsChange([...editTags, existing])
                    } else if (!existing) {
                      const tempTag = {
                        id: Date.now(),
                        name: trimmed,
                        color: '#3B82F6',
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                      }
                      onTagsChange([...editTags, tempTag])
                    }
                    setTagInput('')
                    setShowTagDropdown(false)
                  }
                }
              }}
              onFocus={() => setShowTagDropdown(true)}
              onBlur={() => setTimeout(() => setShowTagDropdown(false), 100)}
              placeholder="Type to add or create tag..."
            />
            {showTagDropdown && (
              <div className="absolute z-[60] bg-panel border border-border rounded-md shadow-lg max-h-40 overflow-y-auto w-full bottom-full mb-1">
                {filteredTags.length > 0 ? (
                  filteredTags.map(tag => (
                    <div
                      key={tag.id}
                      className="px-3 py-2 hover:bg-panel/10 cursor-pointer flex items-center"
                      onClick={() => {
                        onTagsChange([...editTags, tag])
                        setTagInput('')
                        setShowTagDropdown(false)
                      }}
                    >
                      <span className="inline-block w-3 h-3 rounded-full mr-2" style={{ backgroundColor: tag.color }}></span>
                      {tag.name}
                    </div>
                  ))
                ) : tagInput ? (
                  <div className="px-3 py-2 text-muted">No matching tags</div>
                ) : null}
              </div>
            )}
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-body mb-1">
              Assigned Users
            </label>
            <PillInput
              pills={editUsers.map(user => ({ id: user.id, name: user.name || user.email, removable: true }))}
              value={userInput}
              onChange={(value) => {
                setUserInput(value)
                setShowUserDropdown(true)
              }}
              onPillRemove={(id) => onUsersChange(editUsers.filter(u => u.id !== id))}
              onFocus={() => setShowUserDropdown(true)}
              onBlur={() => setTimeout(() => setShowUserDropdown(false), 100)}
              placeholder="Type to search and assign users..."
            />
            {showUserDropdown && (
              <div className="absolute z-[60] bg-panel border border-border rounded-md shadow-lg max-h-40 overflow-y-auto w-full bottom-full mb-1">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map(user => (
                    <div
                      key={user.id}
                      className="px-3 py-2 hover:bg-panel/10 cursor-pointer"
                      onClick={() => {
                        onUsersChange([...editUsers, user])
                        setUserInput('')
                        setShowUserDropdown(false)
                      }}
                    >
                      <div className="font-medium text-body">{user.name || 'No name'}</div>
                      <div className="text-sm text-muted">{user.email}</div>
                    </div>
                  ))
                ) : userInput ? (
                  <div className="px-3 py-2 text-muted">No matching users</div>
                ) : null}
              </div>
            )}
          </div>

          <div className="text-xs text-muted">
            Created: {new Date(selectedCard.created_at).toLocaleDateString()}
          </div>
        </div>

        <div className="flex justify-between items-center mt-6">
          <div className="flex space-x-2">
            <Button
              variant="danger"
              size="sm"
              onClick={onArchive}
              disabled={archivePending}
            >
              {archivePending ? 'Archiving...' : (selectedCard?.archived ? 'Unarchive' : 'Archive')}
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={onDelete}
              disabled={deletePending}
            >
              {deletePending ? 'Deleting...' : 'Delete Card'}
            </Button>
          </div>

          <div className="flex space-x-2">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={onSave}
              disabled={savePending}
            >
              {savePending ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}