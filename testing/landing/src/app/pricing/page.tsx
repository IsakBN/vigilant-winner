import type { Metadata } from 'next'
import { PricingCards, FAQ } from '@/components/sections'
import { PricingFeatureTable } from '@/components/PricingFeatureTable'
import { generatePageMetadata } from '@/lib/seo'

export const metadata: Metadata = generatePageMetadata({
  title: 'Pricing - BundleNudge | Simple, Predictable OTA Pricing',
  description:
    'BundleNudge pricing plans. Free tier available. No MAU charges, no bandwidth overages. Start free, scale as you grow.',
  path: '/pricing',
})

export default function PricingPage() {
  return (
    <>
      <section className="container-main py-16 bg-pastel-blue/20 rounded-bl-3xl rounded-br-[6rem] mt-4 shadow-lg">
        <div className="text-center">
          <h1 className="text-5xl font-black mb-4 text-text-dark">
            Simple, Predictable Pricing
          </h1>
          <p className="text-xl text-text-light max-w-2xl mx-auto">
            No MAU charges. No bandwidth overages. No surprises.
            <br />
            Pay for updates, not users.
          </p>
        </div>
      </section>

      <PricingCards />

      {/* Full Feature Comparison */}
      <section className="container-main py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-text-dark mb-4">
            Full Feature Comparison
          </h2>
          <p className="text-text-light max-w-2xl mx-auto">
            Every plan includes core OTA functionality. Higher tiers unlock more
            updates, apps, and advanced features.
          </p>
        </div>
        <PricingFeatureTable />
      </section>

      {/* Why No MAU Pricing */}
      <section className="container-main py-16 bg-warm-green/10 rounded-3xl my-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-text-dark mb-6">
            Why We Don&apos;t Charge Per MAU
          </h2>
          <div className="grid md:grid-cols-2 gap-8 text-left">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-bold text-text-dark mb-2">Predictable costs</h3>
              <p className="text-text-light">
                Your bill doesn&apos;t spike when your app goes viral. You know
                exactly what you&apos;ll pay each month.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-bold text-text-dark mb-2">
                Aligned incentives
              </h3>
              <p className="text-text-light">
                We want you to grow. Success shouldn&apos;t mean a bigger bill.
                More users = same price.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-bold text-text-dark mb-2">Fair for everyone</h3>
              <p className="text-text-light">
                Whether you have 100 users or 1 million, you pay for what you
                use: updates pushed.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-bold text-text-dark mb-2">No bandwidth traps</h3>
              <p className="text-text-light">
                Other providers charge for bandwidth. We use Cloudflare&apos;s
                global edge. Downloads are on us.
              </p>
            </div>
          </div>
        </div>
      </section>

      <FAQ />
    </>
  )
}
