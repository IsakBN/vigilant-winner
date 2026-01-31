function BeakerIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
    </svg>
  )
}

function RewindIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
    </svg>
  )
}

function KeyIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
    </svg>
  )
}

function LayersIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  )
}

function ChartBarIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  )
}

function GlobeIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

const features = [
  {
    icon: <BeakerIcon className="w-7 h-7" />,
    title: 'A/B Testing',
    description: 'Ship two versions, see which performs better. Make data-driven decisions about your releases.',
    color: 'bg-purple-100 text-purple-600',
  },
  {
    icon: <RewindIcon className="w-7 h-7" />,
    title: 'One-Click Rollback',
    description: 'Instantly revert any release to a previous version. No waiting, no re-deploying.',
    color: 'bg-red-100 text-red-600',
  },
  {
    icon: <KeyIcon className="w-7 h-7" />,
    title: 'Code Signing',
    description: 'Every bundle is cryptographically signed. SDK verifies integrity before applying updates.',
    color: 'bg-amber-100 text-amber-600',
  },
  {
    icon: <LayersIcon className="w-7 h-7" />,
    title: 'Release Channels',
    description: 'Separate channels for production, staging, and beta. Test internally before going live.',
    color: 'bg-blue-100 text-blue-600',
  },
  {
    icon: <ChartBarIcon className="w-7 h-7" />,
    title: 'Real-time Analytics',
    description: 'See update adoption, success rates, and crash reports as they happen.',
    color: 'bg-green-100 text-green-600',
  },
  {
    icon: <GlobeIcon className="w-7 h-7" />,
    title: 'Edge Delivery',
    description: 'Bundles served from Cloudflare\'s global network. Fast downloads everywhere.',
    color: 'bg-cyan-100 text-cyan-600',
  },
]

export function Differentiators() {
  return (
    <section className="container-main py-16 bg-neutral-100 rounded-tr-[7rem] rounded-bl-3xl my-6 shadow-md">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-extrabold tracking-tight mb-3 text-text-dark">
          Everything You Need to Ship Safely
        </h2>
        <p className="text-xl text-text-light max-w-2xl mx-auto">
          Built for teams who care about reliability, security, and control.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {features.map((feature, idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl p-6 shadow-lg border border-neutral-200 hover:shadow-xl hover:border-bright-accent/30 transition-all group"
          >
            <div className={`w-14 h-14 ${feature.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
              {feature.icon}
            </div>
            <h3 className="text-xl font-bold mb-2 text-text-dark">{feature.title}</h3>
            <p className="text-text-light">{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
