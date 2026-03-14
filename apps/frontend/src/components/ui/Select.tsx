import { forwardRef } from 'react'
import { ChevronDownIcon } from '@heroicons/react/24/outline'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string
  children: React.ReactNode
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', error, children, ...props }, ref) => {
    const baseClasses = 'select'
    const classes = `${baseClasses} ${error ? 'select-error' : ''} ${className}`

    return (
      <div className="relative">
        <select ref={ref} className={classes} {...props}>
          {children}
        </select>
        <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
        {error && <p className="field-error">{error}</p>}
      </div>
    )
  }
)

Select.displayName = 'Select'

export default Select