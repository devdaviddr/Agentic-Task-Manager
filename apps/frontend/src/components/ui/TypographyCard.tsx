import Typography from './Typography'
import type { TypographyVariant } from './Typography'

interface TypographyCardProps {
  title: string
  sample: string
  variant: TypographyVariant
  className?: string
}

export default function TypographyCard({ title, sample, variant, className = '' }: TypographyCardProps) {
  return (
    <div className="rounded-card p-6 bg-panel border border-border">
      <div className="text-sm text-muted mb-2">{title}</div>
      <Typography variant={variant} className={className}>{sample}</Typography>
    </div>
  )
}
