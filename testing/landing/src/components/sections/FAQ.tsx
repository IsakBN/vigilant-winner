'use client'

import { useState } from 'react'
import { ChevronDownIcon } from '../icons'
import { FAQ_ITEMS } from '@/lib/constants'

export function FAQ() {
  return (
    <section id="faq" className="container-main py-16 bg-warm-green/10 rounded-br-[8rem] rounded-tl-3xl my-6 shadow-lg">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-extrabold tracking-tight mb-3 text-text-dark">
          Frequently Asked Questions
        </h2>
        <p className="text-xl text-text-light">
          Everything you need to know about BundleNudge.
        </p>
      </div>

      <div className="max-w-3xl mx-auto space-y-4">
        {FAQ_ITEMS.map((item, idx) => (
          <FAQItem key={idx} question={item.question} answer={item.answer} />
        ))}
      </div>
    </section>
  )
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="bg-white rounded-xl shadow-md border border-warm-green/20 overflow-hidden hover:shadow-lg transition-shadow">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors"
      >
        <span className="font-bold text-text-dark">{question}</span>
        <ChevronDownIcon
          className={`w-5 h-5 text-bright-accent transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="px-6 pb-5 text-text-light leading-relaxed border-t border-gray-100">
          <div className="pt-4">{answer}</div>
        </div>
      )}
    </div>
  )
}
