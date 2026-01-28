'use client'

import { useParams } from 'next/navigation'
import { AppNav } from '@/components/dashboard'
import { useAppDetails } from '@/hooks/useApp'
import { Skeleton } from '@bundlenudge/shared-ui'

interface AppDetailLayoutProps {
  children: React.ReactNode
}

export default function AppDetailLayout({ children }: AppDetailLayoutProps) {
  const params = useParams()
  const accountId = params.accountId as string
  const appId = params.appId as string

  const { data, isLoading } = useAppDetails(accountId, appId)

  const appName = data?.app?.name ?? ''

  return (
    <div className="flex flex-col">
      {isLoading ? (
        <AppNavSkeleton />
      ) : (
        <AppNav accountId={accountId} appId={appId} appName={appName} />
      )}
      {children}
    </div>
  )
}

function AppNavSkeleton() {
  return (
    <div className="border-b border-border bg-white">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-5 w-12" />
          <span className="text-text-light">/</span>
          <Skeleton className="h-6 w-32" />
        </div>
      </div>
      <nav className="flex gap-1 px-6 pb-2">
        {Array.from({ length: 9 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-20" />
        ))}
      </nav>
    </div>
  )
}
