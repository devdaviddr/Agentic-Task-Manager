interface SpinnerProps {
  size?: number
}

export default function Spinner({ size = 10 }: SpinnerProps) {
  return (
    <div
      className="rounded-full border-4 border-white/15 border-t-primary animate-spin"
      style={{ width: size, height: size }}
    />
  )
}
