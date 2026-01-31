'use client'

import { useState } from 'react'
import { CheckIcon, LightningIcon, ArrowRightIcon } from '../icons'
import { ContactModal } from '../ContactModal'
import { PRICING_PLANS } from '@/lib/constants'

const ENTERPRISE_FEATURES = [
  'Unlimited apps & updates',
  'Custom SLA (99.99% uptime)',
  'Dedicated infrastructure',
  'On-premise deployment option',
  'Priority support with Slack channel',
  'Custom integrations & API access',
]

export function PricingCards() {
  const [isContactModalOpen, setIsContactModalOpen] = useState(false)

  return (
    <section id="pricing" className="container-main py-16 bg-soft-yellow/20 rounded-bl-[9rem] rounded-tr-3xl my-6 shadow-xl">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-extrabold tracking-tight mb-3 text-text-dark">
          Simple, Transparent Pricing
        </h2>
        <p className="text-xl text-text-light">
          Start free, scale as you grow. No surprises.
        </p>
      </div>

      {/* Pricing tiers */}
      <div className="grid lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {PRICING_PLANS.map((plan) => (
          <PricingCard key={plan.id} plan={plan} />
        ))}
      </div>

      {/* See full comparison link */}
      <div className="text-center mt-8">
        <a
          href="/pricing"
          className="inline-flex items-center gap-2 text-bright-accent font-bold hover:underline"
        >
          See full feature comparison
          <ArrowRightIcon className="w-4 h-4" />
        </a>
      </div>

      {/* Enterprise card */}
      <div className="mt-12 max-w-5xl mx-auto">
        <div className="bg-white rounded-3xl p-8 md:p-10 border-2 border-bright-accent/30 shadow-xl">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-bright-accent/10 text-bright-accent text-sm font-bold px-4 py-2 rounded-full mb-4">
                <LightningIcon className="w-4 h-4" />
                ENTERPRISE
              </div>
              <h3 className="text-3xl font-extrabold text-text-dark mb-3">
                When You&apos;re Shipping to Millions
              </h3>
              <p className="text-text-light text-lg">
                Big apps, big teams, big requirements. Let&apos;s build something that works for you.
              </p>
            </div>

            <div className="space-y-4">
              {ENTERPRISE_FEATURES.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-bright-accent/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckIcon className="w-3 h-3 text-bright-accent" />
                  </div>
                  <span className="text-text-dark">{feature}</span>
                </div>
              ))}

              <button
                onClick={() => setIsContactModalOpen(true)}
                className="inline-flex items-center gap-2 bg-bright-accent text-white font-bold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl hover:shadow-bright-accent/30 transition-all mt-4"
              >
                Let&apos;s Talk
                <ArrowRightIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <ContactModal isOpen={isContactModalOpen} onClose={() => setIsContactModalOpen(false)} />
    </section>
  )
}

type Plan = {
  id: string
  name: string
  price: number
  description: string
  features: string[]
  cta: string
  ctaLink: string
  popular?: boolean
}

function PricingCard({ plan }: { plan: Plan }) {
  const isPopular = plan.popular
  const cardClass = isPopular
    ? 'p-6 border-2 border-bright-accent rounded-2xl shadow-xl flex flex-col bg-white relative hover:shadow-2xl transition-shadow duration-300'
    : 'p-6 bg-white rounded-2xl shadow-lg border border-neutral-200 flex flex-col hover:shadow-xl transition-shadow duration-300'

  const buttonClass = isPopular
    ? 'w-full py-4 bg-bright-accent text-white rounded-xl font-bold hover:shadow-2xl hover:shadow-bright-accent/40 transition-all shadow-lg block text-center'
    : 'w-full py-4 border-2 border-neutral-300 text-text-dark rounded-xl font-bold hover:bg-neutral-100 transition-colors shadow-md block text-center'

  return (
    <div className={cardClass}>
      {isPopular && (
        <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-bright-accent text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
          Most Popular
        </div>
      )}

      <h3 className="text-2xl font-bold mb-2 text-text-dark">{plan.name}</h3>
      <p className="text-base text-text-light mb-6">{plan.description}</p>

      <div className="text-5xl font-black mb-6 text-bright-accent">
        ${plan.price}
        <span className="text-xl font-normal text-text-light">/month</span>
      </div>

      <ul className="space-y-4 mb-6 flex-1 text-base">
        {plan.features.map((feature, idx) => (
          <li key={idx} className="flex items-center gap-2 text-text-dark">
            <CheckIcon className={`w-5 h-5 ${isPopular ? 'text-bright-accent' : 'text-neutral-400'}`} />
            {feature}
          </li>
        ))}
      </ul>

      <a href={plan.ctaLink} className={buttonClass}>
        {plan.cta}
      </a>
    </div>
  )
}
