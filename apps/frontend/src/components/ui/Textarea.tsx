import { forwardRef } from 'react'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', error, ...props }, ref) => {
    const baseClasses = 'textarea'
    const classes = `${baseClasses} ${error ? 'textarea-error' : ''} ${className}`

    return (
      <div>
        <textarea ref={ref} className={classes} {...props} />
        {error && <p className="field-error">{error}</p>}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'

export default Textarea