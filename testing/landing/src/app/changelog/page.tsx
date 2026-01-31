import type { Metadata } from 'next'
import { generatePageMetadata } from '@/lib/seo'

export const metadata: Metadata = generatePageMetadata({
  title: 'Changelog - BundleNudge | Product Updates',
  description: 'BundleNudge product updates, new features, and improvements.',
  path: '/changelog',
})

type ChangeType = 'feature' | 'improvement' | 'fix'

type Change = {
  type: ChangeType
  description: string
}

type ChangelogEntry = {
  date: string
  version: string
  changes: Change[]
}

const changelog: ChangelogEntry[] = [
  {
    date: 'January 2025',
    version: '1.0.0',
    changes: [
      { type: 'feature', description: 'Initial public release' },
      { type: 'feature', description: 'React Native SDK with automatic updates' },
      { type: 'feature', description: 'Staged rollouts with percentage targeting' },
      { type: 'feature', description: 'Automatic rollback on crash detection' },
      { type: 'feature', description: 'Dashboard with real-time analytics' },
    ],
  },
]

function TypeBadge({ type }: { type: ChangeType }) {
  const styles = {
    feature: 'bg-green-100 text-green-700',
    improvement: 'bg-blue-100 text-blue-700',
    fix: 'bg-orange-100 text-orange-700',
  }

  const labels = {
    feature: 'New',
    improvement: 'Improved',
    fix: 'Fixed',
  }

  return (
    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${styles[type]}`}>
      {labels[type]}
    </span>
  )
}

export default function ChangelogPage() {
  return (
    <>
      <section className="container-main py-16 bg-pastel-blue/20 rounded-bl-3xl rounded-br-[6rem] mt-4 shadow-lg">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-5xl font-black mb-4 text-text-dark">Changelog</h1>
          <p className="text-xl text-text-light">
            Latest updates and improvements to BundleNudge.
          </p>
        </div>
      </section>

      <section className="container-main py-16">
        <div className="max-w-3xl mx-auto space-y-8">
          {changelog.map((entry) => (
            <div key={entry.version} className="bg-white rounded-2xl p-8 border border-neutral-200 shadow-lg">
              <div className="flex items-center gap-4 mb-6">
                <span className="text-lg font-bold text-text-dark">{entry.date}</span>
                <span className="font-mono bg-bright-accent/10 text-bright-accent px-3 py-1 rounded-lg text-sm font-bold">
                  v{entry.version}
                </span>
              </div>
              <ul className="space-y-4">
                {entry.changes.map((change, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <TypeBadge type={change.type} />
                    <span className="text-text-dark">{change.description}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
