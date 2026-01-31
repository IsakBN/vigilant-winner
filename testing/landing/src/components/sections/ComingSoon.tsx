'use client'

import { useState } from 'react'
import {
  CheckIcon,
  ClockIcon,
  CodeIcon,
  QrCodeIcon,
  UsersIcon,
  PhoneIcon,
} from '../icons'

export function ComingSoon() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <section className="container-fluid py-24 bg-soft-yellow/30 rounded-bl-[7rem] rounded-tr-3xl my-8 shadow-xl shadow-soft-yellow/10">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-soft-yellow/50 text-amber-700 text-sm font-bold px-4 py-2 rounded-full mb-6">
            <ClockIcon className="w-5 h-5" />
            COMING SOON
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-text-dark mb-4">
            Test Any Branch,
            <br />
            <span className="text-bright-accent">On Real Devices.</span>
          </h2>
          <p className="text-xl text-text-light max-w-3xl mx-auto">
            Connect multiple branches to generate .ipa and .apk test builds
            instantly. Share with your team via QR codes.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left: Dashboard mockup */}
          <div className="bg-cream-bg rounded-3xl shadow-xl border border-soft-yellow/50 overflow-hidden">
            {/* Window chrome */}
            <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 bg-gray-100 rounded-lg px-4 py-1.5 text-sm text-text-light">
                app.bundlenudge.com/myapp/testing
              </div>
            </div>

            {/* Dashboard content */}
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-text-dark">Test Builds</h3>
                <button className="bg-bright-accent text-white text-sm font-bold px-4 py-2 rounded-lg">
                  + New Build
                </button>
              </div>

              {/* Branch list */}
              <div className="space-y-3">
                {/* Main branch */}
                <BranchCard
                  name="main"
                  tag="production"
                  tagColor="green"
                  buildNumber={247}
                  time="2 hours ago"
                  status="ready"
                />

                {/* Feature branch */}
                <BranchCard
                  name="feature/new-checkout"
                  tag="staging"
                  tagColor="purple"
                  buildNumber={12}
                  time="15 min ago"
                  status="ready"
                />

                {/* Building branch */}
                <BranchCard
                  name="hotfix/payment-bug"
                  tag="building..."
                  tagColor="orange"
                  time="Started 2 min ago"
                  status="building"
                  progress={42}
                />
              </div>
            </div>
          </div>

          {/* Right: Features + Email signup */}
          <div className="space-y-8">
            <div className="flex gap-5">
              <div className="w-14 h-14 bg-pastel-blue/30 rounded-2xl flex items-center justify-center flex-shrink-0">
                <CodeIcon className="w-7 h-7 text-bright-accent" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2 text-text-dark">
                  Branch-Based Builds
                </h3>
                <p className="text-text-light">
                  Connect any branch. Push code, get a testable build
                  automatically. Feature branches, hotfixes — all instantly available.
                </p>
              </div>
            </div>

            <div className="flex gap-5">
              <div className="w-14 h-14 bg-soft-yellow/50 rounded-2xl flex items-center justify-center flex-shrink-0">
                <PhoneIcon className="w-7 h-7 text-amber-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2 text-text-dark">
                  iOS & Android Builds
                </h3>
                <p className="text-text-light">
                  Generate signed .ipa files for iOS and .apk for Android. No
                  TestFlight wait. No Play Store setup.
                </p>
              </div>
            </div>

            <div className="flex gap-5">
              <div className="w-14 h-14 bg-warm-green/30 rounded-2xl flex items-center justify-center flex-shrink-0">
                <QrCodeIcon className="w-7 h-7 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2 text-text-dark">
                  QR Code Distribution
                </h3>
                <p className="text-text-light">
                  Share builds instantly. Scan a QR code, install the app. No
                  invites, no provisioning hassle.
                </p>
              </div>
            </div>

            <div className="flex gap-5">
              <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                <UsersIcon className="w-7 h-7 text-purple-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2 text-text-dark">
                  Tester Management
                </h3>
                <p className="text-text-light">
                  Invite testers by email. Manage UDIDs for iOS ad-hoc builds.
                  Track who installed which version.
                </p>
              </div>
            </div>

            {/* Email signup */}
            <div className="bg-cream-bg rounded-2xl p-6 border-2 border-bright-accent/30">
              {!submitted ? (
                <>
                  <h4 className="font-bold text-text-dark mb-2">
                    Be the first to know
                  </h4>
                  <p className="text-text-light text-sm mb-4">
                    Get notified when internal builds launch. No spam.
                  </p>
                  <form onSubmit={handleSubmit} className="flex gap-3">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      required
                      className="flex-1 px-4 py-3 rounded-xl border-2 border-soft-yellow/50 bg-white focus:border-bright-accent focus:outline-none transition-colors"
                    />
                    <button
                      type="submit"
                      className="bg-bright-accent text-white font-bold px-6 py-3 rounded-xl hover:shadow-lg transition-all"
                    >
                      Notify Me
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-warm-green/30 rounded-full flex items-center justify-center">
                    <CheckIcon className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <span className="font-bold text-green-700">
                      You&apos;re on the list!
                    </span>
                    <p className="text-green-600 text-sm">
                      We&apos;ll email you when it&apos;s ready.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function BranchCard({
  name,
  tag,
  tagColor,
  buildNumber,
  time,
  status,
  progress,
}: {
  name: string
  tag: string
  tagColor: 'green' | 'purple' | 'orange'
  buildNumber?: number
  time: string
  status: 'ready' | 'building'
  progress?: number
}) {
  const tagColors = {
    green: 'bg-green-100 text-green-700',
    purple: 'bg-purple-100 text-purple-700',
    orange: 'bg-orange-100 text-orange-700',
  }

  const iconColors = {
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
  }

  return (
    <div
      className={`bg-white rounded-xl p-4 border ${status === 'building' ? 'border-orange-200' : 'border-gray-200'} shadow-sm`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div
            className={`w-8 h-8 ${iconColors[tagColor]} rounded-lg flex items-center justify-center ${status === 'building' ? 'animate-pulse' : ''}`}
          >
            {status === 'ready' ? (
              <CheckIcon className="w-4 h-4" />
            ) : (
              <ClockIcon className="w-4 h-4" />
            )}
          </div>
          <div>
            <div className="font-bold text-text-dark text-sm flex items-center gap-2">
              {name}
              <span className={`text-xs ${tagColors[tagColor]} px-2 py-0.5 rounded-full`}>
                {tag}
              </span>
            </div>
            <div className="text-xs text-text-light">
              {buildNumber ? `Build #${buildNumber} • ` : ''}
              {time}
            </div>
          </div>
        </div>
        {status === 'ready' && (
          <div className="flex gap-2">
            <div className="w-7 h-7 bg-gray-100 rounded flex items-center justify-center">
              <AppleIcon />
            </div>
            <div className="w-7 h-7 bg-gray-100 rounded flex items-center justify-center">
              <AndroidIcon />
            </div>
            <div className="w-7 h-7 bg-bright-accent/10 rounded flex items-center justify-center">
              <QrCodeIcon className="w-4 h-4 text-bright-accent" />
            </div>
          </div>
        )}
        {status === 'building' && (
          <div className="text-sm text-orange-600 font-medium">{progress}%</div>
        )}
      </div>
      {status === 'building' && progress !== undefined && (
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-orange-400 rounded-full transition-all"
            style={{ width: `${String(progress)}%` }}
          />
        </div>
      )}
    </div>
  )
}

function AppleIcon() {
  return (
    <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  )
}

function AndroidIcon() {
  return (
    <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.6 9.48l1.84-3.18c.16-.31.04-.69-.27-.85-.29-.15-.65-.06-.83.22l-1.88 3.24c-1.43-.59-3.03-.94-4.71-.94s-3.28.35-4.71.94L5.17 5.67c-.18-.28-.54-.37-.83-.22-.31.16-.43.54-.27.85L5.91 9.48C2.86 11.12.87 14.33 0 18h24c-.87-3.67-2.86-6.88-5.91-8.52zM7 15c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm10 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" />
    </svg>
  )
}
