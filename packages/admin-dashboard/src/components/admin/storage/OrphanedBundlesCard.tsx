'use client'

import { useState } from 'react'
import { Trash2, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Skeleton,
} from '@bundlenudge/shared-ui'
import { useCleanupOrphanedBundles } from '@/hooks/useAdminOps'

interface OrphanedBundlesCardProps {
  orphanedCount: number | undefined
  isLoading: boolean
}

/**
 * Card for detecting and cleaning up orphaned bundles
 */
export function OrphanedBundlesCard({ orphanedCount, isLoading }: OrphanedBundlesCardProps) {
  const [cleanupResult, setCleanupResult] = useState<{ deleted: number } | null>(null)
  const cleanupMutation = useCleanupOrphanedBundles()

  const handleCleanup = async () => {
    setCleanupResult(null)
    try {
      const result = await cleanupMutation.mutateAsync()
      setCleanupResult(result)
    } catch {
      // Error handled by mutation
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Orphaned Bundles
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{orphanedCount ?? 0}</p>
                <p className="text-sm text-muted-foreground">
                  Bundles without associated apps
                </p>
              </div>
              <StatusBadge count={orphanedCount ?? 0} />
            </div>

            {cleanupResult && (
              <div className="flex items-center gap-2 p-3 bg-pastel-green/10 rounded-lg">
                <CheckCircle className="h-4 w-4 text-pastel-green" />
                <span className="text-sm">
                  Cleaned up {cleanupResult.deleted} orphaned bundles
                </span>
              </div>
            )}

            {cleanupMutation.isError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-700">
                  Failed to cleanup bundles. Please try again.
                </span>
              </div>
            )}

            <Button
              onClick={handleCleanup}
              disabled={cleanupMutation.isPending || (orphanedCount ?? 0) === 0}
              variant={(orphanedCount ?? 0) > 0 ? 'default' : 'outline'}
              className="w-full"
            >
              {cleanupMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cleaning up...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Cleanup Orphaned Bundles
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function StatusBadge({ count }: { count: number }) {
  if (count === 0) {
    return (
      <Badge className="bg-pastel-green/20 text-pastel-green border-0">
        All Clean
      </Badge>
    )
  }
  if (count < 10) {
    return (
      <Badge className="bg-yellow-100 text-yellow-700 border-0">
        Minor
      </Badge>
    )
  }
  return (
    <Badge className="bg-pastel-orange/20 text-pastel-orange border-0">
      Needs Attention
    </Badge>
  )
}
