'use client'

import { APP_URL } from '@/lib/constants'
import { ArrowRightIcon } from '../icons'

export function MidPageCTA() {
  return (
    <section className="container-main py-12">
      <div className="bg-gradient-to-r from-bright-accent to-indigo-600 rounded-2xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg shadow-bright-accent/20">
        <div>
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">
            Ready to ship faster?
          </h3>
          <p className="text-white/80 text-lg">
            Push your first update in under 5 minutes. No credit card required.
          </p>
        </div>
        <a
          href={`${APP_URL}/sign-up`}
          className="inline-flex items-center gap-2 bg-white text-bright-accent font-bold px-8 py-4 rounded-xl hover:shadow-lg hover:scale-105 transition-all text-lg whitespace-nowrap"
        >
          Get Started Free
          <ArrowRightIcon className="w-5 h-5" />
        </a>
      </div>
    </section>
  )
}
