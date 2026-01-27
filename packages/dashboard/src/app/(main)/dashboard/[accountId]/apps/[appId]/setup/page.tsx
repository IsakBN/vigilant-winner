'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useApp, useRegenerateApiKey } from '@/hooks/useApp'
import { SetupInstructions } from '@/components/apps/SetupInstructions'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

// ============================================================================
// Loading State
// ============================================================================

function SetupPageSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton className="w-7 h-7 rounded-full" />
            <Skeleton className="h-6 w-48" />
          </div>
          <div className="ml-10">
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ============================================================================
// Main Page
// ============================================================================

export default function SetupPage() {
  const params = useParams()
  const appId = params.appId as string

  const { data: app, isLoading, error } = useApp(appId)
  const regenerateKey = useRegenerateApiKey(appId)
  const [apiKey, setApiKey] = useState<string | null>(null)

  const handleGenerateKey = async () => {
    try {
      const result = await regenerateKey.mutateAsync()
      setApiKey(result.apiKey)
    } catch {
      // Error handled by mutation
    }
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg mb-4">
          Failed to load app details
        </div>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    )
  }

  if (isLoading) {
    return <SetupPageSkeleton />
  }

  // Use generated key, app's existing key, or show generate button
  const displayKey = apiKey ?? app?.apiKey ?? null

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900">Setup Guide</h1>
        <p className="text-neutral-500 mt-1">
          Follow these steps to integrate BundleNudge into your React Native app.
        </p>
      </div>

      {displayKey ? (
        <SetupInstructions appId={appId} apiKey={displayKey} />
      ) : (
        <div className="space-y-6">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-amber-800 text-sm">
              You need an API key to complete the setup. Generate one below.
            </p>
          </div>
          <Button onClick={handleGenerateKey} disabled={regenerateKey.isPending}>
            {regenerateKey.isPending ? 'Generating...' : 'Generate API Key'}
          </Button>
        </div>
      )}
    </div>
  )
}
