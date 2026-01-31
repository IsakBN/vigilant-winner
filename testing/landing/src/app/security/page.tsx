import type { Metadata } from 'next'
import { generatePageMetadata } from '@/lib/seo'
import { ShieldCheckIcon } from '@/components/icons'

export const metadata: Metadata = generatePageMetadata({
  title: 'Security - BundleNudge | Enterprise-Grade Security',
  description:
    'BundleNudge security practices. Built on Cloudflare infrastructure with encryption at rest and in transit.',
  path: '/security',
})

function LockIcon({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  )
}

function ServerIcon({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
    </svg>
  )
}

function KeyIcon({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
    </svg>
  )
}

const securityFeatures = [
  {
    icon: <ShieldCheckIcon className="w-8 h-8 text-bright-accent" />,
    title: 'Cloudflare Infrastructure',
    description: "All bundles served from Cloudflare's global edge network with built-in DDoS protection.",
    color: 'bg-pastel-blue/20 border-pastel-blue/30',
  },
  {
    icon: <LockIcon className="w-8 h-8 text-bright-accent" />,
    title: 'Encryption Everywhere',
    description: 'Data encrypted at rest (AES-256) and in transit (TLS 1.3). End-to-end protection.',
    color: 'bg-warm-green/20 border-warm-green/30',
  },
  {
    icon: <ServerIcon className="w-8 h-8 text-bright-accent" />,
    title: 'Isolated Storage',
    description: "Each organization's bundles stored in isolated R2 buckets with strict access controls.",
    color: 'bg-soft-yellow/30 border-soft-yellow/50',
  },
  {
    icon: <KeyIcon className="w-8 h-8 text-bright-accent" />,
    title: 'Code Signing',
    description: 'All bundles cryptographically signed. SDK verifies signatures before applying updates.',
    color: 'bg-pastel-blue/20 border-pastel-blue/30',
  },
]

export default function SecurityPage() {
  return (
    <>
      <section className="container-main py-16 bg-warm-green/10 rounded-bl-3xl rounded-br-[6rem] mt-4 shadow-lg">
        <div className="text-center">
          <h1 className="text-5xl font-black mb-4 text-text-dark">Security</h1>
          <p className="text-xl text-text-light max-w-2xl mx-auto">
            Enterprise-grade security built from the ground up. Your code and users are protected.
          </p>
        </div>
      </section>

      <section className="container-main py-16">
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {securityFeatures.map((feature, idx) => (
            <div
              key={idx}
              className={`p-6 rounded-2xl border ${feature.color} shadow-lg hover:shadow-xl transition-shadow`}
            >
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold mb-2 text-text-dark">{feature.title}</h3>
              <p className="text-text-light">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-main py-16 bg-neutral-100 rounded-tl-[6rem] rounded-br-3xl my-6 shadow-md">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-6 text-text-dark">Data Handling</h2>
          <div className="space-y-4 text-text-light">
            <p>
              <strong className="text-text-dark">What we store:</strong> JavaScript bundles,
              deployment metadata, and analytics (update counts, success rates).
            </p>
            <p>
              <strong className="text-text-dark">Where we store it:</strong> Cloudflare R2
              (bundles), Cloudflare D1 (metadata). All data centers SOC 2 Type II certified.
            </p>
            <p>
              <strong className="text-text-dark">Retention:</strong> Bundles retained 90 days
              after being superseded. Analytics retained for 12 months.
            </p>
            <p>
              <strong className="text-text-dark">Questions?</strong>{' '}
              <a href="mailto:security@bundlenudge.com" className="text-bright-accent hover:underline font-semibold">
                security@bundlenudge.com
              </a>
            </p>
          </div>
        </div>
      </section>
    </>
  )
}
