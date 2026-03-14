import PageLayout from '../components/PageLayout'
import PageHeader from '../components/PageHeader'
import Button from '../components/ui/Button'
import IconButton from '../components/ui/IconButton'
import Input from '../components/ui/Input'
import { SparklesIcon, Squares2X2Icon, TagIcon, TrashIcon } from '@heroicons/react/24/outline'

export default function Ux() {
  const tokens = {
    page: '#0D1220',
    panel: '#1A2438',
    primary: '#7DD3FC',
    secondary: '#88B4CC',
    tertiary: '#C8A0F0',
    danger: '#EF4444',
    border: '#3D4F75'
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

  const ColorCard = ({ name, hex, className = '' }: { name: string; hex: string; className?: string }) => {
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

  const TypographyCard = ({ title, className, sample }: { title: string; className: string; sample: string }) => (
    <div className="rounded-card p-6 bg-panel border border-border">
      <div className="text-sm text-muted mb-2">{title}</div>
      <div className={className}>{sample}</div>
    </div>
  )

  const Spinner = ({ size = 10 }: { size?: number }) => (
    <div
      className="rounded-full border-4 border-white/15 border-t-primary animate-spin"
      style={{ width: size, height: size }}
    />
  )

  const SkeletonBar = ({ width, className = '' }: { width: string; className?: string }) => (
    <div
      className={`h-3 rounded-full bg-white/15 animate-pulse shadow-sm ${width} ${className}`}
    />
  )

  const SkeletonCard = () => (
    <div className="rounded-card p-4 bg-panel/70 border border-border">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-full bg-white/15 animate-pulse shadow-sm" />
        <SkeletonBar width="w-1/2" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, idx) => (
          <div key={idx} className="flex items-center justify-between gap-3">
            <SkeletonBar width="w-2/3" />
            <SkeletonBar width="w-1/4" />
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <PageLayout background="bg-page">
      <div className="px-6 py-6">
        <PageHeader title="Design / UX Showcase" />
      </div>

      <div className="px-6 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Color palette */}
          <div className="space-y-4">
            <ColorCard name="Primary" hex={tokens.primary} />
            <ColorCard name="Secondary" hex={tokens.secondary} />
            <ColorCard name="Tertiary" hex={tokens.tertiary} />
            <ColorCard name="Neutral" hex={tokens.panel} />
            <ColorCard name="Page" hex={tokens.page} />
          </div>

          {/* Center: Typography + Components */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TypographyCard title="Display" className="text-6xl font-extrabold text-heading" sample={"Aa"} />
              <div className="rounded-card p-6 bg-panel border border-border flex flex-col justify-between">
                <div className="mb-4">
                  <div className="mb-3">
                    <Button variant="primary" className="mr-3">Primary</Button>
                    <Button variant="secondary" className="mr-3">Secondary</Button>
                    <Button variant="inverted" className="mr-3">Inverted</Button>
                    <Button variant="icon">⚙</Button>
                  </div>
                  <div className="w-full max-w-sm">
                    <Input placeholder="Search" />
                  </div>
                </div>
                <div className="mt-6">
                  <div className="text-sm text-muted mb-2">Icon buttons</div>
                  <div className="flex items-center gap-3">
                    <IconButton icon={SparklesIcon} className="bg-primary/20 text-primary hover:bg-primary/30" />
                    <IconButton icon={Squares2X2Icon} className="bg-secondary/20 text-secondary hover:bg-secondary/30" />
                    <IconButton icon={TagIcon} className="bg-tertiary/20 text-tertiary hover:bg-tertiary/30" />
                    <IconButton icon={TrashIcon} className="bg-danger text-page hover:bg-danger/90" />
                  </div>
                </div>
                <div className="mt-4 flex gap-3">
                  <div className="rounded-full bg-panel/40 px-3 py-2 text-body">Home</div>
                  <div className="rounded-full bg-panel/40 px-3 py-2 text-muted">Search</div>
                  <div className="rounded-full bg-panel/40 px-3 py-2 text-muted">Profile</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <TypographyCard title="Display" className="text-6xl font-extrabold text-heading" sample={'Aa'} />
              <TypographyCard title="Heading" className="text-2xl font-semibold text-heading" sample={'The quick brown fox'} />
              <TypographyCard title="Subheading" className="text-xl font-semibold text-heading" sample={'A nice subtitle'} />
              <TypographyCard title="Body" className="text-base text-body" sample={'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus.'} />
              <TypographyCard title="Label" className="text-sm font-medium text-muted" sample={'Label / UI metadata'} />
              <TypographyCard title="Caption" className="text-xs text-muted" sample={'Caption / helper text'} />
            </div>

            <div className="rounded-card p-6 bg-panel border border-border">
              <div className="text-sm text-muted mb-2">Form / Controls</div>
              <div className="space-y-3">
                <div className="max-w-md">
                  <Input placeholder="Input example" />
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="primary">Primary Action</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="danger">Danger</Button>
                </div>
              </div>
            </div>

          </div>

          {/* Right: Small components */}
          <div className="space-y-6">
            <div className="rounded-card p-6 bg-panel border border-border">
              <div className="text-sm text-muted mb-2">Badges</div>
              <div className="flex items-center gap-2">
                <span className="badge">Default</span>
                <span className="badge badge-primary">Primary</span>
                <span className="badge badge-secondary">Secondary</span>
                <span className="badge badge-tertiary">Tertiary</span>
                <span className="badge badge-danger">Danger</span>
              </div>
            </div>

            <div className="rounded-card p-6 bg-panel border border-border">
              <div className="text-sm text-muted mb-2">Inputs / Chips</div>
              <div className="space-y-3">
                <Input placeholder="Search tags..." />
                <div className="flex gap-2">
                  <div className="px-3 py-1 rounded-full bg-panel/10 text-primary">Tag</div>
                  <div className="px-3 py-1 rounded-full bg-panel/10 text-secondary">Label</div>
                </div>
              </div>
            </div>

            <div className="rounded-card p-6 bg-panel border border-border">
              <div className="text-sm text-muted mb-2">Loading / Skeleton</div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Spinner size={28} />
                  <span className="text-body">Loading spinner</span>
                </div>
                <SkeletonCard />
              </div>
            </div>

            <div className="rounded-card p-6 bg-panel border border-border">
              <div className="text-sm text-muted mb-2">Colors (hex)</div>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded bg-panel/20">
                  <div className="text-sm text-muted">Primary</div>
                  <div className="font-medium text-heading">{tokens.primary}</div>
                </div>
                <div className="p-3 rounded bg-panel/20">
                  <div className="text-sm text-muted">Secondary</div>
                  <div className="font-medium text-heading">{tokens.secondary}</div>
                </div>
                <div className="p-3 rounded bg-panel/20">
                  <div className="text-sm text-muted">Tertiary</div>
                  <div className="font-medium text-heading">{tokens.tertiary}</div>
                </div>
                <div className="p-3 rounded bg-panel/20">
                  <div className="text-sm text-muted">Neutral</div>
                  <div className="font-medium text-heading">{tokens.panel}</div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </PageLayout>
  )
}
