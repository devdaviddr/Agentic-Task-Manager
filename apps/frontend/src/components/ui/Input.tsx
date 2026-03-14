import { forwardRef } from 'react'
import type { ReactNode } from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
  prefixNode?: ReactNode
  suffixNode?: ReactNode
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', error, prefixNode, suffixNode, ...props }, ref) => {
    const baseClasses = 'input'
    const prefixOffset = prefixNode ? 'pl-10' : ''
    const suffixOffset = suffixNode ? 'pr-10' : ''
    const classes = `${baseClasses} ${prefixOffset} ${suffixOffset} ${error ? 'input-error' : ''} ${className}`

    return (
      <div className="relative">
        {prefixNode && (
          <div className="absolute left-2 top-1/2 -translate-y-1/2">
            {prefixNode}
          </div>
        )}
        <input ref={ref} className={classes} {...props} />
        {suffixNode && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            {suffixNode}
          </div>
        )}
        {error && <p className="field-error">{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input