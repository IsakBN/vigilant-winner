import { GitHubIcon, CheckIcon, CheckBoldIcon, CloudDownloadIcon } from '@/components/icons'

export function Hero() {
  return (
    <section className="container-fluid py-24 lg:py-32 bg-pastel-blue/30 rounded-bl-3xl rounded-br-[8rem] my-8 shadow-lg">
      <div className="grid lg:grid-cols-2 gap-16 items-center">
        <div className="flex flex-col gap-8 lg:order-1">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 bg-warm-green/30 text-green-700 text-sm font-bold px-4 py-2 rounded-full">
              <GitHubIcon className="w-4 h-4" />
              Open Source - Self-Host Free
            </div>
            <h1 className="text-6xl lg:text-7xl font-black leading-tight tracking-tighter text-bright-accent">
              Push code.<br /><span className="text-text-dark">Update phones.</span>
            </h1>
            <p className="text-xl text-text-light max-w-xl leading-relaxed">
              OTA updates for React Native. Git push triggers deploy. No App Store review. No waiting.
              <strong className="text-text-dark"> Self-host for free or use our cloud.</strong>
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <button className="bg-bright-accent text-white text-lg font-bold px-10 py-5 rounded-xl shadow-md hover:shadow-lg hover:shadow-bright-accent/20 transition-all flex items-center gap-2">
              <GitHubIcon />
              Start with GitHub
            </button>
            <div className="flex items-center gap-3 px-6 py-5 text-base font-semibold text-text-light bg-cream-bg rounded-xl border border-pastel-blue/40 font-mono">
              <span className="text-text-light">$</span> npm install @bundlenudge/sdk
            </div>
          </div>
        </div>

        <div className="relative lg:order-2 p-8">
          <div className="relative bg-cream-bg/90 backdrop-blur-sm rounded-3xl p-8 shadow-md border border-white/50">
            {/* Terminal */}
            <div className="flex items-start gap-6">
              <div className="flex-1">
                <div className="bg-text-dark rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/10">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                    <span className="ml-2 text-white/40 text-xs">terminal</span>
                  </div>
                  <div className="font-mono text-xs text-white space-y-1">
                    <div><span className="text-white/50">$</span> git push origin main</div>
                    <div className="text-warm-green">&#10003; Bundle built &amp; deployed</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Flow indicator */}
            <div className="flex items-center justify-center my-6">
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-bright-accent animate-pulse" />
                  <div className="w-1.5 h-1.5 rounded-full bg-bright-accent/60 animate-pulse" style={{ animationDelay: '0.2s' }} />
                  <div className="w-1 h-1 rounded-full bg-bright-accent/30 animate-pulse" style={{ animationDelay: '0.4s' }} />
                </div>

                <div className="bg-bright-accent/10 border-2 border-bright-accent/30 rounded-2xl p-4 mx-4">
                  <div className="flex items-center gap-2">
                    <CloudDownloadIcon className="w-8 h-8 text-bright-accent" />
                    <div className="text-left">
                      <div className="text-xs font-bold text-bright-accent">BundleNudge</div>
                      <div className="text-[10px] text-text-light">v2.4.1 ready</div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-warm-green animate-pulse" />
                  <div className="w-1.5 h-1.5 rounded-full bg-warm-green/60 animate-pulse" style={{ animationDelay: '0.2s' }} />
                  <div className="w-1 h-1 rounded-full bg-warm-green/30 animate-pulse" style={{ animationDelay: '0.4s' }} />
                </div>
              </div>
            </div>

            {/* Devices */}
            <div className="flex items-end justify-center gap-3">
              <div className="transform -rotate-6 hover:rotate-0 transition-transform duration-300">
                <div className="w-16 bg-gray-900 rounded-xl p-1 shadow">
                  <div className="bg-white rounded-lg h-28 flex flex-col items-center justify-center">
                    <div className="w-6 h-6 rounded-full bg-warm-green/20 flex items-center justify-center mb-1">
                      <CheckBoldIcon className="w-3 h-3 text-warm-green" />
                    </div>
                    <div className="text-[8px] font-bold text-warm-green">Updated</div>
                  </div>
                </div>
                <div className="text-center mt-2">
                  <div className="text-[10px] text-text-light">iOS</div>
                </div>
              </div>

              <div className="transform hover:scale-105 transition-transform duration-300 -mt-4">
                <div className="w-20 bg-gray-900 rounded-xl p-1 shadow-lg">
                  <div className="bg-white rounded-lg h-36 flex flex-col items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-warm-green/20 flex items-center justify-center mb-1">
                      <CheckBoldIcon className="w-4 h-4 text-warm-green" />
                    </div>
                    <div className="text-[10px] font-bold text-warm-green">Updated</div>
                    <div className="text-[8px] text-text-light">v2.4.1</div>
                  </div>
                </div>
                <div className="text-center mt-2">
                  <div className="text-[10px] text-text-light">Android</div>
                </div>
              </div>

              <div className="transform rotate-6 hover:rotate-0 transition-transform duration-300">
                <div className="w-16 bg-gray-900 rounded-xl p-1 shadow">
                  <div className="bg-white rounded-lg h-28 flex flex-col items-center justify-center">
                    <div className="w-6 h-6 rounded-full bg-warm-green/20 flex items-center justify-center mb-1">
                      <CheckBoldIcon className="w-3 h-3 text-warm-green" />
                    </div>
                    <div className="text-[8px] font-bold text-warm-green">Updated</div>
                  </div>
                </div>
                <div className="text-center mt-2">
                  <div className="text-[10px] text-text-light">iPad</div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="mt-6 pt-4 border-t border-gray-200 flex items-center justify-center gap-6 text-center">
              <div>
                <div className="text-2xl font-black text-bright-accent">1,847</div>
                <div className="text-xs text-text-light">devices updated</div>
              </div>
              <div className="w-px h-8 bg-gray-200" />
              <div>
                <div className="text-2xl font-black text-warm-green">3.2s</div>
                <div className="text-xs text-text-light">deploy time</div>
              </div>
              <div className="w-px h-8 bg-gray-200" />
              <div>
                <div className="text-2xl font-black text-soft-yellow">100%</div>
                <div className="text-xs text-text-light">success rate</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-12 text-center">
        <p className="text-sm text-text-light flex items-center justify-center gap-3 flex-wrap">
          <span className="inline-flex items-center gap-1.5">
            <CheckIcon className="w-4 h-4 text-warm-green" />
            Open Source (BUSL-1.1)
          </span>
          <span className="text-text-light/30">-</span>
          <span className="inline-flex items-center gap-1.5">
            <CheckIcon className="w-4 h-4 text-warm-green" />
            Self-Host Forever Free
          </span>
          <span className="text-text-light/30">-</span>
          <span className="inline-flex items-center gap-1.5">
            <CheckIcon className="w-4 h-4 text-warm-green" />
            Managed Cloud Available
          </span>
        </p>
      </div>
    </section>
  )
}
