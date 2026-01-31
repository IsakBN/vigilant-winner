'use client'

import { useState } from 'react'
import { CloseIcon, CheckIcon, LightningIcon } from './icons'

type ContactModalProps = {
  isOpen: boolean
  onClose: () => void
}

const ENTERPRISE_PERKS = [
  { title: 'Unlimited everything', desc: 'Apps, updates, team members' },
  { title: '99.99% SLA', desc: 'Enterprise-grade reliability' },
  { title: 'Dedicated support', desc: 'Slack channel with our engineers' },
  { title: 'Custom contract', desc: 'Tailored to your needs' },
]

export function ContactModal({ isOpen, onClose }: ContactModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    apps: '',
    message: '',
  })
  const [submitted, setSubmitted] = useState(false)

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative bg-cream-bg rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-white/80 hover:bg-white rounded-full shadow-md transition-all"
          aria-label="Close"
        >
          <CloseIcon className="w-5 h-5 text-text-dark" />
        </button>

        <div className="grid md:grid-cols-2">
          {/* Left side - Visual */}
          <div className="bg-gradient-to-br from-soft-yellow via-soft-yellow/50 to-warm-green/30 p-8 md:p-10 relative overflow-hidden">
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-bright-accent/10 rounded-full translate-y-1/2 -translate-x-1/2" />

            <div className="relative">
              <div className="inline-flex items-center gap-2 bg-white/80 text-text-dark text-sm font-bold px-4 py-2 rounded-full mb-6 shadow-sm">
                <LightningIcon className="w-4 h-4 text-bright-accent" />
                ENTERPRISE
              </div>

              <h2 className="text-3xl md:text-4xl font-black text-text-dark mb-4">
                Let&apos;s Build
                <br />
                <span className="text-bright-accent">Something Great</span>
              </h2>

              <p className="text-text-light text-lg mb-8">
                Big apps deserve big support. Tell us about your needs and
                we&apos;ll craft a plan that works.
              </p>

              {/* Perks */}
              <div className="space-y-4">
                {ENTERPRISE_PERKS.map((perk) => (
                  <div key={perk.title} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-warm-green/50 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckIcon className="w-3 h-3 text-green-700" />
                    </div>
                    <div>
                      <div className="font-bold text-text-dark">{perk.title}</div>
                      <div className="text-sm text-text-light">{perk.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Trust badge */}
              <div className="mt-8 pt-6 border-t border-text-dark/10">
                <p className="text-sm text-text-light">
                  Trusted by teams shipping to millions of users
                </p>
              </div>
            </div>
          </div>

          {/* Right side - Form */}
          <div className="p-8 md:p-10 bg-white">
            {submitted ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-8">
                <div className="w-20 h-20 bg-warm-green/30 rounded-full flex items-center justify-center mb-6">
                  <CheckIcon className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-2xl font-black text-text-dark mb-2">
                  We&apos;ll Be in Touch!
                </h3>
                <p className="text-text-light mb-8 max-w-sm">
                  Expect a reply within 24 hours. We&apos;re excited to learn
                  more about your project.
                </p>
                <button
                  onClick={onClose}
                  className="bg-bright-accent text-white font-bold px-8 py-4 rounded-xl hover:shadow-lg hover:shadow-bright-accent/30 transition-all"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <h3 className="text-xl font-bold text-text-dark mb-6">
                  Tell us about your project
                </h3>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="name"
                        className="block text-sm font-medium text-text-dark mb-1.5"
                      >
                        Your Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-gray-50 focus:outline-none focus:border-bright-accent focus:bg-white transition-all"
                        placeholder="Jane Smith"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium text-text-dark mb-1.5"
                      >
                        Work Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-gray-50 focus:outline-none focus:border-bright-accent focus:bg-white transition-all"
                        placeholder="jane@company.com"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="company"
                        className="block text-sm font-medium text-text-dark mb-1.5"
                      >
                        Company
                      </label>
                      <input
                        type="text"
                        id="company"
                        name="company"
                        value={formData.company}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-gray-50 focus:outline-none focus:border-bright-accent focus:bg-white transition-all"
                        placeholder="Acme Inc"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="apps"
                        className="block text-sm font-medium text-text-dark mb-1.5"
                      >
                        Number of Apps
                      </label>
                      <select
                        id="apps"
                        name="apps"
                        value={formData.apps}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-gray-50 focus:outline-none focus:border-bright-accent focus:bg-white transition-all"
                      >
                        <option value="">Select...</option>
                        <option value="1-5">1-5 apps</option>
                        <option value="6-20">6-20 apps</option>
                        <option value="21-50">21-50 apps</option>
                        <option value="50+">50+ apps</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="message"
                      className="block text-sm font-medium text-text-dark mb-1.5"
                    >
                      What are you looking for?
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-gray-50 focus:outline-none focus:border-bright-accent focus:bg-white transition-all resize-none"
                      placeholder="Monthly update volume, compliance needs, integration requirements..."
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-bright-accent text-white font-bold py-4 rounded-xl hover:shadow-xl hover:shadow-bright-accent/30 hover:scale-[1.02] transition-all text-lg"
                  >
                    Get in Touch
                  </button>

                  <p className="text-center text-sm text-text-light">
                    We respond within 24 hours
                  </p>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
