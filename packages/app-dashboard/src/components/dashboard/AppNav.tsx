'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@bundlenudge/shared-ui'

interface AppNavProps {
  accountId: string
  appId: string
  appName: string
}

const APP_NAV_ITEMS = [
  { href: '', label: 'Overview' },
  { href: '/setup', label: 'Setup' },
  { href: '/releases', label: 'Releases' },
  { href: '/channels', label: 'Channels' },
  { href: '/builds', label: 'Builds' },
  { href: '/devices', label: 'Devices' },
  { href: '/audience', label: 'Audience' },
  { href: '/testing', label: 'Testing' },
  { href: '/settings', label: 'Settings' },
]

export function AppNav({ accountId, appId, appName }: AppNavProps) {
  const pathname = usePathname()
  const basePath = `/dashboard/${accountId}/apps/${appId}`

  return (
    <div className="border-b border-border bg-white">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/dashboard/${accountId}/apps`}
            className="text-text-light hover:text-text-dark transition-colors"
          >
            ← Apps
          </Link>
          <span className="text-text-light">/</span>
          <h1 className="text-lg font-semibold text-text-dark">{appName}</h1>
        </div>
      </div>
      <nav className="flex gap-1 px-6 overflow-x-auto">
        {APP_NAV_ITEMS.map((item) => {
          const href = `${basePath}${item.href}`
          const isActive = item.href === ''
            ? pathname === basePath
            : pathname.startsWith(href)

          return (
            <Link
              key={item.label}
              href={href}
              className={cn(
                'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap',
                isActive
                  ? 'border-bright-accent text-bright-accent'
                  : 'border-transparent text-text-light hover:text-text-dark hover:border-gray-300'
              )}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
