import type { ReactNode } from 'react'

export type TypographyVariant =
  | 'display'
  | 'heading'
  | 'subheading'
  | 'body'
  | 'label'
  | 'caption'

interface TypographyProps {
  variant?: TypographyVariant
  className?: string
  children: ReactNode
}

const variantClasses: Record<TypographyVariant, string> = {
  display: 'text-6xl font-extrabold text-heading',
  heading: 'text-2xl font-semibold text-heading',
  subheading: 'text-xl font-semibold text-heading',
  body: 'text-base text-body',
  label: 'text-sm font-medium text-muted',
  caption: 'text-xs text-muted'
}

export default function Typography({ variant = 'body', className = '', children }: TypographyProps) {
  const classes = `${variantClasses[variant]} ${className}`.trim()
  return <div className={classes}>{children}</div>
}
