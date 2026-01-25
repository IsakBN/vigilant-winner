'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  LayoutGrid,
  Rocket,
  Smartphone,
  Users,
  Settings,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { AccountSwitcher } from './AccountSwitcher'
import { UserMenu } from './UserMenu'

interface SidebarProps {
  accountId: string
  isOpen: boolean
  onClose: () => void
}

const NAV_ITEMS = [
  { href: '', icon: LayoutGrid, label: 'Apps' },
  { href: '/releases', icon: Rocket, label: 'Releases' },
  { href: '/devices', icon: Smartphone, label: 'Devices' },
  { href: '/team', icon: Users, label: 'Team' },
  { href: '/settings', icon: Settings, label: 'Settings' },
]

/**
 * Navigation sidebar
 *
 * Features:
 * - Account switcher at the top
 * - Navigation links with active states
 * - User menu at the bottom
 * - Responsive: slides in on mobile, fixed on desktop
 */
export function Sidebar({ accountId, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const basePath = `/dashboard/${accountId}`

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-50 h-screen w-56 bg-white border-r border-border flex flex-col transition-transform duration-200 lg:translate-x-0',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      {/* Header with logo and close button */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-border">
        <Link href={basePath} className="flex items-center gap-2">
          <Image
            src="/logo-icon.svg"
            alt="BundleNudge"
            width={32}
            height={32}
            className="rounded-lg"
          />
          <span className="font-heading font-semibold text-lg text-text-dark">
            BundleNudge
          </span>
        </Link>

        {/* Mobile close button */}
        <button
          type="button"
          onClick={onClose}
          className="lg:hidden p-1.5 text-text-light hover:text-text-dark transition-colors"
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Account switcher */}
      <div className="p-3 border-b border-border">
        <AccountSwitcher accountId={accountId} />
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const href = `${basePath}${item.href}`
          const isActive =
            item.href === ''
              ? pathname === basePath || pathname.startsWith(`${basePath}/apps`)
              : pathname.startsWith(href)

          return (
            <NavLink
              key={item.label}
              href={href}
              active={isActive}
              onClick={onClose}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          )
        })}
      </nav>

      {/* User section */}
      <div className="p-3 border-t border-border">
        <UserMenu />
      </div>
    </aside>
  )
}

interface NavLinkProps {
  href: string
  active: boolean
  onClick?: () => void
  children: React.ReactNode
}

function NavLink({ href, active, onClick, children }: NavLinkProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md transition-colors',
        active
          ? 'bg-bright-accent text-white'
          : 'text-text-light hover:text-text-dark hover:bg-muted'
      )}
    >
      {children}
    </Link>
  )
}
