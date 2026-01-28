import { ShieldCheckIcon } from './icons'

/** Eye/visibility icon */
function EyeIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  )
}

/** Message/chat icon */
function MessageIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  )
}

/** Refresh/rollback icon */
function RollbackIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  )
}

/** Checkmark circle icon */
function CheckCircleIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

export function VersionControlCenter() {
  return (
    <section className="container-fluid py-16 bg-pastel-blue/20 rounded-tr-[6rem] rounded-bl-3xl my-6 shadow-lg">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-pastel-blue/40 text-blue-700 text-sm font-bold px-4 py-2 rounded-full mb-6">
            <EyeIcon className="w-5 h-5" />
            VERSION CONTROL CENTER
          </div>
          <h2 className="text-5xl font-extrabold tracking-tight text-text-dark mb-4">
            See Everything. Control Everything.
          </h2>
          <p className="text-xl text-text-light max-w-2xl mx-auto">
            Real-time visibility into every version running in the wild, with automatic protection built in.
          </p>
        </div>

        {/* Main dashboard visualization */}
        <div className="bg-cream-bg rounded-3xl shadow-xl border border-pastel-blue/30 overflow-hidden mb-10">
          {/* Window chrome */}
          <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
            </div>
            <div className="flex-1 bg-gray-100 rounded-lg px-4 py-1.5 text-sm text-text-light">
              app.bundlenudge.com/myapp/versions
            </div>
          </div>

          {/* Dashboard content */}
          <div className="p-6">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Left: Version distribution */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="font-bold text-text-dark flex items-center gap-2">
                  <EyeIcon className="w-5 h-5 text-bright-accent" />
                  Live Version Distribution
                </h3>

                {/* Version bars */}
                <div className="space-y-3">
                  <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-text-dark">v2.4.1</span>
                        <span className="text-xs bg-warm-green/20 text-green-700 px-2 py-0.5 rounded-full">latest</span>
                      </div>
                      <span className="text-sm font-mono text-bright-accent">68%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full w-[68%] bg-bright-accent rounded-full" />
                    </div>
                    <div className="text-xs text-text-light mt-1">34,200 users</div>
                  </div>

                  <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-text-dark">v2.4.0</span>
                        <span className="text-xs bg-soft-yellow/30 text-amber-700 px-2 py-0.5 rounded-full">update available</span>
                      </div>
                      <span className="text-sm font-mono text-soft-yellow">24%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full w-[24%] bg-soft-yellow rounded-full" />
                    </div>
                    <div className="text-xs text-text-light mt-1">12,100 users</div>
                  </div>

                  <div className="bg-white rounded-xl p-4 border border-red-100">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-text-dark">v2.3.x</span>
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">outdated</span>
                      </div>
                      <span className="text-sm font-mono text-red-500">8%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full w-[8%] bg-red-400 rounded-full" />
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-text-light">4,000 users</span>
                      <button className="text-xs text-bright-accent font-medium hover:underline">Send update nudge</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: In-app message composer */}
              <div className="space-y-4">
                <h3 className="font-bold text-text-dark flex items-center gap-2">
                  <MessageIcon className="w-5 h-5 text-purple-500" />
                  In-App Message
                </h3>

                <div className="bg-white rounded-xl p-4 border border-purple-200 space-y-3">
                  <div className="text-sm text-text-light">Target: v2.3.x users</div>

                  {/* Message preview */}
                  <div className="bg-gradient-to-br from-purple-50 to-pastel-blue/20 rounded-xl p-4 border border-purple-100">
                    <div className="text-sm font-medium text-text-dark mb-1">A new version is available!</div>
                    <div className="text-xs text-text-light mb-3">
                      Update to v2.4.1 for improved performance and bug fixes.
                    </div>
                    <div className="flex gap-2">
                      <button className="flex-1 bg-bright-accent text-white text-xs font-bold py-2 rounded-lg">
                        Update Now
                      </button>
                      <button className="px-3 py-2 text-xs text-text-light border border-gray-200 rounded-lg">
                        Later
                      </button>
                    </div>
                  </div>

                  <button className="w-full bg-purple-500 text-white font-bold py-2.5 rounded-xl hover:bg-purple-600 transition-colors text-sm">
                    Send to 4,000 users
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Auto-rollback section */}
        <div className="bg-gradient-to-br from-warm-green/10 via-cream-bg to-red-50/30 rounded-3xl p-6 md:p-8 border border-warm-green/30">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 bg-warm-green/30 text-green-700 text-sm font-bold px-4 py-2 rounded-full mb-4">
              <ShieldCheckIcon className="w-5 h-5" />
              AUTO ROLLBACK
            </div>
            <h3 className="text-3xl font-extrabold text-text-dark mb-3">
              Your Safety Net
            </h3>
            <p className="text-lg text-text-light max-w-2xl mx-auto">
              Automatic rollback protection that matches your risk tolerance
            </p>
          </div>

          {/* Tiered rollback cards */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Free/Pro tier */}
            <div className="bg-cream-bg rounded-2xl p-6 border border-warm-green/30 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-warm-green/20 rounded-xl flex items-center justify-center">
                  <RollbackIcon className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <div className="font-bold text-text-dark">Free & Pro</div>
                  <div className="text-sm text-text-light">Crash-based rollback</div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 border border-gray-100 mb-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium text-text-dark text-sm">Crash within 10 seconds?</div>
                    <div className="text-text-light text-sm">Automatic rollback to previous stable version</div>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-text-light">
                  <CheckCircleIcon className="w-4 h-4 text-warm-green" />
                  Instant crash detection
                </div>
                <div className="flex items-center gap-2 text-text-light">
                  <CheckCircleIcon className="w-4 h-4 text-warm-green" />
                  Zero user action required
                </div>
                <div className="flex items-center gap-2 text-text-light">
                  <CheckCircleIcon className="w-4 h-4 text-warm-green" />
                  App stays functional
                </div>
              </div>
            </div>

            {/* Team/Enterprise tier */}
            <div className="bg-cream-bg rounded-2xl p-6 border-2 border-bright-accent/40 shadow-xl relative">
              <div className="absolute -top-3 right-4 bg-bright-accent text-white text-xs font-bold px-3 py-1 rounded-full">
                ADVANCED
              </div>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-bright-accent/20 rounded-xl flex items-center justify-center">
                  <CheckCircleIcon className="w-6 h-6 text-bright-accent" />
                </div>
                <div>
                  <div className="font-bold text-text-dark">Team & Enterprise</div>
                  <div className="text-sm text-text-light">Milestone-based rollback</div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 border border-bright-accent/20 mb-4">
                <div className="text-sm font-medium text-text-dark mb-3">Update commits only after:</div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 bg-pastel-blue/10 px-3 py-2 rounded-lg text-sm">
                    <CheckCircleIcon className="w-4 h-4 text-bright-accent" />
                    <span>User completes checkout</span>
                  </div>
                  <div className="flex items-center gap-2 bg-pastel-blue/10 px-3 py-2 rounded-lg text-sm">
                    <CheckCircleIcon className="w-4 h-4 text-bright-accent" />
                    <span>Login succeeds</span>
                  </div>
                  <div className="flex items-center gap-2 bg-pastel-blue/10 px-3 py-2 rounded-lg text-sm">
                    <CheckCircleIcon className="w-4 h-4 text-bright-accent" />
                    <span>Custom milestone reached</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-text-light">
                  <CheckCircleIcon className="w-4 h-4 text-bright-accent" />
                  Define critical user journeys
                </div>
                <div className="flex items-center gap-2 text-text-light">
                  <CheckCircleIcon className="w-4 h-4 text-bright-accent" />
                  Protect revenue-critical flows
                </div>
                <div className="flex items-center gap-2 text-text-light">
                  <CheckCircleIcon className="w-4 h-4 text-bright-accent" />
                  Rollback before damage is done
                </div>
              </div>
            </div>
          </div>

          {/* Flow diagram */}
          <div className="mt-10 bg-cream-bg rounded-2xl p-6 border border-gray-200">
            <div className="text-center text-sm font-medium text-text-light mb-4">How it works</div>
            <div className="flex flex-col md:flex-row items-center justify-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-bright-accent/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-bright-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                  </svg>
                </div>
                <span className="font-medium text-text-dark">Update Applied</span>
              </div>

              <svg className="w-6 h-6 text-text-light/30 rotate-90 md:rotate-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-soft-yellow/30 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <span className="font-medium text-text-dark">Monitoring</span>
              </div>

              <svg className="w-6 h-6 text-text-light/30 rotate-90 md:rotate-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-warm-green/30 rounded-lg flex items-center justify-center">
                  <CheckCircleIcon className="w-5 h-5 text-green-600" />
                </div>
                <span className="font-medium text-text-dark">Checkpoint</span>
              </div>

              <svg className="w-6 h-6 text-text-light/30 rotate-90 md:rotate-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>

              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-warm-green/30 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="font-medium text-warm-green">Committed</span>
                </div>
                <span className="text-xs text-text-light">or</span>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <RollbackIcon className="w-5 h-5 text-red-500" />
                  </div>
                  <span className="font-medium text-red-500">Rolled Back</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
