/**
 * Avatar Component
 *
 * Shared avatar component with image, initials fallback, and generic icon.
 * Replaces duplicated UserAvatar/MemberAvatar implementations.
 */

import * as React from 'react'
import { cn } from '../lib/utils'

const sizeClasses = {
  sm: 'w-6 h-6 text-xs',
  md: 'w-8 h-8 text-sm',
  lg: 'w-10 h-10 text-base',
} as const

export interface AvatarProps {
  src?: string | null
  name?: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

/**
 * Get initials from a name (first letter, uppercase)
 */
function getInitial(name: string | null | undefined): string {
  if (!name || name.trim().length === 0) {
    return ''
  }
  return name.trim().charAt(0).toUpperCase()
}

/**
 * Generic user icon SVG for when no name is available
 */
function UserIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn('w-1/2 h-1/2', className)}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  )
}

export function Avatar({ src, name, size = 'md', className }: AvatarProps) {
  const initial = getInitial(name)
  const sizeClass = sizeClasses[size]

  // Image avatar
  if (src) {
    return (
      <img
        src={src}
        alt={name ?? 'User avatar'}
        className={cn(
          sizeClass,
          'rounded-full object-cover border border-neutral-200',
          className
        )}
      />
    )
  }

  // Initials fallback
  if (initial) {
    return (
      <div
        className={cn(
          sizeClass,
          'rounded-full bg-neutral-100 text-neutral-600 flex items-center justify-center font-medium border border-neutral-200',
          className
        )}
      >
        {initial}
      </div>
    )
  }

  // Generic user icon fallback
  return (
    <div
      className={cn(
        sizeClass,
        'rounded-full bg-neutral-100 text-neutral-400 flex items-center justify-center border border-neutral-200',
        className
      )}
    >
      <UserIcon />
    </div>
  )
}
