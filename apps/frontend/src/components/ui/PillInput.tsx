import { forwardRef } from 'react'

interface Pill {
  id: number
  name: string
  removable?: boolean
}

interface PillInputProps {
  pills: Pill[]
  value: string
  onChange: (value: string) => void
  onPillRemove: (id: number) => void
  placeholder: string
  onFocus?: () => void
  onBlur?: () => void
  onKeyDown?: (e: React.KeyboardEvent) => void
}

const PillInput = forwardRef<HTMLDivElement, PillInputProps>(
  ({ pills, value, onChange, onPillRemove, placeholder, onFocus, onBlur, onKeyDown }, ref) => {
    return (
      <div
        ref={ref}
        className="relative flex items-center flex-wrap gap-1 w-full px-3 py-2 border border-border rounded-md bg-panel focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 focus-within:ring-offset-page min-h-[2.5rem]"
        onFocus={onFocus}
        onBlur={onBlur}
      >
        {pills.map(pill => (
          <span
            key={pill.id}
            className="inline-flex items-center text-xs px-2 py-1 rounded-full bg-panel/10 text-body"
          >
            {pill.name}
            {pill.removable && (
              <button
                type="button"
                onClick={() => onPillRemove(pill.id)}
                className="ml-1 text-secondary hover:text-primary"
              >
                ×
              </button>
            )}
          </span>
        ))}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={pills.length === 0 ? placeholder : ''}
          className="flex-1 min-w-0 outline-none bg-transparent text-body placeholder:text-muted"
        />
      </div>
    )
  }
)

PillInput.displayName = 'PillInput'

export default PillInput