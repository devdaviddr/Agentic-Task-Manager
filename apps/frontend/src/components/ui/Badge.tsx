import type { ReactNode } from 'react'

export type BadgeVariant = 'default' | 'primary' | 'secondary' | 'tertiary' | 'danger'

interface BadgeProps {
  variant?: BadgeVariant
  className?: string
  children: ReactNode
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'badge',
  primary: 'badge badge-primary',
  secondary: 'badge badge-secondary',
  tertiary: 'badge badge-tertiary',
  danger: 'badge badge-danger'
}

export default function Badge({ variant = 'default', className = '', children }: BadgeProps) {
  const classes = `${variantClasses[variant]} ${className}`.trim()
  return <span className={classes}>{children}</span>
}
