'use client'

import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export interface QuickStatsProps {
  totalApps: number
  activeDevices: number
  recentReleases: number
}

interface StatItemProps {
  label: string
  value: number | string
  icon: React.ReactNode
  color: 'blue' | 'green' | 'yellow'
}

const colorClasses = {
  blue: 'bg-pastel-blue/40 text-bright-accent',
  green: 'bg-warm-green/40 text-green-700',
  yellow: 'bg-soft-yellow/40 text-amber-700',
}

function StatItem({ label, value, icon, color }: StatItemProps) {
  return (
    <Card className="border-0 bg-white shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div
            className={cn(
              'flex items-center justify-center w-12 h-12 rounded-xl',
              colorClasses[color]
            )}
          >
            {icon}
          </div>
          <div>
            <p className="text-sm text-text-light font-medium">{label}</p>
            <p className="text-2xl font-heading font-bold text-text-dark">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function AppsIcon() {
  return (
    <svg
      className="w-6 h-6"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
      />
    </svg>
  )
}

function DevicesIcon() {
  return (
    <svg
      className="w-6 h-6"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
      />
    </svg>
  )
}

function ReleasesIcon() {
  return (
    <svg
      className="w-6 h-6"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
      />
    </svg>
  )
}

export function QuickStats({
  totalApps,
  activeDevices,
  recentReleases,
}: QuickStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatItem
        label="Total Apps"
        value={totalApps}
        icon={<AppsIcon />}
        color="blue"
      />
      <StatItem
        label="Active Devices"
        value={activeDevices}
        icon={<DevicesIcon />}
        color="green"
      />
      <StatItem
        label="Releases (30d)"
        value={recentReleases}
        icon={<ReleasesIcon />}
        color="yellow"
      />
    </div>
  )
}
