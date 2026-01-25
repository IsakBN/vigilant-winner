'use client'

import Image from 'next/image'
import { LogOut } from 'lucide-react'
import { useAuth } from '@/providers/AuthProvider'
import { Button } from '@/components/ui/button'

/**
 * User menu displayed at the bottom of the sidebar
 *
 * Shows user avatar, name, email, and logout button
 */
export function UserMenu() {
  const { user, logout } = useAuth()

  const displayName = user?.name || user?.email?.split('@')[0] || 'User'
  const initials = displayName.charAt(0).toUpperCase()

  return (
    <div className="flex items-center gap-3">
      {/* User avatar */}
      {user?.image ? (
        <Image
          src={user.image}
          alt={displayName}
          width={36}
          height={36}
          className="rounded-full shrink-0"
        />
      ) : (
        <div className="w-9 h-9 rounded-full bg-pastel-blue flex items-center justify-center shrink-0">
          <span className="text-sm font-medium text-text-dark">{initials}</span>
        </div>
      )}

      {/* User info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-dark truncate">
          {displayName}
        </p>
        {user?.email && (
          <p className="text-xs text-text-light truncate">{user.email}</p>
        )}
      </div>

      {/* Logout button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={logout}
        className="shrink-0 text-text-light hover:text-text-dark"
        title="Sign out"
      >
        <LogOut className="w-4 h-4" />
      </Button>
    </div>
  )
}
