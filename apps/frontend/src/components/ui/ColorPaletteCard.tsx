interface ColorPaletteCardProps {
  name: string
  hex: string
  className?: string
}

const hexToRgb = (hex: string) => {
  const normalized = hex.replace('#', '')
  const parsed = normalized.length === 3
    ? normalized.split('').map(ch => parseInt(ch + ch, 16))
    : [normalized.slice(0, 2), normalized.slice(2, 4), normalized.slice(4, 6)].map(x => parseInt(x, 16))

  return { r: parsed[0], g: parsed[1], b: parsed[2] }
}

const mix = (a: number, b: number, t: number) => Math.round(a + (b - a) * t)

const blend = (from: { r: number; g: number; b: number }, to: { r: number; g: number; b: number }, t: number) =>
  `rgb(${mix(from.r, to.r, t)}, ${mix(from.g, to.g, t)}, ${mix(from.b, to.b, t)})`

const paletteSteps = (hex: string) => {
  const base = hexToRgb(hex)
  const black = { r: 0, g: 0, b: 0 }
  const white = { r: 255, g: 255, b: 255 }

  const darkSteps = Array.from({ length: 5 }).map((_, idx) => blend(black, base, (idx + 1) / 5))
  const lightSteps = Array.from({ length: 5 }).map((_, idx) => blend(base, white, (idx + 1) / 5))

  return [...darkSteps, `rgb(${base.r}, ${base.g}, ${base.b})`, ...lightSteps]
}

export default function ColorPaletteCard({ name, hex, className = '' }: ColorPaletteCardProps) {
  const palette = paletteSteps(hex)

  return (
    <div className={`rounded-card overflow-hidden border border-border ${className}`}>
      <div className="p-3" style={{ backgroundColor: hex }}>
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-heading">{name}</div>
          <div className="text-xs text-muted">{hex}</div>
        </div>
      </div>

      <div className="flex h-12">
        {palette.map((color, idx) => (
          <div key={idx} className="flex-1" style={{ backgroundColor: color }} />
        ))}
      </div>
    </div>
  )
}
