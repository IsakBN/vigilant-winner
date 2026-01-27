'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ContactModal } from './ContactModal'

/** Checkmark icon for feature lists */
function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

/** Static plan data for BundleNudge */
interface PricingPlan {
  id: string
  name: string
  displayName: string
  priceCents: number
  features: string[]
}

const PLANS: PricingPlan[] = [
  {
    id: 'free',
    name: 'free',
    displayName: 'Free',
    priceCents: 0,
    features: [
      '1 app',
      '1,000 monthly updates',
      'Community support',
      'Basic analytics',
    ],
  },
  {
    id: 'pro',
    name: 'pro',
    displayName: 'Pro',
    priceCents: 2900,
    features: [
      '5 apps',
      '50,000 monthly updates',
      'Priority support',
      'Advanced analytics',
      'Team collaboration',
    ],
  },
  {
    id: 'team',
    name: 'team',
    displayName: 'Team',
    priceCents: 9900,
    features: [
      'Unlimited apps',
      '500,000 monthly updates',
      'Dedicated support',
      'Custom analytics',
      'SSO / SAML',
      'Audit logs',
    ],
  },
]

const ENTERPRISE_PLAN: PricingPlan = {
  id: 'enterprise',
  name: 'enterprise',
  displayName: 'Enterprise',
  priceCents: 0,
  features: [
    'Unlimited everything',
    'Custom SLA',
    'Dedicated infrastructure',
    'On-premise deployment',
    'Custom integrations',
  ],
}

/** Format price in cents to dollars */
function formatPrice(cents: number): string {
  return `$${Math.floor(cents / 100)}`
}

/** Get the description for each plan tier */
function getPlanDescription(name: string): string {
  const descriptions: Record<string, string> = {
    free: 'Perfect for side projects and getting started.',
    pro: 'For professional apps ready to scale.',
    team: 'For scaling organizations with big ambitions.',
    enterprise: 'When you need custom solutions at scale.',
  }
  return descriptions[name] || 'Flexible options for your needs.'
}

/** Plan card styling configs */
interface PlanStyle {
  cardClass: string
  accentColor: string
  isPopular: boolean
  buttonClass: string
  buttonText: string
}

function getPlanStyle(name: string): PlanStyle {
  const styles: Record<string, PlanStyle> = {
    free: {
      cardClass: 'p-6 bg-white rounded-2xl shadow-lg border border-neutral-200 flex flex-col hover:shadow-xl transition-shadow duration-300',
      accentColor: 'text-neutral-600',
      isPopular: false,
      buttonClass: 'w-full py-4 border-2 border-neutral-300 text-neutral-900 rounded-xl font-bold hover:bg-neutral-100 transition-colors shadow-md block text-center',
      buttonText: 'Start for Free',
    },
    pro: {
      cardClass: 'p-6 border-2 border-bright-accent rounded-2xl shadow-xl flex flex-col bg-white relative hover:shadow-2xl transition-shadow duration-300',
      accentColor: 'text-bright-accent',
      isPopular: true,
      buttonClass: 'w-full py-4 bg-bright-accent text-white rounded-xl font-bold hover:shadow-2xl hover:shadow-bright-accent/40 transition-all shadow-lg block text-center',
      buttonText: 'Get Started',
    },
    team: {
      cardClass: 'p-6 bg-white rounded-2xl shadow-lg border border-neutral-200 flex flex-col hover:shadow-xl transition-shadow duration-300',
      accentColor: 'text-neutral-600',
      isPopular: false,
      buttonClass: 'w-full py-4 border-2 border-neutral-300 text-neutral-900 rounded-xl font-bold hover:bg-neutral-100 transition-colors shadow-md block text-center',
      buttonText: 'Get Started',
    },
    enterprise: {
      cardClass: 'p-6 bg-white rounded-2xl shadow-lg border border-neutral-200 flex flex-col hover:shadow-xl transition-shadow duration-300',
      accentColor: 'text-bright-accent',
      isPopular: false,
      buttonClass: 'w-full py-4 border-2 border-bright-accent/50 text-neutral-900 rounded-xl font-bold hover:bg-bright-accent/10 transition-colors shadow-md block text-center',
      buttonText: 'Contact Sales',
    },
  }
  return styles[name] || styles.free
}

/** Pricing card component */
function PricingCard({ plan }: { plan: PricingPlan }) {
  const style = getPlanStyle(plan.name)
  const description = getPlanDescription(plan.name)

  const getCTALink = () => {
    if (plan.name === 'free') {
      return '/login'
    }
    if (plan.name === 'enterprise') {
      return `mailto:enterprise@bundlenudge.com?subject=Enterprise%20Plan%20Inquiry`
    }
    return `/login?redirect_url=/dashboard/billing?upgrade=${plan.id}`
  }

  const isEmailLink = plan.name === 'enterprise'

  return (
    <div className={style.cardClass}>
      {style.isPopular && (
        <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-bright-accent text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
          Most Popular
        </div>
      )}
      <h3 className="text-2xl font-bold mb-2 text-neutral-900">{plan.displayName}</h3>
      <p className="text-base text-neutral-600 mb-6">{description}</p>
      <div className="text-5xl font-black mb-6 text-bright-accent">
        {plan.name === 'enterprise' ? 'Custom' : formatPrice(plan.priceCents)}
        {plan.name !== 'enterprise' && (
          <span className="text-xl font-normal text-neutral-500">/month</span>
        )}
      </div>
      <ul className="space-y-4 mb-6 flex-1 text-base">
        {plan.features.map((feature, index) => (
          <li key={index} className="flex items-center gap-2 text-neutral-800">
            <CheckIcon className={`w-5 h-5 ${style.accentColor}`} />
            {feature}
          </li>
        ))}
      </ul>
      {isEmailLink ? (
        <a href={getCTALink()} className={style.buttonClass}>
          {style.buttonText}
        </a>
      ) : (
        <Link href={getCTALink()} className={style.buttonClass}>
          {style.buttonText}
        </Link>
      )}
    </div>
  )
}

export function Pricing() {
  const [isContactModalOpen, setIsContactModalOpen] = useState(false)

  return (
    <section id="pricing" className="bg-neutral-100 py-16 rounded-bl-[9rem] rounded-tr-3xl my-6 shadow-xl shadow-neutral-200/50">
      <div className="container-fluid">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-extrabold tracking-tight mb-3 text-neutral-900">Simple, Transparent Pricing</h2>
          <p className="text-xl text-neutral-600">Start free, scale as you grow. No surprises.</p>
        </div>

        {/* Pricing Cards */}
        <div className="grid lg:grid-cols-3 gap-10">
          {PLANS.map((plan) => (
            <PricingCard key={plan.id} plan={plan} />
          ))}
        </div>

        {/* Enterprise */}
        <div className="mt-16 max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl p-8 md:p-12 border-2 border-bright-accent/30 shadow-lg">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-bright-accent/10 text-bright-accent text-sm font-bold px-4 py-2 rounded-full mb-4">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  ENTERPRISE
                </div>
                <h3 className="text-3xl font-extrabold text-neutral-900 mb-3">
                  When You're Shipping to Millions
                </h3>
                <p className="text-neutral-600 text-lg">
                  You've got big apps, big teams, and big requirements.
                  Let's build something that works for you.
                </p>
              </div>
              <div className="space-y-4">
                {ENTERPRISE_PLAN.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-bright-accent/10 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-bright-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-neutral-800">{feature}</span>
                  </div>
                ))}
                <button
                  onClick={() => setIsContactModalOpen(true)}
                  className="inline-flex items-center gap-2 bg-bright-accent text-white font-bold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl hover:shadow-bright-accent/30 transition-all mt-4"
                >
                  Let's Talk
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

      <ContactModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
      />
    </section>
  )
}
