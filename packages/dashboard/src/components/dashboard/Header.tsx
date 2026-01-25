'use client'

import { usePathname } from 'next/navigation'
import { Menu, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { UserDropdown } from './UserDropdown'

interface HeaderProps {
  onMenuToggle: () => void
}

/**
 * Top header bar
 *
 * Features:
 * - Mobile menu toggle button
 * - Breadcrumb navigation
 * - User dropdown menu (profile, settings, logout)
 */
export function Header({ onMenuToggle }: HeaderProps) {
  const pathname = usePathname()
  const breadcrumbs = generateBreadcrumbs(pathname)

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-sm border-b border-border">
      <div className="h-full mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Left side: Menu toggle + Breadcrumbs */}
        <div className="flex items-center gap-4">
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuToggle}
            className="lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </Button>

          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="hidden sm:block">
            <ol className="flex items-center gap-1.5 text-sm">
              {breadcrumbs.map((crumb, index) => (
                <li key={crumb.href} className="flex items-center gap-1.5">
                  {index > 0 && (
                    <ChevronRight className="w-4 h-4 text-text-light" />
                  )}
                  {index === breadcrumbs.length - 1 ? (
                    <span className="font-medium text-text-dark">
                      {crumb.label}
                    </span>
                  ) : (
                    <Link
                      href={crumb.href}
                      className="text-text-light hover:text-text-dark transition-colors"
                    >
                      {crumb.label}
                    </Link>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        </div>

        {/* Right side: User dropdown */}
        <UserDropdown />
      </div>
    </header>
  )
}

interface Breadcrumb {
  label: string
  href: string
}

function generateBreadcrumbs(pathname: string): Breadcrumb[] {
  const segments = pathname.split('/').filter(Boolean)
  const breadcrumbs: Breadcrumb[] = []

  // Always start with Dashboard
  if (segments[0] === 'dashboard' && segments.length >= 2) {
    const accountId = segments[1]
    breadcrumbs.push({
      label: 'Dashboard',
      href: `/dashboard/${accountId}`,
    })

    // Add remaining segments
    for (let i = 2; i < segments.length; i++) {
      const segment = segments[i]
      const href = `/${segments.slice(0, i + 1).join('/')}`
      breadcrumbs.push({
        label: formatSegment(segment),
        href,
      })
    }
  }

  return breadcrumbs.length > 0
    ? breadcrumbs
    : [{ label: 'Dashboard', href: '/dashboard' }]
}

function formatSegment(segment: string): string {
  // Handle common segments
  const labels: Record<string, string> = {
    apps: 'Apps',
    releases: 'Releases',
    devices: 'Devices',
    team: 'Team',
    settings: 'Settings',
    new: 'New',
    edit: 'Edit',
  }

  return labels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)
}
