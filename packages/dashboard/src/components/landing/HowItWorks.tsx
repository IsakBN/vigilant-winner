import { FlaskIcon } from '../icons'

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-pastel-blue/40 text-text-dark py-16 overflow-hidden rounded-br-[10rem] rounded-tl-3xl my-6 shadow-lg">
      <div className="container-fluid">
        <div className="mb-10 text-center">
          <h2 className="text-5xl font-extrabold tracking-tight mb-4 text-text-dark">
            How It Works
          </h2>
          <p className="text-xl text-text-light">
            From commit to live app in under a minute.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-10 relative">
          {/* Step 1 */}
          <StepCard
            step={1}
            title="Push to GitHub"
            description="Commit and push to main. That's your deploy trigger. No extra tools, no new workflows."
            rotation="rotate-2"
            borderColor="border-pastel-blue/50"
          >
            <div className="bg-text-dark/90 p-5 rounded-lg border border-text-dark/30 font-mono text-sm text-white">
              <span className="text-warm-green">git commit</span> -m &quot;fix checkout bug&quot;<br />
              <span className="text-warm-green">git push</span> origin main
            </div>
          </StepCard>

          {/* Step 2 */}
          <StepCard
            step={2}
            title="We Build It"
            description="Webhook triggers a build. Bundle is compiled and uploaded automatically. You don't lift a finger."
            rotation="-rotate-3"
            borderColor="border-soft-yellow/50"
            offsetY
          >
            <div className="flex flex-col items-center justify-center py-8 border border-dashed border-soft-yellow/50 rounded-lg bg-soft-yellow/10 space-y-3">
              <FlaskIcon className="w-12 h-12 text-soft-yellow" />
              <span className="text-text-light text-sm font-medium">Building bundle...</span>
            </div>
          </StepCard>

          {/* Step 3 */}
          <StepCard
            step={3}
            title="Users Get Updated"
            description="Your app checks for updates. New bundle downloads silently. Next app launch runs the new code. Done."
            rotation="rotate-2"
            borderColor="border-warm-green/50"
            elevated
          >
            <div className="bg-text-dark/90 p-5 rounded-lg border border-text-dark/30 font-mono text-sm text-white">
              <span className="text-text-light/70"># Devices check in automatically</span><br />
              <span className="text-warm-green">Done.</span> Update downloaded<br />
              <span className="text-warm-green">Done.</span> Ready on next launch
            </div>
          </StepCard>
        </div>

        {/* Setup code */}
        <div className="mt-12 max-w-2xl mx-auto">
          <p className="text-center text-base text-text-light mb-4 font-medium">
            One-time setup in your app:
          </p>
          <div className="bg-cream-bg border border-pastel-blue/30 rounded-xl p-6 shadow">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-pastel-blue/30">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
              <span className="ml-2 text-text-light text-xs font-medium">App.tsx</span>
            </div>
            <pre className="text-sm font-mono overflow-x-auto text-text-dark">
              <code>
                <span className="text-blue-600">import</span> {"{"} BundleNudge {"}"} <span className="text-blue-600">from</span> <span className="text-warm-green">&apos;@bundlenudge/sdk&apos;</span>;{"\n\n"}
                <span className="text-text-light">// Add this once at app startup</span>{"\n"}
                BundleNudge.<span className="text-bright-accent">initialize</span>({"{"}{"\n"}
                {"  "}apiKey: process.env.<span className="text-text-dark">BUNDLENUDGE_API_KEY</span>{"\n"}
                {"}"});
              </code>
            </pre>
          </div>
        </div>
      </div>
    </section>
  )
}

type StepCardProps = {
  step: number
  title: string
  description: string
  children: React.ReactNode
  rotation: string
  borderColor: string
  offsetY?: boolean
  elevated?: boolean
}

function StepCard({
  step,
  title,
  description,
  children,
  rotation,
  borderColor,
  offsetY,
  elevated
}: StepCardProps) {
  const shadowClass = elevated ? 'shadow-lg' : 'shadow-md'
  const translateClass = offsetY ? 'lg:-translate-y-10' : ''

  return (
    <div className={`space-y-4 p-6 bg-cream-bg rounded-xl ${shadowClass} border ${borderColor} transform ${rotation} hover:rotate-0 transition-transform duration-300 ${translateClass}`}>
      <div className="flex items-center gap-3">
        <span className="w-10 h-10 rounded-full bg-bright-accent flex items-center justify-center text-lg font-bold text-white shadow">
          {step}
        </span>
        <h3 className="text-2xl font-bold text-text-dark">{title}</h3>
      </div>
      <p className="text-base text-text-light">{description}</p>
      {children}
    </div>
  )
}
