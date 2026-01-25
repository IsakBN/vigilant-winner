export function Testing() {
  return (
    <section className="container-fluid py-24 bg-soft-yellow/30 rounded-bl-[7rem] rounded-tr-3xl my-8 shadow-xl shadow-soft-yellow/10">
      <div className="text-center mb-16 space-y-4">
        <div className="inline-flex items-center gap-2 bg-soft-yellow/50 text-amber-700 text-sm font-bold px-4 py-2 rounded-full">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          COMING SOON
        </div>
        <h2 className="text-5xl font-extrabold tracking-tight text-text-dark">
          Test Any Branch,<br />
          <span className="text-bright-accent">On Real Devices.</span>
        </h2>
        <p className="text-xl text-text-light max-w-3xl mx-auto">
          Connect multiple branches to generate .ipa and .apk test builds instantly.
          Share with your team via QR codes. All from one dashboard.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-12 items-center">
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
            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-text-dark">Test Builds</h3>
              <button className="bg-bright-accent text-white text-sm font-bold px-4 py-2 rounded-lg">
                + New Build
              </button>
            </div>

            {/* Branch list */}
            <div className="space-y-3">
              {/* Main branch */}
              <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-bold text-text-dark flex items-center gap-2">
                        main
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">production</span>
                      </div>
                      <div className="text-xs text-text-light">Build #247 - 2 hours ago</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center" title="iOS">
                      <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                      </svg>
                    </div>
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center" title="Android">
                      <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.6 9.48l1.84-3.18c.16-.31.04-.69-.27-.85-.29-.15-.65-.06-.83.22l-1.88 3.24c-1.43-.59-3.03-.94-4.71-.94s-3.28.35-4.71.94L5.17 5.67c-.18-.28-.54-.37-.83-.22-.31.16-.43.54-.27.85L5.91 9.48C2.86 11.12.87 14.33 0 18h24c-.87-3.67-2.86-6.88-5.91-8.52zM7 15c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm10 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/>
                      </svg>
                    </div>
                    <div className="w-8 h-8 bg-bright-accent/10 rounded-lg flex items-center justify-center" title="QR Code">
                      <svg className="w-4 h-4 text-bright-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Feature branch */}
              <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-bold text-text-dark flex items-center gap-2">
                        feature/new-checkout
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">staging</span>
                      </div>
                      <div className="text-xs text-text-light">Build #12 - 15 min ago</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                      </svg>
                    </div>
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.6 9.48l1.84-3.18c.16-.31.04-.69-.27-.85-.29-.15-.65-.06-.83.22l-1.88 3.24c-1.43-.59-3.03-.94-4.71-.94s-3.28.35-4.71.94L5.17 5.67c-.18-.28-.54-.37-.83-.22-.31.16-.43.54-.27.85L5.91 9.48C2.86 11.12.87 14.33 0 18h24c-.87-3.67-2.86-6.88-5.91-8.52zM7 15c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm10 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/>
                      </svg>
                    </div>
                    <div className="w-8 h-8 bg-bright-accent/10 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-bright-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hotfix branch */}
              <div className="bg-white rounded-xl p-4 border border-orange-200 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center animate-pulse">
                      <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-bold text-text-dark flex items-center gap-2">
                        hotfix/payment-bug
                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">building...</span>
                      </div>
                      <div className="text-xs text-text-light">Started 2 min ago</div>
                    </div>
                  </div>
                  <div className="text-sm text-orange-600 font-medium">
                    42%
                  </div>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full w-[42%] bg-orange-400 rounded-full transition-all" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Features list */}
        <div className="space-y-8">
          <div className="flex gap-5">
            <div className="w-14 h-14 bg-pastel-blue/30 rounded-2xl flex items-center justify-center flex-shrink-0">
              <svg className="w-7 h-7 text-bright-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-2 text-text-dark">Branch-Based Builds</h3>
              <p className="text-lg text-text-light leading-relaxed">
                Connect any branch from your repo. Push code, get a testable build automatically.
                Feature branches, hotfixes, experiments - all instantly available for testing.
              </p>
            </div>
          </div>

          <div className="flex gap-5">
            <div className="w-14 h-14 bg-soft-yellow/50 rounded-2xl flex items-center justify-center flex-shrink-0">
              <svg className="w-7 h-7 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-2 text-text-dark">iOS & Android Builds</h3>
              <p className="text-lg text-text-light leading-relaxed">
                Generate signed <strong>.ipa</strong> files for iOS and <strong>.apk/.aab</strong> for Android.
                Ad-hoc distribution, TestFlight uploads, or internal testing - we handle the builds.
              </p>
            </div>
          </div>

          <div className="flex gap-5">
            <div className="w-14 h-14 bg-warm-green/30 rounded-2xl flex items-center justify-center flex-shrink-0">
              <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-2 text-text-dark">QR Code Distribution</h3>
              <p className="text-lg text-text-light leading-relaxed">
                Share builds with your team instantly. Scan a QR code, install the app.
                No TestFlight invites, no Play Store internal testing setup.
              </p>
            </div>
          </div>

          <div className="flex gap-5">
            <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center flex-shrink-0">
              <svg className="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-2 text-text-dark">Tester Management</h3>
              <p className="text-lg text-text-light leading-relaxed">
                Invite testers by email. Manage device UDIDs for iOS ad-hoc builds.
                Track who has installed which version.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
