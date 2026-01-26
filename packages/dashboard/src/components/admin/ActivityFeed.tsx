'use client'

import {
  UserPlus,
  AppWindow,
  Rocket,
  CreditCard,
  XCircle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { ActivityItem, ActivityType } from '@/lib/api'

interface ActivityFeedProps {
  items: ActivityItem[] | undefined
  isLoading: boolean
}

/**
 * Recent activity list
 *
 * Displays recent platform-wide activity events
 */
export function ActivityFeed({ items, isLoading }: ActivityFeedProps) {
  if (isLoading) {
    return <ActivityFeedSkeleton />
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-text-dark">
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!items || items.length === 0 ? (
          <div className="py-8 text-center text-text-light">
            <p className="text-sm">No recent activity</p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item, index) => (
              <ActivityRow
                key={item.id}
                item={item}
                isLast={index === items.length - 1}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface ActivityRowProps {
  item: ActivityItem
  isLast: boolean
}

function ActivityRow({ item, isLast }: ActivityRowProps) {
  const config = ACTIVITY_CONFIG[item.type]

  return (
    <div className={cn('flex gap-4', !isLast && 'pb-4 border-b border-border')}>
      <div className={cn('p-2 rounded-lg h-fit', config.bgColor)}>
        <config.icon className={cn('w-4 h-4', config.iconColor)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-text-dark">
          <span className="font-medium">{config.label}</span>
          {' '}
          {renderActivityDetails(item)}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-text-light truncate">
            {item.userEmail}
          </span>
          <span className="text-xs text-text-light">
            {formatTimestamp(item.createdAt)}
          </span>
        </div>
      </div>
    </div>
  )
}

function renderActivityDetails(item: ActivityItem): React.ReactNode {
  const metadata = item.metadata as Record<string, string | undefined>

  switch (item.type) {
    case 'user_signup':
      return metadata.name ? `- ${metadata.name}` : ''
    case 'app_created':
      return (
        <>
          - <span className="font-medium">{metadata.appName}</span>
          {metadata.platform && ` (${metadata.platform})`}
        </>
      )
    case 'release_published':
      return (
        <>
          - v{metadata.version} for{' '}
          <span className="font-medium">{metadata.appName}</span>
        </>
      )
    case 'subscription_started':
      return metadata.plan ? ` - ${metadata.plan} plan` : ''
    case 'subscription_cancelled':
      return metadata.plan ? ` - ${metadata.plan} plan` : ''
    default:
      return ''
  }
}

function ActivityFeedSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-32" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4 pb-4 border-b border-border last:border-0 last:pb-0">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <div className="flex-1">
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// =============================================================================
// Configuration
// =============================================================================

const ACTIVITY_CONFIG: Record<
  ActivityType,
  {
    icon: typeof UserPlus
    label: string
    bgColor: string
    iconColor: string
  }
> = {
  user_signup: {
    icon: UserPlus,
    label: 'New user signed up',
    bgColor: 'bg-pastel-blue/10',
    iconColor: 'text-pastel-blue',
  },
  app_created: {
    icon: AppWindow,
    label: 'App created',
    bgColor: 'bg-pastel-green/10',
    iconColor: 'text-pastel-green',
  },
  release_published: {
    icon: Rocket,
    label: 'Release published',
    bgColor: 'bg-pastel-purple/10',
    iconColor: 'text-pastel-purple',
  },
  subscription_started: {
    icon: CreditCard,
    label: 'Subscription started',
    bgColor: 'bg-pastel-green/10',
    iconColor: 'text-pastel-green',
  },
  subscription_cancelled: {
    icon: XCircle,
    label: 'Subscription cancelled',
    bgColor: 'bg-pastel-orange/10',
    iconColor: 'text-pastel-orange',
  },
}

// =============================================================================
// Helpers
// =============================================================================

function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`

  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`

  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
