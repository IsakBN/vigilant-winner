function TerminalIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  )
}

function CogIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function PhoneIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  )
}

export function HowItWorks() {
  return (
    <section id="how-it-works" className="container-main py-16 bg-pastel-blue/40 rounded-br-[10rem] rounded-tl-3xl my-6 shadow-lg overflow-hidden">
      <div className="text-center mb-12">
        <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-text-dark">
          How It Works
        </h2>
        <p className="text-xl text-text-light">
          From commit to live app in under a minute.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 mb-12">
        <StepCard
          step={1}
          icon={<TerminalIcon className="w-8 h-8" />}
          title="Push to GitHub"
          description="Commit and push to main. That's your deploy trigger. No extra tools, no new workflows."
          rotation="rotate-2"
          color="border-pastel-blue/50"
        >
          <div className="bg-gray-900 p-4 rounded-lg font-mono text-sm text-white">
            <div className="text-gray-500 mb-1"># Fix the checkout bug</div>
            <div><span className="text-green-400">git commit</span> -m &quot;fix: checkout validation&quot;</div>
            <div><span className="text-green-400">git push</span> origin main</div>
          </div>
        </StepCard>

        <StepCard
          step={2}
          icon={<CogIcon className="w-8 h-8" />}
          title="We Build It"
          description="Webhook triggers automatically. Bundle compiled and uploaded. You don't lift a finger."
          rotation="-rotate-2"
          color="border-soft-yellow/50"
          elevated
        >
          <div className="bg-soft-yellow/20 border border-soft-yellow/30 rounded-lg p-4 text-center">
            <div className="flex justify-center mb-3">
              <div className="w-12 h-12 bg-soft-yellow/50 rounded-full flex items-center justify-center animate-pulse">
                <CogIcon className="w-6 h-6 text-amber-600" />
              </div>
            </div>
            <div className="text-sm text-text-light font-medium">Building bundle...</div>
            <div className="mt-2 h-2 bg-soft-yellow/30 rounded-full overflow-hidden">
              <div className="h-full w-2/3 bg-amber-500 rounded-full" />
            </div>
          </div>
        </StepCard>

        <StepCard
          step={3}
          icon={<PhoneIcon className="w-8 h-8" />}
          title="Users Get Updated"
          description="App checks for updates automatically. New bundle downloads silently. Next launch runs new code."
          rotation="rotate-2"
          color="border-warm-green/50"
        >
          <div className="bg-gray-900 p-4 rounded-lg font-mono text-sm text-white">
            <div className="text-gray-500"># Devices check in automatically</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-green-400">✓</span>
              <span>Update downloaded</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              <span>Ready on next launch</span>
            </div>
          </div>
        </StepCard>
      </div>

      {/* Setup code */}
      <div className="max-w-2xl mx-auto">
        <p className="text-center text-base text-text-light mb-4 font-medium">
          One-time setup in your app:
        </p>
        <div className="bg-cream-bg border border-pastel-blue/30 rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-pastel-blue/30">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
            <span className="ml-2 text-text-light text-xs font-medium">App.tsx</span>
          </div>
          <pre className="text-sm font-mono overflow-x-auto text-text-dark">
            <code>
              <span className="text-blue-600">import</span> {'{'} BundleNudge {'}'} <span className="text-blue-600">from</span> <span className="text-green-600">&apos;@bundlenudge/sdk&apos;</span>;{'\n\n'}
              <span className="text-gray-500">// Add this once at app startup</span>{'\n'}
              BundleNudge.<span className="text-bright-accent">initialize</span>({'{'}
              {'\n'}  apiKey: process.env.<span className="text-text-dark">BUNDLENUDGE_API_KEY</span>
              {'\n'}{'}'});
            </code>
          </pre>
        </div>
        <p className="text-center text-sm text-text-light mt-4">
          That&apos;s it. Three lines of code. Then just <code className="bg-gray-100 px-2 py-0.5 rounded">git push</code>.
        </p>
      </div>
    </section>
  )
}

type StepCardProps = {
  step: number
  icon: React.ReactNode
  title: string
  description: string
  children: React.ReactNode
  rotation: string
  color: string
  elevated?: boolean
}

function StepCard({ step, icon, title, description, children, rotation, color, elevated }: StepCardProps) {
  const shadowClass = elevated ? 'shadow-xl lg:-translate-y-4' : 'shadow-lg'

  return (
    <div className={`bg-cream-bg rounded-xl p-6 border ${color} ${shadowClass} transform ${rotation} hover:rotate-0 transition-all duration-300`}>
      <div className="flex items-center gap-3 mb-4">
        <span className="w-10 h-10 rounded-full bg-bright-accent flex items-center justify-center text-lg font-bold text-white shadow">
          {step}
        </span>
        <span className="text-text-light">{icon}</span>
      </div>
      <h3 className="text-xl font-bold text-text-dark mb-2">{title}</h3>
      <p className="text-text-light mb-4">{description}</p>
      {children}
    </div>
  )
}
