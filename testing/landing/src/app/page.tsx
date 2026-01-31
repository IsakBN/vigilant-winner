import {
  Hero,
  CodePushBanner,
  HowItWorks,
  MidPageCTA,
  Differentiators,
  StagedRollouts,
  AutoRollback,
  SpeedStats,
  ComingSoon,
  PricingCards,
  ComparisonTable,
  FAQ,
  EmailCapture,
} from '@/components/sections'
import { generateFAQSchema } from '@/lib/seo'
import { FAQ_ITEMS } from '@/lib/constants'

export default function HomePage() {
  const faqSchema = generateFAQSchema(FAQ_ITEMS)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <Hero />
      <CodePushBanner />
      <HowItWorks />
      <PricingCards />
      <MidPageCTA />
      <Differentiators />
      <StagedRollouts />
      <AutoRollback />
      <SpeedStats />
      <ComingSoon />
      <ComparisonTable />
      <FAQ />
      <EmailCapture />
    </>
  )
}
