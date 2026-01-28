'use client'

import { RefreshCw } from 'lucide-react'
import { Button, ErrorState } from '@bundlenudge/shared-ui'
import { useApiHealth } from '@/hooks/useAdminOps'
import {
  StatusOverview,
  EndpointTable,
  RecentErrors,
  RateLimitingCard,
} from '@/components/admin/api-health'

/**
 * API Health Page
 *
 * Displays comprehensive API health monitoring including:
 * - Overall status indicator
 * - Response time metrics
 * - Error rates by endpoint
 * - Recent errors with details
 * - Rate limiting statistics
 *
 * Auto-refreshes every 10 seconds via useApiHealth hook.
 */
function ApiHealthPage() {
  const { data, isLoading, isError, error, refetch, dataUpdatedAt } = useApiHealth()

  const lastUpdated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString()
    : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-dark">API Health</h1>
          <p className="text-sm text-text-light mt-1">
            Real-time monitoring of API performance and errors
            {lastUpdated && (
              <span className="ml-2 text-xs">
                (Last updated: {lastUpdated})
              </span>
            )}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void refetch()}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Error State */}
      {isError && (
        <ErrorState
          title="Failed to load API health data"
          message={error?.message ?? 'An unexpected error occurred'}
          onRetry={() => void refetch()}
        />
      )}

      {/* Status Overview Cards */}
      <StatusOverview data={data} isLoading={isLoading} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Endpoint Table - spans 2 columns */}
        <div className="lg:col-span-2">
          <EndpointTable endpoints={data?.endpoints} isLoading={isLoading} />
        </div>

        {/* Sidebar - Rate Limiting */}
        <div className="space-y-6">
          <RateLimitingCard data={data?.rateLimiting} isLoading={isLoading} />
        </div>
      </div>

      {/* Recent Errors */}
      <RecentErrors errors={data?.recentErrors} isLoading={isLoading} />
    </div>
  )
}

export default ApiHealthPage
