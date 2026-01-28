import {
  Navbar,
  Hero,
  HowItWorks,
  Features,
  StagedRollouts,
  VersionControlCenter,
  Testing,
  Comparison,
  Pricing,
  Footer,
} from '@/components'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-cream-bg">
      <Navbar />
      <Hero />
      <HowItWorks />
      <Features />
      <StagedRollouts />
      <VersionControlCenter />
      <Testing />
      <Comparison />
      <Pricing />
      <Footer />
    </main>
  )
}
