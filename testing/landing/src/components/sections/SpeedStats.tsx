import { LightningIcon } from '../icons'

export function SpeedStats() {
  return (
    <section className="container-main py-20 my-6">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 bg-bright-accent/10 text-bright-accent text-sm font-bold px-4 py-2 rounded-full mb-6">
          <LightningIcon className="w-5 h-5" />
          SPEED
        </div>
        <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-text-dark mb-4">
          From Commit to Live
        </h2>
        <p className="text-xl text-text-light">
          While your competitors wait for App Store review, you&apos;re already shipping.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
        <StatCard
          value="3.2s"
          label="Average deploy time"
          sublabel="From push to available"
          color="text-bright-accent"
          bg="bg-pastel-blue/20"
        />
        <StatCard
          value="< 1 min"
          label="End-to-end"
          sublabel="Git push to user devices"
          color="text-green-600"
          bg="bg-warm-green/20"
        />
        <StatCard
          value="0"
          label="App Store reviews"
          sublabel="Required for JS updates"
          color="text-amber-600"
          bg="bg-soft-yellow/30"
        />
      </div>

      {/* Comparison bar */}
      <div className="max-w-2xl mx-auto mt-16">
        <div className="text-center mb-6">
          <div className="text-sm font-medium text-text-light uppercase tracking-wide">Time to ship a bug fix</div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-28 text-right text-sm font-medium text-text-dark">BundleNudge</div>
            <div className="flex-1 h-8 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full w-[2%] bg-gradient-to-r from-bright-accent to-blue-500 rounded-full flex items-center justify-end pr-3">
                <span className="text-[10px] font-bold text-white whitespace-nowrap">3 sec</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-28 text-right text-sm font-medium text-text-light">App Store</div>
            <div className="flex-1 h-8 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full w-full bg-gradient-to-r from-gray-400 to-gray-500 rounded-full flex items-center justify-end pr-3">
                <span className="text-[10px] font-bold text-white">1-7 days</span>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-text-light mt-6">
          That&apos;s <span className="font-bold text-bright-accent">up to 200,000x faster</span>.
        </p>
      </div>
    </section>
  )
}

type StatCardProps = {
  value: string
  label: string
  sublabel: string
  color: string
  bg: string
}

function StatCard({ value, label, sublabel, color, bg }: StatCardProps) {
  return (
    <div className={`${bg} rounded-2xl p-8 text-center border border-white shadow-lg`}>
      <div className={`text-5xl md:text-6xl font-black ${color} mb-2`}>{value}</div>
      <div className="text-lg font-bold text-text-dark">{label}</div>
      <div className="text-sm text-text-light">{sublabel}</div>
    </div>
  )
}
