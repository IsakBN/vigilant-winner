export const APP_URL = 'https://app.bundlenudge.com'
export const SITE_URL = 'https://bundlenudge.com'

export type PricingPlan = {
  id: string
  name: string
  price: number
  description: string
  features: string[]
  cta: string
  ctaLink: string
  popular?: boolean
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    description: 'Perfect for side projects',
    features: [
      '1 app',
      '1,000 monthly updates',
      'Community support',
      'Basic analytics',
    ],
    cta: 'Start Free',
    ctaLink: `${APP_URL}/sign-up`,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 29,
    description: 'For apps ready to scale',
    features: [
      '5 apps',
      '50,000 monthly updates',
      'Priority support',
      'Advanced analytics',
      'Team collaboration',
    ],
    cta: 'Get Started',
    ctaLink: `${APP_URL}/sign-up?redirect_url=/dashboard/billing?upgrade=pro`,
    popular: true,
  },
  {
    id: 'team',
    name: 'Team',
    price: 99,
    description: 'For growing organizations',
    features: [
      'Unlimited apps',
      '500,000 monthly updates',
      'Dedicated support',
      'Custom analytics',
      'SSO / SAML',
      'Audit logs',
    ],
    cta: 'Get Started',
    ctaLink: `${APP_URL}/sign-up?redirect_url=/dashboard/billing?upgrade=team`,
  },
]

export const FAQ_ITEMS = [
  {
    question: 'What is CodePush and why does it matter?',
    answer:
      'CodePush was Microsoft\'s OTA update service for React Native apps. Microsoft deprecated it in March 2025, leaving 100,000+ developers without a solution. BundleNudge provides a seamless migration path with familiar workflows.',
  },
  {
    question: 'How is BundleNudge different from EAS Update?',
    answer:
      'EAS Update requires Expo, charges per MAU (monthly active user), and has bandwidth overages. BundleNudge works with any React Native app, has predictable flat-rate pricing, and runs on Cloudflare\'s edge network for faster updates.',
  },
  {
    question: 'What can I update with OTA?',
    answer:
      'You can update JavaScript code, images, and other bundled assets. Native code changes (Swift/Kotlin, native modules, app permissions) still require a full app store release.',
  },
  {
    question: 'Is this compliant with App Store guidelines?',
    answer:
      'Yes. Both Apple and Google allow OTA updates for JavaScript bundles as long as the core functionality doesn\'t change. This is the same mechanism used by CodePush for years.',
  },
  {
    question: 'How long does it take to integrate?',
    answer:
      'Most teams are up and running in under 15 minutes. Install our SDK, add 3 lines of code, and you\'re ready to push updates.',
  },
  {
    question: 'What happens if an update breaks my app?',
    answer:
      'BundleNudge includes automatic rollback protection. If an update causes crashes, we automatically revert affected users to the last stable version. You can also pause rollouts at any time.',
  },
]

export const COMPETITORS = [
  {
    name: 'BundleNudge',
    price: 'Free - $99/mo',
    expoRequired: false,
    autoRollback: true,
    stagedRollouts: true,
    notes: 'Predictable pricing, any RN app',
  },
  {
    name: 'EAS Update',
    price: '$19/mo + MAU + bandwidth',
    expoRequired: true,
    autoRollback: false,
    stagedRollouts: true,
    notes: 'Expo-only, overage charges',
  },
  {
    name: 'CodePush',
    price: 'Deprecated',
    expoRequired: false,
    autoRollback: true,
    stagedRollouts: true,
    notes: 'Shut down March 31, 2025',
  },
]

export const NAV_LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#faq', label: 'FAQ' },
]
