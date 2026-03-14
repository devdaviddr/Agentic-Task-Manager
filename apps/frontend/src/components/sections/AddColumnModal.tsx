import ModalHeader from '../composites/ModalHeader'
import Button from '../ui/Button'
import Input from '../ui/Input'

interface AddColumnModalProps {
  isOpen: boolean
  columnName: string
  isEditing: boolean
  onNameChange: (value: string) => void
  onSave: () => void
  onClose: () => void
  savePending: boolean
}

export default function AddColumnModal({
  isOpen,
  columnName,
  isEditing,
  onNameChange,
  onSave,
  onClose,
  savePending
}: AddColumnModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-page/70 flex items-center justify-center z-50">
      <div className="card p-6 w-full max-w-md mx-4 shadow-xl">
        <ModalHeader title={isEditing ? "Edit Column" : "Add New Column"} onClose={onClose} />

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-body mb-1">
              Column Name
            </label>
            <Input
              type="text"
              value={columnName}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Enter column name"
              autoFocus
            />
          </div>
        </div>

        <div className="flex justify-end space-x-2 mt-6">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={onSave}
            disabled={savePending || !columnName.trim()}
          >
            {savePending ? (isEditing ? 'Saving...' : 'Adding...') : (isEditing ? 'Save' : 'Add Column')}
          </Button>
        </div>
      </div>
    </div>
  )
}