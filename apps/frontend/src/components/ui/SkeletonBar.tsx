interface SkeletonBarProps {
  width: string
  bgClass?: string
  className?: string
}

export default function SkeletonBar({ width, bgClass = 'bg-white/15', className = '' }: SkeletonBarProps) {
  return <div className={`h-3 rounded-full animate-pulse shadow-sm ${bgClass} ${width} ${className}`} />
}
