'use client'

import { useState } from 'react'
import { ArrowRightIcon, CheckIcon } from '../icons'
import { APP_URL } from '@/lib/constants'

export function EmailCapture() {
  const [email, setEmail] = useState('')

  return (
    <section className="container-main py-20 my-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gradient-to-br from-bright-accent via-blue-600 to-indigo-700 rounded-3xl p-10 md:p-16 shadow-2xl shadow-bright-accent/20 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

          <div className="relative">
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-5xl font-black mb-4 text-white">
                Start Shipping Faster Today
              </h2>
              <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto">
                Join developers who ship updates in seconds instead of days.
                No credit card required.
              </p>
            </div>

            {/* CTA Form */}
            <div className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto mb-8">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="flex-1 px-5 py-4 rounded-xl border-2 border-white/20 bg-white/10 text-white placeholder-white/50 focus:outline-none focus:border-white/50 focus:bg-white/20 transition-all text-lg"
              />
              <a
                href={email ? `${APP_URL}/sign-up?email=${encodeURIComponent(email)}` : `${APP_URL}/sign-up`}
                className="inline-flex items-center justify-center gap-2 bg-white text-bright-accent font-bold px-8 py-4 rounded-xl hover:shadow-lg hover:scale-105 transition-all text-lg"
              >
                Get Started Free
                <ArrowRightIcon className="w-5 h-5" />
              </a>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap justify-center gap-6 text-white/70 text-sm">
              <span className="flex items-center gap-2">
                <CheckIcon className="w-4 h-4 text-green-400" />
                Free up to 1,000 updates
              </span>
              <span className="flex items-center gap-2">
                <CheckIcon className="w-4 h-4 text-green-400" />
                No credit card required
              </span>
              <span className="flex items-center gap-2">
                <CheckIcon className="w-4 h-4 text-green-400" />
                Setup in 5 minutes
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
