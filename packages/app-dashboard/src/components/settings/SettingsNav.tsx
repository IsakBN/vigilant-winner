'use client'

/**
 * SettingsNav Component
 *
 * Vertical navigation for settings pages.
 */

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { User, CreditCard, BarChart3, Webhook, Puzzle } from 'lucide-react'
import { cn } from '@bundlenudge/shared-ui'

interface SettingsNavProps {
  accountId: string
}

const SETTINGS_NAV_ITEMS = [
  { href: '', icon: User, label: 'Profile' },
  { href: '/billing', icon: CreditCard, label: 'Billing' },
  { href: '/usage', icon: BarChart3, label: 'Usage' },
  { href: '/webhooks', icon: Webhook, label: 'Webhooks' },
  { href: '/integrations', icon: Puzzle, label: 'Integrations' },
]

export function SettingsNav({ accountId }: SettingsNavProps) {
  const pathname = usePathname()
  const basePath = `/dashboard/${accountId}/settings`

  return (
    <nav className="w-48 flex-shrink-0">
      <div className="space-y-1">
        {SETTINGS_NAV_ITEMS.map((item) => {
          const href = `${basePath}${item.href}`
          const isActive = item.href === ''
            ? pathname === basePath
            : pathname.startsWith(href)

          return (
            <Link
              key={item.label}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors',
                isActive
                  ? 'bg-bright-accent/10 text-bright-accent'
                  : 'text-text-light hover:text-text-dark hover:bg-muted'
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
