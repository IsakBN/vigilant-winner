'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  AppWindow,
  CreditCard,
  Settings,
  Flag,
  X,
  Shield,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface AdminSidebarProps {
  isOpen: boolean
  onClose: () => void
}

const NAV_ITEMS = [
  { href: '/admin', icon: LayoutDashboard, label: 'Overview' },
  { href: '/admin/users', icon: Users, label: 'Users' },
  { href: '/admin/apps', icon: AppWindow, label: 'Apps' },
  { href: '/admin/subscriptions', icon: CreditCard, label: 'Subscriptions' },
  { href: '/admin/feature-flags', icon: Flag, label: 'Feature Flags' },
  { href: '/admin/settings', icon: Settings, label: 'Settings' },
]

/**
 * Admin navigation sidebar
 *
 * Features:
 * - Navigation links with active states
 * - Admin badge indicator
 * - Responsive: slides in on mobile, fixed on desktop
 */
export function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-50 h-screen w-56 bg-white border-r border-border',
        'flex flex-col transition-transform duration-200 lg:translate-x-0',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      {/* Header with logo and close button */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-border">
        <Link href="/admin" className="flex items-center gap-2">
          <Image
            src="/logo-icon.svg"
            alt="BundleNudge"
            width={32}
            height={32}
            className="rounded-lg"
          />
          <span className="font-heading font-semibold text-lg text-text-dark">
            Admin
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

      {/* Admin indicator */}
      <div className="p-3 border-b border-border">
        <div className="flex items-center gap-2 px-3 py-2 bg-pastel-purple/20 rounded-md">
          <Shield className="w-4 h-4 text-pastel-purple" />
          <span className="text-sm font-medium text-text-dark">Super Admin</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(item.href)

          return (
            <NavLink
              key={item.label}
              href={item.href}
              active={isActive}
              onClick={onClose}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          )
        })}
      </nav>

      {/* Back to dashboard link */}
      <div className="p-3 border-t border-border">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-3 py-2 text-sm text-text-light hover:text-text-dark transition-colors"
        >
          <span>Back to Dashboard</span>
        </Link>
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
