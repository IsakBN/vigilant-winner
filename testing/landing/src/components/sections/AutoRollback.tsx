import { ShieldCheckIcon } from '../icons'

function AlertIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  )
}

function RewindIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
    </svg>
  )
}

export function AutoRollback() {
  return (
    <section className="container-main py-16 bg-red-50/50 rounded-bl-[8rem] rounded-tr-3xl my-6 shadow-lg">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Content */}
          <div>
            <div className="inline-flex items-center gap-2 bg-red-100 text-red-700 text-sm font-bold px-4 py-2 rounded-full mb-6">
              <ShieldCheckIcon className="w-5 h-5" />
              AUTO-ROLLBACK
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-text-dark mb-4">
              Ship Fearlessly
            </h2>
            <p className="text-xl text-text-light mb-8">
              Pushed a broken update? The SDK detects crashes and automatically reverts users to the last stable version. No manual intervention needed.
            </p>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-green-600 font-bold text-sm">1</span>
                </div>
                <div>
                  <div className="font-bold text-text-dark">Crash Detected</div>
                  <div className="text-text-light">SDK monitors app health after updates</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-green-600 font-bold text-sm">2</span>
                </div>
                <div>
                  <div className="font-bold text-text-dark">Automatic Revert</div>
                  <div className="text-text-light">Users restored to previous stable version</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-green-600 font-bold text-sm">3</span>
                </div>
                <div>
                  <div className="font-bold text-text-dark">You Get Notified</div>
                  <div className="text-text-light">Fix the bug and push again when ready</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Visualization */}
          <div className="bg-white rounded-2xl shadow-xl border border-red-100 overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center gap-3">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="text-sm text-text-light">Release Activity</div>
            </div>

            <div className="p-6 space-y-4">
              {/* Timeline */}
              <TimelineItem
                time="2:34 PM"
                icon={<CloudIcon className="w-4 h-4" />}
                iconBg="bg-bright-accent"
                title="v2.4.1 deployed"
                subtitle="Rolled out to 100% of users"
              />
              <TimelineItem
                time="2:36 PM"
                icon={<AlertIcon className="w-4 h-4" />}
                iconBg="bg-red-500"
                title="Crash detected"
                subtitle="3 devices affected"
                alert
              />
              <TimelineItem
                time="2:36 PM"
                icon={<RewindIcon className="w-4 h-4" />}
                iconBg="bg-amber-500"
                title="Auto-rollback triggered"
                subtitle="Reverting to v2.4.0..."
              />
              <TimelineItem
                time="2:36 PM"
                icon={<CheckCircleIcon className="w-4 h-4" />}
                iconBg="bg-green-500"
                title="Users restored"
                subtitle="All devices now on v2.4.0"
                success
              />

              {/* Status */}
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <ShieldCheckIcon className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="font-bold text-green-800">Protected</div>
                    <div className="text-sm text-green-600">All users on stable version</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function CloudIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    </svg>
  )
}

function CheckCircleIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

type TimelineItemProps = {
  time: string
  icon: React.ReactNode
  iconBg: string
  title: string
  subtitle: string
  alert?: boolean
  success?: boolean
}

function TimelineItem({ time, icon, iconBg, title, subtitle, alert, success }: TimelineItemProps) {
  let borderColor = 'border-gray-200'
  if (alert) borderColor = 'border-red-200 bg-red-50'
  if (success) borderColor = 'border-green-200 bg-green-50'

  return (
    <div className={`flex items-start gap-4 p-3 rounded-lg border ${borderColor}`}>
      <div className={`w-8 h-8 ${iconBg} rounded-full flex items-center justify-center flex-shrink-0 text-white`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-text-dark">{title}</div>
        <div className="text-sm text-text-light">{subtitle}</div>
      </div>
      <div className="text-xs text-text-light">{time}</div>
    </div>
  )
}
