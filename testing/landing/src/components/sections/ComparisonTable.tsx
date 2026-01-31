import { CheckIcon, XIcon } from '../icons'

function CrownIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
    </svg>
  )
}

export function ComparisonTable() {
  return (
    <section className="container-main py-16 bg-pastel-blue/20 rounded-tl-[6rem] rounded-br-3xl my-6 shadow-lg">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-extrabold tracking-tight mb-3 text-text-dark">
          Why Teams Choose BundleNudge
        </h2>
        <p className="text-xl text-text-light">
          The features that matter, without the gotchas.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {/* BundleNudge - Highlighted */}
        <div className="bg-white rounded-2xl shadow-xl border-2 border-bright-accent overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 bg-bright-accent text-white text-center py-2 text-sm font-bold flex items-center justify-center gap-2">
            <CrownIcon className="w-4 h-4" />
            RECOMMENDED
          </div>
          <div className="pt-12 p-6">
            <h3 className="text-2xl font-bold text-bright-accent mb-1">BundleNudge</h3>
            <p className="text-text-light text-sm mb-6">Modern OTA for React Native</p>

            <div className="text-3xl font-black text-text-dark mb-6">
              $0 - $99<span className="text-base font-normal text-text-light">/mo</span>
            </div>

            <ul className="space-y-4">
              <ComparisonRow label="Works with any RN app" value={true} highlight />
              <ComparisonRow label="No Expo required" value={true} highlight />
              <ComparisonRow label="Predictable pricing" value={true} highlight />
              <ComparisonRow label="Auto-rollback on crash" value={true} highlight />
              <ComparisonRow label="A/B testing" value={true} highlight />
              <ComparisonRow label="Staged rollouts" value={true} highlight />
              <ComparisonRow label="Code signing" value={true} highlight />
            </ul>
          </div>
        </div>

        {/* EAS Update */}
        <div className="bg-white rounded-2xl shadow-lg border border-neutral-200 overflow-hidden">
          <div className="p-6">
            <h3 className="text-2xl font-bold text-text-dark mb-1">EAS Update</h3>
            <p className="text-text-light text-sm mb-6">Expo&apos;s OTA service</p>

            <div className="text-3xl font-black text-text-dark mb-6">
              $19+<span className="text-base font-normal text-text-light">/mo + overages</span>
            </div>

            <ul className="space-y-4">
              <ComparisonRow label="Works with any RN app" value={false} note="Expo only" />
              <ComparisonRow label="No Expo required" value={false} />
              <ComparisonRow label="Predictable pricing" value={false} note="MAU + bandwidth" />
              <ComparisonRow label="Auto-rollback on crash" value={false} />
              <ComparisonRow label="A/B testing" value={false} />
              <ComparisonRow label="Staged rollouts" value={true} />
              <ComparisonRow label="Code signing" value={true} />
            </ul>
          </div>
        </div>

        {/* CodePush */}
        <div className="bg-neutral-50 rounded-2xl shadow-lg border border-neutral-200 overflow-hidden opacity-75">
          <div className="p-6">
            <h3 className="text-2xl font-bold text-text-dark mb-1">CodePush</h3>
            <p className="text-red-500 text-sm font-medium mb-6">Deprecated March 2025</p>

            <div className="text-3xl font-black text-text-dark mb-6">
              <span className="line-through text-text-light">Free</span>
              <span className="text-red-500 text-base font-normal ml-2">Shut down</span>
            </div>

            <ul className="space-y-4">
              <ComparisonRow label="Works with any RN app" value={true} disabled />
              <ComparisonRow label="No Expo required" value={true} disabled />
              <ComparisonRow label="Predictable pricing" value={true} disabled />
              <ComparisonRow label="Auto-rollback on crash" value={true} disabled />
              <ComparisonRow label="A/B testing" value={false} disabled />
              <ComparisonRow label="Staged rollouts" value={true} disabled />
              <ComparisonRow label="Code signing" value={true} disabled />
            </ul>
          </div>
        </div>
      </div>

      <p className="text-center text-text-light mt-8 text-sm">
        Migrating from CodePush?{' '}
        <a href="/compare/codepush" className="text-bright-accent font-semibold hover:underline">
          See our migration guide →
        </a>
      </p>
    </section>
  )
}

type ComparisonRowProps = {
  label: string
  value: boolean
  highlight?: boolean
  note?: string
  disabled?: boolean
}

function ComparisonRow({ label, value, highlight, note, disabled }: ComparisonRowProps) {
  const textClass = disabled ? 'text-text-light/50' : 'text-text-dark'

  return (
    <li className="flex items-center justify-between gap-2">
      <span className={`text-sm ${textClass}`}>{label}</span>
      <div className="flex items-center gap-1">
        {note && <span className="text-xs text-text-light">{note}</span>}
        {value ? (
          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${highlight ? 'bg-green-100' : 'bg-gray-100'}`}>
            <CheckIcon className={`w-4 h-4 ${highlight ? 'text-green-600' : disabled ? 'text-gray-400' : 'text-green-600'}`} />
          </div>
        ) : (
          <div className="w-6 h-6 bg-red-50 rounded-full flex items-center justify-center">
            <XIcon className="w-4 h-4 text-red-400" />
          </div>
        )}
      </div>
    </li>
  )
}
