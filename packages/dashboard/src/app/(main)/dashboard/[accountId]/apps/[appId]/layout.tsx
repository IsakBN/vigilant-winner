'use client'

import { useParams, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Home, Package, Smartphone, Settings, BookOpen, Radio } from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================================================
// Types
// ============================================================================

interface TabItem {
  label: string
  href: string
  icon: React.ReactNode
  exact?: boolean
}

// ============================================================================
// Tab Navigation
// ============================================================================

function TabNav({ tabs, currentPath }: { tabs: TabItem[]; currentPath: string }) {
  const isActive = (tab: TabItem) => {
    if (tab.exact) {
      return currentPath === tab.href
    }
    return currentPath.startsWith(tab.href)
  }

  return (
    <nav className="border-b border-neutral-200">
      <div className="flex gap-1">
        {tabs.map((tab) => {
          const active = isActive(tab)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors',
                'border-b-2 -mb-px',
                active
                  ? 'border-primary text-primary'
                  : 'border-transparent text-neutral-500 hover:text-neutral-900 hover:border-neutral-300'
              )}
            >
              {tab.icon}
              {tab.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

// ============================================================================
// Layout Component
// ============================================================================

export default function AppDetailLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const pathname = usePathname()

  const accountId = params.accountId as string
  const appId = params.appId as string
  const basePath = `/dashboard/${accountId}/apps/${appId}`

  const tabs: TabItem[] = [
    {
      label: 'Overview',
      href: basePath,
      icon: <Home className="w-4 h-4" />,
      exact: true,
    },
    {
      label: 'Releases',
      href: `${basePath}/releases`,
      icon: <Package className="w-4 h-4" />,
    },
    {
      label: 'Channels',
      href: `${basePath}/channels`,
      icon: <Radio className="w-4 h-4" />,
    },
    {
      label: 'Devices',
      href: `${basePath}/devices`,
      icon: <Smartphone className="w-4 h-4" />,
    },
    {
      label: 'Settings',
      href: `${basePath}/settings`,
      icon: <Settings className="w-4 h-4" />,
    },
    {
      label: 'Setup',
      href: `${basePath}/setup`,
      icon: <BookOpen className="w-4 h-4" />,
    },
  ]

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Tab Navigation */}
        <div className="bg-white rounded-t-xl border border-b-0 border-neutral-200 px-4">
          <TabNav tabs={tabs} currentPath={pathname} />
        </div>

        {/* Content */}
        <div className="bg-white rounded-b-xl border border-neutral-200 p-6">
          {children}
        </div>
      </div>
    </div>
  )
}
