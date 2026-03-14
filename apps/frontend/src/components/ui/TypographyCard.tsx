interface TypographyCardProps {
  title: string
  sample: string
  className: string
}

export default function TypographyCard({ title, className, sample }: TypographyCardProps) {
  return (
    <div className="rounded-card p-6 bg-panel border border-border">
      <div className="text-sm text-muted mb-2">{title}</div>
      <div className={className}>{sample}</div>
    </div>
  )
}
