export function OpenSource() {
  return (
    <section className="container-fluid py-24 bg-warm-green/20 rounded-tr-[6rem] rounded-bl-3xl my-8 shadow-xl shadow-warm-green/10">
      <div className="grid lg:grid-cols-2 gap-16 items-center">
        {/* Left: Message */}
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 bg-warm-green/30 text-green-700 text-sm font-bold px-4 py-2 rounded-full">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            OPEN SOURCE
          </div>

          <h2 className="text-5xl font-extrabold tracking-tight text-text-dark">
            Your Infrastructure,<br />
            <span className="text-bright-accent">Your Rules.</span>
          </h2>

          <p className="text-xl text-text-light leading-relaxed max-w-lg">
            BundleNudge is open source under the <strong>Business Source License 1.1</strong>.
            Self-host on your own servers forever, completely free. No vendor lock-in.
            Full control over your data and deployment pipeline.
          </p>

          <div className="flex flex-wrap gap-4">
            <a
              href="https://github.com/bundlenudge/bundlenudge"
              className="inline-flex items-center gap-2 bg-text-dark text-white text-lg font-bold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              View on GitHub
            </a>
            <a
              href="#"
              className="inline-flex items-center gap-2 bg-cream-bg text-text-dark text-lg font-bold px-8 py-4 rounded-xl shadow-md border-2 border-warm-green/50 hover:bg-warm-green/10 transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Self-Hosting Docs
            </a>
          </div>
        </div>

        {/* Right: Visual */}
        <div className="bg-cream-bg p-8 rounded-3xl shadow-lg border border-warm-green/30">
          <div className="space-y-6">
            {/* License badge */}
            <div className="flex items-center gap-4 p-4 bg-warm-green/20 rounded-xl">
              <div className="w-12 h-12 bg-warm-green/40 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h4 className="font-bold text-text-dark">BUSL-1.1 License</h4>
                <p className="text-sm text-text-light">Free for self-hosting, converts to Apache 2.0</p>
              </div>
            </div>

            {/* Self-host benefits */}
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-bright-accent/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                  <svg className="w-4 h-4 text-bright-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-bold text-text-dark">Deploy Anywhere</h4>
                  <p className="text-sm text-text-light">AWS, GCP, Azure, DigitalOcean, or your own bare metal servers</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-bright-accent/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                  <svg className="w-4 h-4 text-bright-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-bold text-text-dark">Full Data Ownership</h4>
                  <p className="text-sm text-text-light">Your bundles, your servers, your data. Nothing leaves your infrastructure</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-bright-accent/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                  <svg className="w-4 h-4 text-bright-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-bold text-text-dark">No Usage Limits</h4>
                  <p className="text-sm text-text-light">Unlimited apps, unlimited updates, unlimited devices when self-hosted</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-bright-accent/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                  <svg className="w-4 h-4 text-bright-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-bold text-text-dark">Community Driven</h4>
                  <p className="text-sm text-text-light">Contribute features, report issues, shape the roadmap</p>
                </div>
              </div>
            </div>

            {/* Docker command */}
            <div className="bg-text-dark rounded-xl p-4 font-mono text-sm">
              <div className="text-white/50 mb-2"># Get started in 60 seconds</div>
              <div className="text-white">
                <span className="text-warm-green">docker run</span> -d -p 3000:3000 \<br />
                &nbsp;&nbsp;bundlenudge/bundlenudge:latest
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
