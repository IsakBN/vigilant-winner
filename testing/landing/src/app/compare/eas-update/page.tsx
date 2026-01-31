import type { Metadata } from 'next'
import { CheckIcon, XIcon } from '@/components/icons'
import { APP_URL } from '@/lib/constants'
import { generatePageMetadata } from '@/lib/seo'

export const metadata: Metadata = generatePageMetadata({
  title: 'EAS Update Alternative - BundleNudge | No Expo Required',
  description:
    'BundleNudge vs EAS Update. Works with any React Native app, no Expo required. Predictable pricing without overages.',
  path: '/compare/eas-update',
})

const comparison = [
  { feature: 'Works with any React Native app', bundlenudge: true, eas: false },
  { feature: 'No Expo required', bundlenudge: true, eas: false },
  { feature: 'Predictable flat-rate pricing', bundlenudge: true, eas: false },
  { feature: 'No MAU charges', bundlenudge: true, eas: false },
  { feature: 'No bandwidth overage fees', bundlenudge: true, eas: false },
  { feature: 'Auto rollback on crash', bundlenudge: true, eas: false },
  { feature: 'Staged rollouts', bundlenudge: true, eas: true },
  { feature: 'Update channels', bundlenudge: true, eas: true },
]

export default function EASComparisonPage() {
  return (
    <>
      <section className="container-main py-16 bg-pastel-blue/30 rounded-bl-3xl rounded-br-[6rem] mt-4 shadow-lg">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-black mb-4 text-text-dark">
            BundleNudge vs EAS Update
          </h1>
          <p className="text-xl text-text-light">
            EAS Update is great if you&apos;re all-in on Expo. But if you&apos;re using bare React Native
            or want predictable pricing, BundleNudge is the better choice.
          </p>
        </div>
      </section>

      <section className="container-main py-12">
        <div className="max-w-4xl mx-auto overflow-x-auto">
          <table className="w-full text-sm bg-white rounded-2xl shadow-lg overflow-hidden">
            <thead>
              <tr className="bg-bright-accent/10 border-b-2 border-bright-accent/20">
                <th className="py-5 px-6 text-left font-bold text-text-dark">Feature</th>
                <th className="py-5 px-6 text-center font-bold text-bright-accent">BundleNudge</th>
                <th className="py-5 px-6 text-center font-bold text-text-dark">EAS Update</th>
              </tr>
            </thead>
            <tbody>
              {comparison.map((row, idx) => (
                <tr key={idx} className="border-b border-gray-100">
                  <td className="py-5 px-6 text-text-dark">{row.feature}</td>
                  <td className="py-5 px-6 text-center">
                    {row.bundlenudge ? (
                      <CheckIcon className="w-6 h-6 text-green-500 mx-auto" />
                    ) : (
                      <XIcon className="w-6 h-6 text-red-400 mx-auto" />
                    )}
                  </td>
                  <td className="py-5 px-6 text-center">
                    {row.eas ? (
                      <CheckIcon className="w-6 h-6 text-green-500 mx-auto" />
                    ) : (
                      <XIcon className="w-6 h-6 text-red-400 mx-auto" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="container-main py-16 bg-soft-yellow/20 rounded-tl-[6rem] rounded-br-3xl my-6 shadow-lg">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center text-text-dark">Pricing Comparison</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-8 border-2 border-bright-accent shadow-xl">
              <h3 className="font-bold text-xl mb-4 text-bright-accent">BundleNudge</h3>
              <ul className="space-y-3 text-text-light">
                <li>Free: 1,000 updates/month</li>
                <li>Pro: $29/month - 50,000 updates</li>
                <li>Team: $99/month - 500,000 updates</li>
                <li className="text-green-600 font-semibold pt-2 border-t border-gray-100">No hidden fees</li>
              </ul>
            </div>
            <div className="bg-white rounded-2xl p-8 border border-neutral-200 shadow-lg">
              <h3 className="font-bold text-xl mb-4 text-text-dark">EAS Update</h3>
              <ul className="space-y-3 text-text-light">
                <li>Free: 1,000 MAU, limited bandwidth</li>
                <li>Production: $19/month base</li>
                <li>+ $0.002 per MAU over limit</li>
                <li className="text-orange-500 font-semibold pt-2 border-t border-gray-100">+ bandwidth overage charges</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="container-main py-16 text-center">
        <h2 className="text-3xl font-bold mb-4 text-text-dark">No Expo Lock-in Required</h2>
        <p className="text-xl text-text-light mb-8 max-w-xl mx-auto">
          BundleNudge works with any React Native app - bare workflow, Expo, or ejected.
        </p>
        <a
          href={`${APP_URL}/sign-up`}
          className="inline-block bg-bright-accent text-white text-lg font-bold px-10 py-5 rounded-xl shadow-lg hover:shadow-xl hover:shadow-bright-accent/30 transition-all"
        >
          Try BundleNudge Free
        </a>
      </section>
    </>
  )
}
