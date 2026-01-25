'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export interface AppItem {
  id: string
  name: string
  platform: 'ios' | 'android' | 'both'
  lastRelease: string | null
}

export interface RecentAppsProps {
  apps: AppItem[]
  accountId: string
}

const platformLabels = {
  ios: 'iOS',
  android: 'Android',
  both: 'iOS & Android',
}

const platformColors = {
  ios: 'bg-pastel-blue/30 text-blue-700',
  android: 'bg-warm-green/30 text-green-700',
  both: 'bg-soft-yellow/30 text-amber-700',
}

function PlatformIcon({ platform }: { platform: AppItem['platform'] }) {
  if (platform === 'ios') {
    return (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
      </svg>
    )
  }
  if (platform === 'android') {
    return (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.6 9.48l1.84-3.18c.16-.31.04-.69-.26-.85-.29-.15-.65-.06-.83.22l-1.88 3.24a11.463 11.463 0 00-8.94 0L5.65 5.67c-.19-.29-.51-.38-.83-.22-.31.16-.43.54-.26.85L6.4 9.48A10.78 10.78 0 003 18h18a10.78 10.78 0 00-3.4-8.52zM8.5 14c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm7 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" />
      </svg>
    )
  }
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z" />
    </svg>
  )
}

function EmptyState({ accountId }: { accountId: string }) {
  return (
    <div className="text-center py-12 px-6">
      <div className="w-16 h-16 mx-auto mb-4 bg-pastel-blue/30 rounded-2xl flex items-center justify-center">
        <svg
          className="w-8 h-8 text-bright-accent"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
      </div>
      <h3 className="text-lg font-heading font-semibold text-text-dark mb-2">
        No apps yet
      </h3>
      <p className="text-text-light mb-6 max-w-sm mx-auto">
        Create your first app to start pushing OTA updates to your users.
      </p>
      <Button asChild>
        <Link href={`/dashboard/${accountId}/apps/new`}>Create App</Link>
      </Button>
    </div>
  )
}

export function RecentApps({ apps, accountId }: RecentAppsProps) {
  const displayApps = apps.slice(0, 5)

  return (
    <Card className="border-0 bg-white shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-lg font-heading font-semibold">
          Recent Apps
        </CardTitle>
        {apps.length > 0 && (
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/dashboard/${accountId}/apps`}>View all</Link>
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {apps.length === 0 ? (
          <EmptyState accountId={accountId} />
        ) : (
          <ul className="divide-y divide-border">
            {displayApps.map((app) => (
              <li key={app.id}>
                <Link
                  href={`/dashboard/${accountId}/apps/${app.id}`}
                  className="flex items-center justify-between py-4 hover:bg-muted/50 -mx-6 px-6 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center font-heading font-bold text-text-dark">
                      {app.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-text-dark">{app.name}</p>
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-xs mt-1',
                          platformColors[app.platform]
                        )}
                      >
                        <PlatformIcon platform={app.platform} />
                        <span className="ml-1">
                          {platformLabels[app.platform]}
                        </span>
                      </Badge>
                    </div>
                  </div>
                  <div className="text-sm text-text-light">
                    {app.lastRelease ?? 'No releases'}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
