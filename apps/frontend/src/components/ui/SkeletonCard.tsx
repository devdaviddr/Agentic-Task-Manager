import SkeletonBar from './SkeletonBar'

interface SkeletonCardProps {
  bgClass?: string
  barClass?: string
}

export default function SkeletonCard({ bgClass = 'bg-white/15', barClass = '' }: SkeletonCardProps) {
  return (
    <div className="rounded-card p-4 bg-panel/70 border border-border">
      <div className="flex items-center gap-3 mb-4">
        <div className={`h-10 w-10 rounded-full animate-pulse shadow-sm ${bgClass}`} />
        <SkeletonBar width="w-1/2" bgClass={bgClass} className={barClass} />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, idx) => (
          <div key={idx} className="flex items-center justify-between gap-3">
            <SkeletonBar width="w-2/3" bgClass={bgClass} className={barClass} />
            <SkeletonBar width="w-1/4" bgClass={bgClass} className={barClass} />
          </div>
        ))}
      </div>
    </div>
  )
}
