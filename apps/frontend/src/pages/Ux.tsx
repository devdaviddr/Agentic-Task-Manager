import PageLayout from '../components/PageLayout'
import PageHeader from '../components/PageHeader'
import Button from '../components/ui/Button'
import IconButton from '../components/ui/IconButton'
import Input from '../components/ui/Input'
import ColorPaletteCard from '../components/ui/ColorPaletteCard'
import FilteredDropdown from '../components/ui/FilteredDropdown'
import TypographyCard from '../components/ui/TypographyCard'
import Spinner from '../components/ui/Spinner'
import SkeletonCard from '../components/ui/SkeletonCard'
import { MagnifyingGlassIcon, SparklesIcon, Squares2X2Icon, TagIcon, TrashIcon } from '@heroicons/react/24/outline'

const tokens = {
  page: '#0D1220',
  panel: '#1A2438',
  primary: '#7DD3FC',
  secondary: '#88B4CC',
  tertiary: '#C8A0F0',
  danger: '#EF4444',
  border: '#3D4F75'
}

export default function Ux() {

  return (
    <PageLayout background="bg-page">
      <div className="px-6 py-6">
        <PageHeader title="Design / UX Showcase" />
      </div>

      <div className="px-6 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Color palette */}
          <div className="space-y-4">
            <ColorPaletteCard name="Primary" hex={tokens.primary} />
            <ColorPaletteCard name="Secondary" hex={tokens.secondary} />
            <ColorPaletteCard name="Tertiary" hex={tokens.tertiary} />
            <ColorPaletteCard name="Neutral" hex={tokens.panel} />
            <ColorPaletteCard name="Page" hex={tokens.page} />
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
                    <Input
                      placeholder="Search"
                      prefixNode={
                        <button
                          type="button"
                          className="flex items-center justify-center w-8 h-8 text-muted hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-page rounded-full"
                          onClick={() => {
                            /* no-op; demo only */
                          }}
                        >
                          <MagnifyingGlassIcon className="w-4 h-4" />
                        </button>
                      }
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <div className="text-sm text-muted mb-2">Filter dropdown</div>
                  <FilteredDropdown
                    options={[
                      { label: 'First option', value: '1' },
                      { label: 'Second option', value: '2' },
                      { label: 'Third option', value: '3' },
                      { label: 'Fourth option', value: '4' },
                      { label: 'Fifth option', value: '5' }
                    ]}
                    placeholder="Filter and select..."
                    className="max-w-sm"
                    onChange={() => {
                      /* demo only */
                    }}
                  />
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
                <div className="space-y-3">
                  <SkeletonCard bgClass="bg-primary/20" />
                  <SkeletonCard bgClass="bg-secondary/20" />
                  <SkeletonCard bgClass="bg-tertiary/20" />
                  <SkeletonCard bgClass="bg-panel/20" />
                </div>
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
