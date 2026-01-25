'use client'

import { Smartphone, Package, Download } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

// ============================================================================
// Types
// ============================================================================

interface AppStatsProps {
  activeDevices: number
  totalReleases: number
  downloadsThisMonth: number
  isLoading?: boolean
}

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string
  subtext?: string
  iconClassName?: string
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}k`
  }
  return num.toLocaleString()
}

// ============================================================================
// Stat Card Component
// ============================================================================

function StatCard({ icon, label, value, subtext, iconClassName }: StatCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className={cn(
            'flex items-center justify-center w-10 h-10 rounded-lg',
            iconClassName || 'bg-neutral-100'
          )}>
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-neutral-500 mb-1">{label}</p>
            <p className="text-2xl font-semibold text-neutral-900">{value}</p>
            {subtext && (
              <p className="text-xs text-neutral-400 mt-1">{subtext}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// Loading State
// ============================================================================

function AppStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Skeleton className="w-10 h-10 rounded-lg" />
              <div className="flex-1">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-24" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export function AppStats({
  activeDevices,
  totalReleases,
  downloadsThisMonth,
  isLoading,
}: AppStatsProps) {
  if (isLoading) {
    return <AppStatsSkeleton />
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatCard
        icon={<Smartphone className="w-5 h-5 text-blue-600" />}
        iconClassName="bg-blue-100"
        label="Active Devices"
        value={formatNumber(activeDevices)}
        subtext="Last 30 days"
      />
      <StatCard
        icon={<Package className="w-5 h-5 text-green-600" />}
        iconClassName="bg-green-100"
        label="Total Releases"
        value={formatNumber(totalReleases)}
      />
      <StatCard
        icon={<Download className="w-5 h-5 text-purple-600" />}
        iconClassName="bg-purple-100"
        label="Downloads"
        value={formatNumber(downloadsThisMonth)}
        subtext="This month"
      />
    </div>
  )
}
