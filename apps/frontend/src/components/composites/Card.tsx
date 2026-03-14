import { Draggable } from '@hello-pangea/dnd'

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

interface CardProps {
  item: Item
  index: number
  columnTheme: string
  onClick: () => void
}

function getPrioritySymbol(priority?: 'high' | 'medium' | 'low'): string {
  switch (priority) {
    case 'high':
      return '^^^'
    case 'medium':
      return '^^'
    case 'low':
      return '^'
    default:
      return ''
  }
}

function getDueInfo(end_date?: string): { text: string; isOverdue: boolean } | null {
  if (!end_date) return null
  const now = new Date()
  const due = new Date(end_date)
  const diffTime = due.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  if (diffDays > 0) {
    return { text: `${diffDays} days`, isOverdue: false }
  } else if (diffDays === 0) {
    return { text: 'Due today', isOverdue: false }
  } else {
    const overdueDays = Math.abs(diffDays)
    return { text: `${overdueDays} days overdue!`, isOverdue: true }
  }
}

export default function Card({ item, index, columnTheme, onClick }: CardProps) {
  const textClasses = 'text-body'
  const themeClasses = columnTheme === 'light' ? 'bg-panel/80' : 'bg-panel'
  const dueInfo = getDueInfo(item.end_date)

  return (
    <Draggable key={item.id} draggableId={item.id.toString()} index={index}>
      {(itemProvided, itemSnapshot) => (
        <div
          ref={itemProvided.innerRef}
          {...itemProvided.draggableProps}
          {...itemProvided.dragHandleProps}
          className={`${themeClasses} p-2 rounded-card border border-border shadow-sm cursor-move transition-all duration-150 relative ${
            itemSnapshot.isDragging
              ? 'shadow-xl opacity-95 border-primary ring-2 ring-primary/50'
              : 'hover:border-primary hover:shadow-md'
          }`}
          onClick={onClick}
        >
          {/* Assigned users moved to bottom right in metadata row */}
          <div className="space-y-1.5">
            <h4 className={`font-semibold text-xs leading-tight ${textClasses}`}>{item.title}</h4>

            {item.description && (
              <p className={`text-xs ${textClasses}/70 leading-relaxed line-clamp-2`}>{item.description}</p>
            )}

            <div className="flex items-center justify-between">
              <div className="flex flex-wrap gap-1">
                {item.label && (
                  <span className="inline-block bg-secondary/20 text-secondary text-xs px-1.5 py-0.5 rounded font-medium">
                    {item.label}
                  </span>
                )}
                {item.priority && (
                  <span className="inline-block bg-danger/20 text-danger text-xs px-1.5 py-0.5 rounded font-medium">
                    {getPrioritySymbol(item.priority)}
                  </span>
                )}
                {typeof item.effort === 'number' && item.effort > 0 && (
                  <span className="inline-block bg-primary/20 text-primary text-xs px-1.5 py-0.5 rounded font-medium">
                    ⚡{item.effort}
                  </span>
                )}
                {dueInfo && (
                  <span className={`inline-block text-xs px-1.5 py-0.5 rounded font-medium ${
                    dueInfo.isOverdue ? 'bg-danger/20 text-danger' : 'bg-primary/20 text-primary'
                  }`}>
                    {dueInfo.text}
                  </span>
                )}
                {item.tags && item.tags.map(tag => (
                  <span
                    key={tag.id}
                    className="inline-block text-xs px-1.5 py-0.5 rounded font-medium text-page"
                    style={{ backgroundColor: tag.color }}
                  >
                    {tag.name}
                  </span>
                ))}
              </div>

              {/* User avatars in bottom right */}
              {item.assigned_users && item.assigned_users.length > 0 && (
                <div className="flex -space-x-1">
                  {item.assigned_users.slice(0, 3).map(user => (
                    <div
                      key={user.id}
                      className="w-6 h-6 rounded-full bg-primary border-2 border-border flex items-center justify-center text-xs font-medium text-page"
                      title={user.name || user.email}
                    >
                      {(user.name || user.email).charAt(0).toUpperCase()}
                    </div>
                  ))}
                  {item.assigned_users.length > 3 && (
                    <div className="w-6 h-6 rounded-full bg-muted border-2 border-border flex items-center justify-center text-xs font-medium text-page">
                      +{item.assigned_users.length - 3}
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </Draggable>
  )
}