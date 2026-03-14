import { Droppable } from '@hello-pangea/dnd'
import Card from '../composites/Card'
import ColumnHeader from '../composites/ColumnHeader'
import Input from '../ui/Input'

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

interface User {
  id: number
  email: string
  name?: string
}

interface Tag {
  id: number
  name: string
  color: string
  created_at: string
  updated_at: string
}

interface Column {
  id: number
  board_id: number
  name: string
  position: number
  created_at: string
  updated_at: string
  items: Item[]
}

interface ColumnProps {
  column: Column
  columnTheme: string
  newItemTitle: string
  onNewItemChange: (value: string) => void
  onCreateItem: () => void
  onCardClick: (item: Item) => void
  onMoveLeft: () => void
  onMoveRight: () => void
  onEdit: () => void
  onDelete: () => void
  movePending: boolean
  updatePending: boolean
  deletePending: boolean
}

export default function Column({
  column,
  columnTheme,
  newItemTitle,
  onNewItemChange,
  onCreateItem,
  onCardClick,
  onMoveLeft,
  onMoveRight,
  onEdit,
  onDelete,
  movePending,
  updatePending,
  deletePending
}: ColumnProps) {
  const columnClasses = 'bg-panel'
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onCreateItem()
    }
  }

  return (
    <div className="flex items-start">
      <Droppable droppableId={column.id.toString()}>
        {(droppableProvided, snapshot) => (
          <div
            ref={droppableProvided.innerRef}
            {...droppableProvided.droppableProps}
            className={`rounded-card p-2 w-80 transition-all duration-200 border border-border ${
              snapshot.isDraggingOver ? 'bg-primary/10 border-primary' : columnClasses
            }`}
          >
            <ColumnHeader
              column={column}
              columnTheme={columnTheme}
              itemCount={column.items.length}
              onMoveLeft={onMoveLeft}
              onMoveRight={onMoveRight}
              onEdit={onEdit}
              onDelete={onDelete}
              movePending={movePending}
              updatePending={updatePending}
              deletePending={deletePending}
            />

            <div className="space-y-1">
              {column.items
                .sort((a, b) => a.position - b.position)
                .map((item, itemIndex) => (
                  <Card
                    key={item.id}
                    item={item}
                    index={itemIndex}
                    columnTheme={columnTheme}
                    onClick={() => onCardClick(item)}
                  />
                ))}
              {droppableProvided.placeholder}
            </div>

            <div className="mt-2">
              <Input
                type="text"
                placeholder="Add a card..."
                value={newItemTitle}
                onChange={(e) => onNewItemChange(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full text-sm"
              />
            </div>
          </div>
        )}
      </Droppable>
    </div>
  )
}