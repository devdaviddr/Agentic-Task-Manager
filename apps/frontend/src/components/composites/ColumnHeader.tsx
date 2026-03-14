import { EllipsisHorizontalIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'
import IconButton from '../ui/IconButton'

interface Column {
  id: number
  board_id: number
  name: string
  position: number
  created_at: string
  updated_at: string
  items: Item[]
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

interface ColumnHeaderProps {
  column: Column
  columnTheme: string
  itemCount: number
  onMoveLeft: () => void
  onMoveRight: () => void
  onEdit: () => void
  onDelete: () => void
  movePending: boolean
  updatePending: boolean
  deletePending: boolean
}

export default function ColumnHeader({
  column,
  columnTheme,
  itemCount,
  onMoveLeft,
  onMoveRight,
  onEdit,
  onDelete,
  movePending,
  updatePending,
  deletePending
}: ColumnHeaderProps) {
  const dropdownBg = 'bg-panel'
  const dropdownBorder = 'border-border'
  const buttonText = 'text-body'
  const buttonHover = 'hover:bg-panel/10'
  const deleteText = 'text-danger'
  const deleteHover = 'hover:bg-danger/10'
  const textClasses = 'text-heading'
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const handleDropdownToggle = () => setDropdownOpen(!dropdownOpen)

  const handleOptionClick = (action: () => void) => {
    action()
    setDropdownOpen(false)
  }

  return (
    <div className="flex items-center justify-between mb-2 relative" data-column-theme={columnTheme}>
      <div className="flex items-center">
        <h3 className={`font-semibold ${textClasses}`}>{column.name}</h3>
      </div>
      <div className="flex items-center space-x-1">
        <div className="relative">
          <IconButton
            icon={EllipsisHorizontalIcon}
            onClick={handleDropdownToggle}
            className={`p-1 rounded hover:bg-panel/10 transition-colors ${textClasses}/60 hover:${textClasses}`}
          />
          {dropdownOpen && (
            <div className={`absolute right-0 mt-1 w-48 ${dropdownBg} border ${dropdownBorder} rounded-md shadow-lg z-10`}>
              <button
                onClick={() => handleOptionClick(onMoveLeft)}
                disabled={movePending || column.position === 0}
                className={`w-full text-left px-4 py-2 text-sm ${buttonText} ${buttonHover} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Move Left
              </button>
              <button
                onClick={() => handleOptionClick(onMoveRight)}
                disabled={movePending}
                className={`w-full text-left px-4 py-2 text-sm ${buttonText} ${buttonHover} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Move Right
              </button>
              <button
                onClick={() => handleOptionClick(onEdit)}
                disabled={updatePending}
                className={`w-full text-left px-4 py-2 text-sm ${buttonText} ${buttonHover} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Edit
              </button>
              <button
                onClick={() => handleOptionClick(onDelete)}
                disabled={deletePending}
                className={`w-full text-left px-4 py-2 text-sm ${deleteText} ${deleteHover} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Delete
              </button>
            </div>
          )}
        </div>
        <span className={`text-sm ${textClasses}/80`}>{itemCount}</span>
      </div>
    </div>
  )
}