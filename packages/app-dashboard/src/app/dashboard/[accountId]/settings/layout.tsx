'use client'

/**
 * Settings Layout
 *
 * Provides sidebar navigation for settings pages with a two-column layout.
 */

import { useParams } from 'next/navigation'
import { SettingsNav } from '@/components/settings'

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const accountId = params.accountId as string

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="mt-1 text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="flex gap-8">
        <SettingsNav accountId={accountId} />
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  )
}
