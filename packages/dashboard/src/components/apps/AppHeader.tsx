'use client'

import Link from 'next/link'
import { ArrowLeft, Pencil } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

// ============================================================================
// Types
// ============================================================================

interface AppHeaderProps {
  appId: string
  accountId: string
  name: string
  platform: 'ios' | 'android' | 'both'
  bundleId: string
  isLoading?: boolean
  onEdit?: () => void
}

// ============================================================================
// Helper Components
// ============================================================================

function PlatformBadge({ platform }: { platform: 'ios' | 'android' | 'both' }) {
  const config = {
    ios: { label: 'iOS', className: 'bg-blue-100 text-blue-700 border-blue-200' },
    android: { label: 'Android', className: 'bg-green-100 text-green-700 border-green-200' },
    both: { label: 'iOS + Android', className: 'bg-purple-100 text-purple-700 border-purple-200' },
  }

  const { label, className } = config[platform]

  return (
    <Badge className={cn('border', className)}>
      {label}
    </Badge>
  )
}

function AppIcon({ platform }: { platform: 'ios' | 'android' | 'both' }) {
  return (
    <div className={cn(
      'flex items-center justify-center w-12 h-12 rounded-xl',
      platform === 'ios' ? 'bg-blue-100' :
      platform === 'android' ? 'bg-green-100' : 'bg-purple-100'
    )}>
      {platform === 'ios' && (
        <svg className="w-6 h-6 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
        </svg>
      )}
      {platform === 'android' && (
        <svg className="w-6 h-6 text-green-600" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.6 11.4l1.6-2.7c.1-.2 0-.4-.2-.5-.2-.1-.4 0-.5.2l-1.6 2.8c-1.2-.5-2.5-.8-3.9-.8s-2.7.3-3.9.8L7.5 8.4c-.1-.2-.3-.3-.5-.2-.2.1-.3.3-.2.5l1.6 2.7c-2.5 1.4-4.2 4-4.4 7H22c-.2-3-1.9-5.6-4.4-7m-7.1 3.9c-.4 0-.8-.4-.8-.8s.4-.8.8-.8.8.4.8.8-.4.8-.8.8m5 0c-.4 0-.8-.4-.8-.8s.4-.8.8-.8.8.4.8.8-.4.8-.8.8"/>
        </svg>
      )}
      {platform === 'both' && (
        <svg className="w-6 h-6 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="5" y="2" width="14" height="20" rx="3" />
          <line x1="12" y1="18" x2="12" y2="18" strokeLinecap="round" />
        </svg>
      )}
    </div>
  )
}

// ============================================================================
// Loading State
// ============================================================================

function AppHeaderSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-4 w-24" />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="w-12 h-12 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </div>
        <Skeleton className="h-9 w-20" />
      </div>
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export function AppHeader({
  appId: _appId,
  accountId,
  name,
  platform,
  bundleId,
  isLoading,
  onEdit,
}: AppHeaderProps) {
  if (isLoading) {
    return <AppHeaderSkeleton />
  }

  return (
    <div className="space-y-4">
      <Link
        href={`/dashboard/${accountId}`}
        className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Apps
      </Link>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <AppIcon platform={platform} />
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-neutral-900">{name}</h1>
              <PlatformBadge platform={platform} />
            </div>
            <p className="text-sm text-neutral-500 font-mono mt-1">{bundleId}</p>
          </div>
        </div>

        {onEdit && (
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Pencil className="w-4 h-4 mr-2" />
            Edit
          </Button>
        )}
      </div>
    </div>
  )
}
