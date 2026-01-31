import { LightningIcon, ShieldCheckIcon, SlidersIcon } from '../icons'

export function Features() {
  return (
    <section id="features" className="container-main py-16 bg-neutral-100 rounded-tr-[7rem] rounded-bl-3xl my-6 shadow-md">
      <h2 className="text-4xl font-extrabold mb-4 text-center text-text-dark">
        Built for Your Development Flow
      </h2>
      <p className="text-xl text-text-light text-center mb-10 max-w-2xl mx-auto">
        Everything you need to deploy updates safely and quickly.
      </p>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <FeatureCard
          icon={<LightningIcon className="w-10 h-10" />}
          title="Skip the App Store"
          description="Push JavaScript and asset changes directly to your users. Bug fixes go live in seconds, not days."
          footer={
            <div className="bg-neutral-100 p-4 rounded-lg font-mono text-sm text-text-dark">
              <span className="text-bright-accent">Total:</span> 3.2 seconds
            </div>
          }
        />

        <FeatureCard
          icon={<ShieldCheckIcon className="w-10 h-10" />}
          title="Auto-rollback on Crashes"
          description="Ship a broken update? The SDK detects crashes and automatically reverts to the last stable version."
          elevated
          footer={
            <div className="bg-neutral-100 p-4 rounded-lg font-mono text-sm">
              <span className="text-red-500">Error detected</span><br />
              <span className="text-bright-accent">-&gt; Auto-rolling back...</span><br />
              <span className="text-green-600">Done. Stable version restored</span>
            </div>
          }
        />

        <FeatureCard
          icon={<SlidersIcon className="w-10 h-10" />}
          title="Roll Out Gradually"
          description="Release to 5% of users first. Monitor. Then 25%, 50%, 100%. Pause or roll back any release instantly."
          footer={
            <div className="bg-neutral-100 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-text-light">Rollout</span>
                <span className="text-sm font-mono text-bright-accent">25%</span>
              </div>
              <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
                <div className="h-full w-1/4 bg-bright-accent rounded-full" />
              </div>
            </div>
          }
        />
      </div>
    </section>
  )
}

type FeatureCardProps = {
  icon: React.ReactNode
  title: string
  description: string
  footer: React.ReactNode
  elevated?: boolean
}

function FeatureCard({ icon, title, description, footer, elevated }: FeatureCardProps) {
  const shadowClass = elevated ? 'shadow-lg hover:shadow-xl' : 'shadow hover:shadow-lg'

  return (
    <div className={`p-6 bg-white rounded-2xl ${shadowClass} border border-neutral-200 hover:border-bright-accent transition-all duration-300 group`}>
      <span className="text-neutral-400 group-hover:text-bright-accent mb-4 block transition-colors">
        {icon}
      </span>
      <h3 className="text-xl font-bold mb-3 text-text-dark">{title}</h3>
      <p className="text-base text-text-light leading-relaxed mb-4">
        {description}
      </p>
      {footer}
    </div>
  )
}
