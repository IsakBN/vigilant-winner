import { ClockIcon, LightningIcon } from "../icons"

export function Comparison() {
  return (
    <section className="container-fluid py-24 bg-warm-green/20 rounded-tl-[6rem] rounded-br-3xl my-8 shadow-xl shadow-warm-green/10">
      <div className="text-center mb-16 space-y-4">
        <h2 className="text-5xl font-extrabold tracking-tight text-text-dark">
          Two Ways to Ship
        </h2>
        <p className="text-xl text-text-light max-w-3xl mx-auto">
          One takes days. One takes seconds.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 items-stretch">
        {/* The Old Way */}
        <ComparisonCard variant="old">
          <ComparisonHeader
            icon={<ClockIcon className="w-8 h-8" />}
            title="The Waiting Game"
            variant="old"
          />
          <ComparisonList variant="old">
            <ComparisonItem step={1} variant="old">
              Submit to App Store and wait <b className="text-red-600">1-3 days</b> for review approval
            </ComparisonItem>
            <ComparisonItem step={2} variant="old">
              Users stuck on different versions, bugs linger, features fragmented
            </ComparisonItem>
            <ComparisonItem step={3} variant="old">
              Each fix requires a full build, upload, and review cycle
            </ComparisonItem>
          </ComparisonList>
          <ComparisonFooter variant="old">
            <div className="flex items-center gap-3 text-red-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-bold">Total time: 1-7 days per update</span>
            </div>
          </ComparisonFooter>
        </ComparisonCard>

        {/* The BundleNudge Way */}
        <ComparisonCard variant="new">
          <div className="absolute top-0 right-0 bg-bright-accent px-5 py-2 text-sm text-white font-bold uppercase tracking-wider rounded-bl-xl shadow-md">
            Recommended
          </div>
          <ComparisonHeader
            icon={<LightningIcon className="w-8 h-8" />}
            title="The BundleNudge Way"
            variant="new"
          />
          <ComparisonList variant="new">
            <ComparisonItem step={1} variant="new">
              Push JavaScript and asset changes directly to users in <b className="text-bright-accent">seconds</b>
            </ComparisonItem>
            <ComparisonItem step={2} variant="new">
              Everyone on the same version, instantly. No fragmentation.
            </ComparisonItem>
            <ComparisonItem step={3} variant="new">
              Connect GitHub, push to main, updates deploy automatically
            </ComparisonItem>
          </ComparisonList>
          <ComparisonFooter variant="new">
            <TerminalDemo />
          </ComparisonFooter>
        </ComparisonCard>
      </div>
    </section>
  )
}

type Variant = 'old' | 'new'

function ComparisonCard({ children, variant }: { children: React.ReactNode; variant: Variant }) {
  const isNew = variant === 'new'
  const baseClass = isNew
    ? 'bg-bright-accent/10 border-2 border-bright-accent shadow-xl'
    : 'bg-cream-bg border border-red-300/50 shadow-lg'
  const gradientClass = isNew
    ? 'bg-gradient-to-br from-pastel-blue/30 to-soft-yellow/10'
    : 'bg-gradient-to-br from-red-100/30 to-red-50/10'

  return (
    <div className={`${baseClass} p-10 rounded-2xl relative overflow-hidden`}>
      <div className={`absolute inset-0 ${gradientClass} rounded-2xl`} />
      <div className="relative z-10 h-full flex flex-col">
        {children}
      </div>
    </div>
  )
}

function ComparisonHeader({ icon, title, variant }: { icon: React.ReactNode; title: string; variant: Variant }) {
  const isNew = variant === 'new'
  const iconClass = isNew
    ? 'text-bright-accent bg-pastel-blue/50'
    : 'text-red-500 bg-red-100'
  const titleClass = isNew ? 'text-bright-accent' : 'text-red-700'

  return (
    <div className="flex items-center gap-4 mb-8">
      <span className={`${iconClass} p-4 rounded-full text-3xl shadow-md flex items-center justify-center`}>
        {icon}
      </span>
      <h3 className={`text-3xl font-extrabold ${titleClass}`}>{title}</h3>
    </div>
  )
}

function ComparisonList({ children, variant }: { children: React.ReactNode; variant: Variant }) {
  const textClass = variant === 'new' ? 'text-text-dark font-medium' : 'text-text-light'
  return <ul className={`space-y-5 text-lg ${textClass} flex-1`}>{children}</ul>
}

function ComparisonItem({ children, step, variant }: { children: React.ReactNode; step: number; variant: Variant }) {
  const stepClass = variant === 'new' ? 'text-bright-accent' : 'text-red-400'
  const stepLabel = step.toString().padStart(2, '0')

  return (
    <li className="flex gap-4 items-start">
      <span className={`text-xl ${stepClass} font-bold mt-1`}>{stepLabel}</span>
      <span>{children}</span>
    </li>
  )
}

function ComparisonFooter({ children, variant }: { children: React.ReactNode; variant: Variant }) {
  const borderClass = variant === 'new' ? 'border-bright-accent/30' : 'border-red-200'
  return <div className={`mt-8 pt-6 border-t ${borderClass}`}>{children}</div>
}

function TerminalDemo() {
  return (
    <div className="bg-text-dark rounded-xl overflow-hidden font-mono text-sm text-white">
      {/* Terminal header */}
      <div className="flex items-center gap-2 px-4 py-2 bg-text-dark border-b border-white/10">
        <div className="w-3 h-3 rounded-full bg-red-500" />
        <div className="w-3 h-3 rounded-full bg-yellow-500" />
        <div className="w-3 h-3 rounded-full bg-green-500" />
        <span className="text-white/40 text-xs ml-2">terminal</span>
      </div>
      {/* Terminal content */}
      <div className="p-4 space-y-2">
        <div>
          <span className="text-warm-green">$</span>{" "}
          <span className="text-pastel-blue">git push</span>{" "}
          <span className="text-white/60">origin main</span>
        </div>
        <div className="text-white/50">Deploying to BundleNudge...</div>
        <div className="flex items-center gap-2 text-warm-green">
          <span>Done.</span>
          <span>Live in</span>
          <span className="text-2xl font-black">12s</span>
        </div>
      </div>
    </div>
  )
}
