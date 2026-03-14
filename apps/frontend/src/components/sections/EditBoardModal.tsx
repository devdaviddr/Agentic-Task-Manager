import type { ChangeEvent, KeyboardEvent } from 'react'
import Input from '../ui/Input'
import Textarea from '../ui/Textarea'
import Button from '../ui/Button'

interface EditBoardModalProps {
  isOpen: boolean
  boardName: string
  boardDescription: string
  onNameChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  onSave: () => void
  onClose: () => void
  savePending: boolean
  onDuplicate?: () => void
  onDelete?: () => void
  duplicatePending?: boolean
  deletePending?: boolean
}

export default function EditBoardModal({
  isOpen,
  boardName,
  boardDescription,
  onNameChange,
  onDescriptionChange,
  onSave,
  onClose,
  savePending,
  onDuplicate,
  onDelete,
  duplicatePending,
  deletePending
}: EditBoardModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-page/70 flex items-center justify-center z-50">
      <div className="card p-6 w-full max-w-md mx-4 shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-heading">Edit Board</h2>
          <button
            onClick={onClose}
            className="text-muted hover:text-body"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-body mb-1">
              Board Name *
            </label>
            <Input
              type="text"
              value={boardName}
              onChange={(e: ChangeEvent<HTMLInputElement>) => onNameChange(e.target.value)}
              placeholder="Enter board name"
              onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && onSave()}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-body mb-1">
              Description (Optional)
            </label>
            <Textarea
              value={boardDescription}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => onDescriptionChange(e.target.value)}
              placeholder="Enter board description"
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-between items-center mt-6">
          <div className="flex space-x-2">
            {onDuplicate && (
              <Button
                onClick={onDuplicate}
                disabled={duplicatePending}
                variant="secondary"
                size="sm"
              >
                {duplicatePending ? 'Duplicating...' : 'Duplicate'}
              </Button>
            )}
            {onDelete && (
              <Button
                onClick={onDelete}
                disabled={deletePending}
                variant="danger"
                size="sm"
              >
                {deletePending ? 'Deleting...' : 'Delete'}
              </Button>
            )}
          </div>

          <div className="flex space-x-2">
            <Button onClick={onClose} variant="secondary">
              Cancel
            </Button>
            <Button onClick={onSave} disabled={savePending || !boardName.trim()} variant="primary">
              {savePending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}