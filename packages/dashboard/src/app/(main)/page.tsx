import { Navbar } from '@/components/landing/Navbar'
import { Hero } from '@/components/landing/Hero'
import { Comparison } from '@/components/landing/Comparison'
import { HowItWorks } from '@/components/landing/HowItWorks'
import { Features } from '@/components/landing/Features'
import { Pricing } from '@/components/landing/Pricing'
import { StagedRollouts } from '@/components/landing/StagedRollouts'
import { VersionControlCenter } from '@/components/landing/VersionControlCenter'
import { Testing } from '@/components/landing/Testing'
import { Footer } from '@/components/landing/Footer'

// Force dynamic rendering for auth-aware navbar
export const dynamic = 'force-dynamic'

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Comparison />
        <HowItWorks />
        <Features />
        <Pricing />
        <StagedRollouts />
        <VersionControlCenter />
        <Testing />
      </main>
      <Footer />
    </>
  )
}
