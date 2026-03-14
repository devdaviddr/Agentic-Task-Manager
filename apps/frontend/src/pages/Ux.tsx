import PageLayout from '../components/PageLayout'
import PageHeader from '../components/PageHeader'
import Button from '../components/ui/Button'
import IconButton from '../components/ui/IconButton'
import Input from '../components/ui/Input'
import ColorPaletteCard from '../components/ui/ColorPaletteCard'
import FilteredDropdown from '../components/ui/FilteredDropdown'
import TypographyCard from '../components/ui/TypographyCard'
import Badge from '../components/ui/Badge'
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

      <div className="px-6 pb-16">
        <div className="max-w-6xl mx-auto space-y-12">
          <section className="space-y-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-heading">Color palette</h2>
                <p className="text-sm text-muted">Primary and supporting theme colors, with tonal variants.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <ColorPaletteCard name="Primary" hex={tokens.primary} />
              <ColorPaletteCard name="Secondary" hex={tokens.secondary} />
              <ColorPaletteCard name="Tertiary" hex={tokens.tertiary} />
              <ColorPaletteCard name="Neutral" hex={tokens.panel} />
              <ColorPaletteCard name="Page" hex={tokens.page} />
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-heading">Typography</h2>
                <p className="text-sm text-muted">Headline, body, and UI typography styles.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <TypographyCard title="Display" variant="display" sample={'Aa'} />
              <TypographyCard title="Heading" variant="heading" sample={'The quick brown fox'} />
              <TypographyCard title="Subheading" variant="subheading" sample={'A nice subtitle'} />
              <TypographyCard title="Body" variant="body" sample={'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus.'} />
              <TypographyCard title="Label" variant="label" sample={'Label / UI metadata'} />
              <TypographyCard title="Caption" variant="caption" sample={'Caption / helper text'} />
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-heading">Components</h2>
                <p className="text-sm text-muted">Examples of buttons, inputs, dropdowns, badges, loaders, and more.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="rounded-card p-6 bg-panel border border-border space-y-6">
                <div>
                  <div className="text-sm text-muted mb-2">Buttons + Inputs</div>
                  <div className="flex flex-wrap gap-3">
                    <Button variant="primary">Primary</Button>
                    <Button variant="secondary">Secondary</Button>
                    <Button variant="inverted">Inverted</Button>
                    <Button variant="danger">Danger</Button>
                  </div>
                </div>

                <div>
                  <div className="text-sm text-muted mb-2">Search input</div>
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

                <div>
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
              </div>

              <div className="rounded-card p-6 bg-panel border border-border space-y-6">
                <div>
                  <div className="text-sm text-muted mb-2">Icon buttons</div>
                  <div className="flex items-center gap-3">
                    <IconButton icon={SparklesIcon} className="bg-primary/20 text-primary hover:bg-primary/30" />
                    <IconButton icon={Squares2X2Icon} className="bg-secondary/20 text-secondary hover:bg-secondary/30" />
                    <IconButton icon={TagIcon} className="bg-tertiary/20 text-tertiary hover:bg-tertiary/30" />
                    <IconButton icon={TrashIcon} className="bg-danger text-page hover:bg-danger/90" />
                  </div>
                </div>

                <div>
                  <div className="text-sm text-muted mb-2">Pills / Chips</div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="primary">Tag</Badge>
                    <Badge variant="secondary">Label</Badge>
                  </div>
                </div>
              </div>

              <div className="rounded-card p-6 bg-panel border border-border space-y-6">
                <div>
                  <div className="text-sm text-muted mb-2">Loading / skeleton</div>
                  <div className="flex items-center gap-3">
                    <Spinner size={28} />
                    <span className="text-body">Loading spinner</span>
                  </div>
                  <div className="space-y-3 mt-4">
                    <SkeletonCard bgClass="bg-primary/20" />
                    <SkeletonCard bgClass="bg-secondary/20" />
                    <SkeletonCard bgClass="bg-tertiary/20" />
                    <SkeletonCard bgClass="bg-panel/20" />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-heading">Tokens & references</h2>
                <p className="text-sm text-muted">Hex values and token lookup for quick access.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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

              <div className="rounded-card p-6 bg-panel border border-border">
                <div className="text-sm text-muted mb-2">Component tokens</div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-md bg-panel/10 p-3">
                    <div className="text-xs text-muted">Button</div>
                    <div className="text-sm text-heading">btn-primary</div>
                  </div>
                  <div className="rounded-md bg-panel/10 p-3">
                    <div className="text-xs text-muted">Input</div>
                    <div className="text-sm text-heading">input</div>
                  </div>
                  <div className="rounded-md bg-panel/10 p-3">
                    <div className="text-xs text-muted">Badge</div>
                    <div className="text-sm text-heading">badge</div>
                  </div>
                  <div className="rounded-md bg-panel/10 p-3">
                    <div className="text-xs text-muted">Card</div>
                    <div className="text-sm text-heading">card</div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </PageLayout>
  )
}
