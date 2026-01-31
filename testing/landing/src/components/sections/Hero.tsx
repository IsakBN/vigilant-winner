import { CheckIcon, CloudDownloadIcon } from '../icons'
import { APP_URL } from '@/lib/constants'

export function Hero() {
  return (
    <section className="container-main pt-10 pb-16 lg:pt-12 lg:pb-20 bg-pastel-blue/30 rounded-bl-3xl rounded-br-[8rem] mt-4 mb-6 shadow-lg">
      <div className="grid lg:grid-cols-2 gap-10 items-center">
        <div className="flex flex-col gap-6 lg:order-1">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 bg-warm-green/30 text-green-700 text-sm font-bold px-4 py-2 rounded-full">
              <CloudDownloadIcon className="w-4 h-4" />
              Ship updates instantly
            </div>
            <h1 className="text-5xl lg:text-6xl font-black leading-tight tracking-tighter text-bright-accent">
              Push code.<br /><span className="text-text-dark">Update phones.</span>
            </h1>
            <p className="text-xl text-text-light max-w-xl leading-relaxed">
              OTA updates for React Native. Git push triggers deploy. No App Store review.
              <strong className="text-text-dark"> Your users get updates in seconds.</strong>
            </p>
            <p className="text-base text-text-light">
              <span className="font-semibold text-text-dark">Free up to 1,000 updates/month.</span>
              {' '}Pro from $29.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <a
              href={`${APP_URL}/sign-up`}
              className="bg-bright-accent text-white text-lg font-bold px-10 py-5 rounded-xl shadow-md hover:shadow-lg hover:shadow-bright-accent/20 transition-all"
            >
              Get Started Free
            </a>
            <div className="flex items-center gap-3 px-6 py-5 text-base font-semibold text-text-light bg-cream-bg rounded-xl border border-pastel-blue/40 font-mono">
              <span className="text-text-light">$</span> npm install @bundlenudge/sdk
            </div>
          </div>
        </div>

        <div className="relative lg:order-2">
          <DashboardPreview />
        </div>
      </div>

      <div className="mt-8 text-center">
        <p className="text-sm text-text-light flex items-center justify-center gap-3 flex-wrap">
          <span className="inline-flex items-center gap-1.5">
            <CheckIcon className="w-4 h-4 text-warm-green" />
            No App Store delays
          </span>
          <span className="text-text-light/30">-</span>
          <span className="inline-flex items-center gap-1.5">
            <CheckIcon className="w-4 h-4 text-warm-green" />
            Auto-rollback on errors
          </span>
          <span className="text-text-light/30">-</span>
          <span className="inline-flex items-center gap-1.5">
            <CheckIcon className="w-4 h-4 text-warm-green" />
            Free tier available
          </span>
        </p>
      </div>
    </section>
  )
}

function DashboardPreview() {
  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5 flex items-center gap-3">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
        </div>
        <div className="flex-1 bg-white rounded px-3 py-1 text-xs text-text-light border border-gray-200">
          app.bundlenudge.com
        </div>
      </div>

      <div className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-bright-accent/10 rounded-lg flex items-center justify-center">
              <CloudDownloadIcon className="w-4 h-4 text-bright-accent" />
            </div>
            <div>
              <div className="font-bold text-text-dark text-sm">Release v2.4.1</div>
              <div className="text-xs text-text-light">Deployed 12 seconds ago</div>
            </div>
          </div>
          <span className="px-2.5 py-1 bg-warm-green/20 text-green-700 text-xs font-bold rounded-full">
            Live
          </span>
        </div>

        <div className="bg-gray-50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-text-dark">Rollout Progress</span>
            <span className="text-xs font-bold text-bright-accent">100%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-bright-accent rounded-full w-full" />
          </div>
          <div className="flex items-center justify-between mt-2 text-[10px] text-text-light">
            <span>1,847 devices updated</span>
            <span className="text-green-600 font-medium">0 errors</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-medium text-text-dark">Live Activity</div>
          <div className="space-y-1.5">
            <ActivityRow device="iPhone 15 Pro" delay="0s" />
            <ActivityRow device="Pixel 8" delay="0.3s" />
            <ActivityRow device="Galaxy S24" delay="0.6s" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-100">
          <StatBlock value="3.2s" label="deploy time" color="text-bright-accent" />
          <StatBlock value="100%" label="success rate" color="text-green-600" />
          <StatBlock value="0" label="rollbacks" color="text-text-dark" />
        </div>
      </div>
    </div>
  )
}

function ActivityRow({ device, delay }: { device: string; delay: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <div
        className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"
        style={{ animationDelay: delay }}
      />
      <span className="text-text-light">{device}</span>
      <span className="text-green-600 font-medium ml-auto">updated</span>
    </div>
  )
}

function StatBlock({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <div className="text-center">
      <div className={`text-lg font-black ${color}`}>{value}</div>
      <div className="text-[10px] text-text-light">{label}</div>
    </div>
  )
}
