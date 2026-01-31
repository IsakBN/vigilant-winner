import { SlidersIcon } from '../icons'

function GlobeIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function DeviceIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  )
}

function ChartIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  )
}

function PauseIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

export function StagedRollouts() {
  return (
    <section className="container-main py-16 bg-warm-green/10 rounded-tl-[6rem] rounded-br-3xl my-6 shadow-lg">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-warm-green/30 text-green-700 text-sm font-bold px-4 py-2 rounded-full mb-6">
            <SlidersIcon className="w-5 h-5" />
            STAGED ROLLOUTS
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-text-dark mb-4">
            Deploy With Confidence
          </h2>
          <p className="text-xl text-text-light max-w-2xl mx-auto">
            Roll out updates to the right users at the right time. Start small, monitor, then go big.
          </p>
        </div>

        {/* Main content */}
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Rollout visualization */}
          <div className="bg-cream-bg rounded-3xl shadow-xl border border-warm-green/30 overflow-hidden">
            <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 bg-gray-100 rounded-lg px-4 py-1.5 text-sm text-text-light">
                Release v2.4.1 - Staged Rollout
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Rollout progress */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-text-dark">Rollout Progress</h3>
                  <span className="text-sm bg-warm-green/20 text-green-700 px-3 py-1 rounded-full font-medium">
                    Active
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1 h-3 bg-green-500 rounded-full" />
                  <div className="flex-1 h-3 bg-green-500 rounded-full" />
                  <div className="flex-1 h-3 bg-green-500/50 rounded-full animate-pulse" />
                  <div className="flex-1 h-3 bg-gray-200 rounded-full" />
                </div>

                <div className="flex justify-between text-sm text-text-light">
                  <span>1%</span>
                  <span>10%</span>
                  <span className="text-green-600 font-bold">25%</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Target segments */}
              <div className="bg-pastel-blue/10 rounded-xl p-4 space-y-3">
                <div className="text-sm font-medium text-text-dark">Current Target</div>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-white px-3 py-1.5 rounded-lg text-sm border border-pastel-blue/30 flex items-center gap-2">
                    <DeviceIcon className="w-4 h-4 text-blue-500" />
                    iOS Only
                  </span>
                  <span className="bg-white px-3 py-1.5 rounded-lg text-sm border border-warm-green/30 flex items-center gap-2">
                    <GlobeIcon className="w-4 h-4 text-green-500" />
                    US Timezone
                  </span>
                  <span className="bg-white px-3 py-1.5 rounded-lg text-sm border border-soft-yellow/30 flex items-center gap-2">
                    <ChartIcon className="w-4 h-4 text-amber-500" />
                    25% of users
                  </span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-xl p-4 text-center border border-gray-100">
                  <div className="text-2xl font-bold text-bright-accent">12.4k</div>
                  <div className="text-xs text-text-light">Users Updated</div>
                </div>
                <div className="bg-white rounded-xl p-4 text-center border border-gray-100">
                  <div className="text-2xl font-bold text-green-600">0</div>
                  <div className="text-xs text-text-light">Crashes</div>
                </div>
                <div className="bg-white rounded-xl p-4 text-center border border-gray-100">
                  <div className="text-2xl font-bold text-text-dark">99.8%</div>
                  <div className="text-xs text-text-light">Success Rate</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button className="flex-1 bg-bright-accent text-white font-bold py-3 rounded-xl hover:shadow-lg transition-all">
                  Expand to 50%
                </button>
                <button className="px-4 py-3 border-2 border-red-200 text-red-600 rounded-xl font-bold hover:bg-red-50 transition-all flex items-center gap-2">
                  <PauseIcon className="w-4 h-4" />
                  Pause
                </button>
              </div>
            </div>
          </div>

          {/* Right: Features list */}
          <div className="space-y-6">
            <FeatureItem
              icon={<DeviceIcon className="w-6 h-6 text-blue-600" />}
              iconBg="bg-pastel-blue/30"
              title="Device Targeting"
              description="Roll out to specific device types first. iOS-only, Android-only, or specific models. Test on older devices before going wide."
            />
            <FeatureItem
              icon={<GlobeIcon className="w-6 h-6 text-green-600" />}
              iconBg="bg-warm-green/30"
              title="Timezone Targeting"
              description="Release during business hours in each region. Deploy to Europe in the morning, US in the afternoon."
            />
            <FeatureItem
              icon={<ChartIcon className="w-6 h-6 text-amber-600" />}
              iconBg="bg-soft-yellow/50"
              title="Percentage Rollouts"
              description="Start with 1% of users. Monitor crashes and metrics. Then 10%, 25%, 50%, 100%. Gradual confidence at every step."
            />
            <FeatureItem
              icon={<PauseIcon className="w-6 h-6 text-red-500" />}
              iconBg="bg-red-100"
              title="Instant Pause"
              description="See something wrong? Pause the rollout immediately. No new users get the update until you're ready."
            />
          </div>
        </div>
      </div>
    </section>
  )
}

type FeatureItemProps = {
  icon: React.ReactNode
  iconBg: string
  title: string
  description: string
}

function FeatureItem({ icon, iconBg, title, description }: FeatureItemProps) {
  return (
    <div className="flex gap-4">
      <div className={`w-12 h-12 ${iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
        {icon}
      </div>
      <div>
        <h3 className="text-xl font-bold mb-1 text-text-dark">{title}</h3>
        <p className="text-base text-text-light leading-relaxed">{description}</p>
      </div>
    </div>
  )
}
