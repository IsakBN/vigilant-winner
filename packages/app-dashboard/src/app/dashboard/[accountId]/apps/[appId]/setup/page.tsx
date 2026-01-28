'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useAppDetails, useRegenerateApiKey } from '@/hooks/useApp'
import { SetupInstructions, SetupSkeleton } from '@/components/apps/setup'
import { Button } from '@bundlenudge/shared-ui'
import { ErrorState } from '@/components/shared/ErrorState'

// ============================================================================
// Main Page
// ============================================================================

export default function SetupPage() {
  const params = useParams()
  const accountId = params.accountId as string
  const appId = params.appId as string

  const { data, isLoading, isError, error, refetch } = useAppDetails(accountId, appId)
  const regenerateKey = useRegenerateApiKey(accountId, appId)
  const [apiKey, setApiKey] = useState<string | null>(null)

  const handleGenerateKey = async () => {
    try {
      const result = await regenerateKey.mutateAsync()
      setApiKey(result.apiKey)
    } catch {
      // Error handled by mutation
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 max-w-2xl">
        <SetupSkeleton />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-6">
        <ErrorState
          message={error?.message ?? 'Failed to load app details'}
          onRetry={() => void refetch()}
        />
      </div>
    )
  }

  const app = data?.app
  if (!app) {
    return (
      <div className="p-6">
        <ErrorState message="App not found" />
      </div>
    )
  }

  // Use generated key, app's existing key, or show generate button
  const displayKey = apiKey ?? app.apiKey ?? null

  return (
    <div className="p-6 max-w-2xl">
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
