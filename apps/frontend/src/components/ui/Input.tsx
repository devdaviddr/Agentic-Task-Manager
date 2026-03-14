import { forwardRef } from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', error, ...props }, ref) => {
    const baseClasses = 'input'
    const classes = `${baseClasses} ${error ? 'input-error' : ''} ${className}`

    return (
      <div>
        <input ref={ref} className={classes} {...props} />
        {error && <p className="field-error">{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input