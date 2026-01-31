import type { Metadata } from 'next'
import { CheckIcon } from '@/components/icons'
import { APP_URL } from '@/lib/constants'
import { generatePageMetadata } from '@/lib/seo'

export const metadata: Metadata = generatePageMetadata({
  title: 'CodePush Alternative - BundleNudge | Migration Guide',
  description:
    'Migrate from CodePush to BundleNudge in minutes. CodePush deprecated March 2025. Same workflow with predictable pricing.',
  path: '/compare/codepush',
})

const migrationSteps = [
  { step: 1, title: 'Remove CodePush SDK', code: 'npm uninstall react-native-code-push' },
  { step: 2, title: 'Install BundleNudge SDK', code: 'npm install @bundlenudge/sdk' },
  {
    step: 3,
    title: 'Update your App.tsx',
    code: `import { BundleNudge } from '@bundlenudge/sdk'

BundleNudge.configure({
  appKey: 'your-app-key'
})`,
  },
  { step: 4, title: 'Push your first update', code: 'npx bundlenudge push' },
]

const similarities = [
  'Same git-based workflow',
  'Same update-on-app-launch behavior',
  'Same mandatory/optional update modes',
  'Same automatic rollback protection',
  'Same staged rollout support',
]

export default function CodePushMigrationPage() {
  return (
    <>
      <section className="container-main py-16 bg-gradient-to-br from-orange-50 to-amber-50 rounded-bl-3xl rounded-br-[6rem] mt-4 shadow-lg">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-block bg-orange-100 text-orange-700 text-sm font-bold px-4 py-2 rounded-full mb-4">
            CodePush Deprecated March 31, 2025
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4 text-text-dark">
            Migrate from CodePush to BundleNudge
          </h1>
          <p className="text-xl text-text-light mb-8">
            Microsoft shut down CodePush. BundleNudge offers the same workflow with predictable pricing.
          </p>
          <a
            href={`${APP_URL}/sign-up`}
            className="inline-block bg-bright-accent text-white text-lg font-bold px-10 py-5 rounded-xl shadow-lg hover:shadow-xl hover:shadow-bright-accent/30 transition-all"
          >
            Start Migration
          </a>
        </div>
      </section>

      <section className="container-main py-16 bg-neutral-100 rounded-tr-[6rem] rounded-bl-3xl my-6 shadow-md">
        <h2 className="text-3xl font-bold mb-8 text-center text-text-dark">Migration in 4 Steps</h2>
        <div className="max-w-2xl mx-auto space-y-6">
          {migrationSteps.map((item) => (
            <div key={item.step} className="bg-white rounded-xl p-6 border border-neutral-200 shadow-lg">
              <div className="flex items-center gap-3 mb-3">
                <span className="w-8 h-8 rounded-full bg-bright-accent text-white flex items-center justify-center font-bold text-sm">
                  {item.step}
                </span>
                <h3 className="font-bold text-text-dark">{item.title}</h3>
              </div>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                <code>{item.code}</code>
              </pre>
            </div>
          ))}
        </div>
      </section>

      <section className="container-main py-16">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-6 text-center text-text-dark">Same Workflow You Know</h2>
          <div className="bg-warm-green/10 rounded-2xl p-8 border border-warm-green/30 shadow-lg">
            <ul className="space-y-4">
              {similarities.map((item, idx) => (
                <li key={idx} className="flex items-center gap-3 text-lg">
                  <CheckIcon className="w-6 h-6 text-green-500" />
                  <span className="text-text-dark">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="container-main py-16 bg-pastel-blue/20 rounded-tl-[6rem] rounded-br-3xl my-6 shadow-lg text-center">
        <h2 className="text-3xl font-bold mb-4 text-text-dark">Ready to migrate?</h2>
        <p className="text-xl text-text-light mb-8">Most teams complete the migration in under 15 minutes.</p>
        <a
          href={`${APP_URL}/sign-up`}
          className="inline-block bg-bright-accent text-white text-lg font-bold px-10 py-5 rounded-xl shadow-lg hover:shadow-xl hover:shadow-bright-accent/30 transition-all"
        >
          Get Started Free
        </a>
      </section>
    </>
  )
}
