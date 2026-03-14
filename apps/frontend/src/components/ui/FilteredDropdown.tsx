import { useEffect, useMemo, useRef, useState } from 'react'

interface Option {
  value: string
  label: string
}

interface FilteredDropdownProps {
  options: Option[]
  value?: string
  placeholder?: string
  label?: string
  onChange?: (value: string) => void
  className?: string
}

export default function FilteredDropdown({
  options,
  value,
  placeholder = 'Select...',
  label,
  onChange,
  className = ''
}: FilteredDropdownProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const rootRef = useRef<HTMLDivElement | null>(null)

  const selectedOption = options.find(opt => opt.value === value)

  const filteredOptions = useMemo(() => {
    if (!query) return options
    return options.filter(opt =>
      opt.label.toLowerCase().includes(query.trim().toLowerCase())
    )
  }, [options, query])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    window.addEventListener('mousedown', handleClickOutside)
    return () => window.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (option: Option) => {
    onChange?.(option.value)
    setOpen(false)
    setQuery('')
  }

  return (
    <div className={`relative ${className}`} ref={rootRef}>
      {label && <div className="text-sm font-medium text-heading mb-1">{label}</div>}
      <button
        type="button"
        onClick={() => setOpen(open => !open)}
        className="w-full flex items-center justify-between px-4 py-2 bg-panel border border-border rounded-md text-body hover:bg-panel/60 transition-colors"
      >
        <span className={`${selectedOption ? 'text-body' : 'text-muted'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg className="w-4 h-4 text-muted" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 011.08 1.04l-4.25 4.25a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-10 mt-2 w-full rounded-md border border-border bg-panel shadow-lg">
          <div className="px-3 py-2">
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              autoFocus
              className="w-full px-3 py-2 bg-panel border border-border rounded-md text-body placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-page"
              placeholder="Filter options..."
            />
          </div>
          <div className="max-h-56 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-sm text-muted">No options</div>
            ) : (
              filteredOptions.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelect(opt)}
                  className={`w-full text-left px-4 py-2 text-body hover:bg-panel/50 transition-colors ${
                    opt.value === value ? 'bg-panel/40' : ''
                  }`}
                >
                  {opt.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
