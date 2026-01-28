'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Check, RefreshCw } from 'lucide-react'
import { apps } from '@/lib/api'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface SetupVerificationProps {
  accountId: string
  appId: string
}

interface SetupStatus {
  sdkConnected: boolean
  firstPingAt: number | null
}

const POLL_INTERVAL_MS = 5000

function formatRelativeTime(timestamp: number): string {
  const now = Date.now()
  const diffMs = now - timestamp
  const diffSeconds = Math.floor(diffMs / 1000)

  if (diffSeconds < 60) {
    return diffSeconds === 1 ? '1 second ago' : `${String(diffSeconds)} seconds ago`
  }

  const diffMinutes = Math.floor(diffSeconds / 60)
  if (diffMinutes < 60) {
    return diffMinutes === 1 ? '1 minute ago' : `${String(diffMinutes)} minutes ago`
  }

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) {
    return diffHours === 1 ? '1 hour ago' : `${String(diffHours)} hours ago`
  }

  const diffDays = Math.floor(diffHours / 24)
  return diffDays === 1 ? '1 day ago' : `${String(diffDays)} days ago`
}

export function SetupVerification({ accountId, appId }: SetupVerificationProps) {
  const [status, setStatus] = useState<SetupStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const isMountedRef = useRef(true)
  const intervalIdRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchStatus = useCallback(async (): Promise<boolean> => {
    try {
      const result = await apps.getSetupStatus(accountId, appId)
      if (isMountedRef.current) {
        setStatus(result)
        setHasError(false)
      }
      return result.sdkConnected
    } catch {
      if (isMountedRef.current) {
        setHasError(true)
      }
      return false
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
      }
    }
  }, [accountId, appId])

  const handleRetry = async () => {
    setIsLoading(true)
    setHasError(false)
    const isConnected = await fetchStatus()

    if (!isConnected && isMountedRef.current && !intervalIdRef.current) {
      intervalIdRef.current = setInterval(async () => {
        const connected = await fetchStatus()
        if (connected && intervalIdRef.current) {
          clearInterval(intervalIdRef.current)
          intervalIdRef.current = null
        }
      }, POLL_INTERVAL_MS)
    }
  }

  useEffect(() => {
    isMountedRef.current = true

    const startPolling = async () => {
      const isConnected = await fetchStatus()

      if (!isConnected && isMountedRef.current) {
        intervalIdRef.current = setInterval(async () => {
          const connected = await fetchStatus()
          if (connected && intervalIdRef.current) {
            clearInterval(intervalIdRef.current)
            intervalIdRef.current = null
          }
        }, POLL_INTERVAL_MS)
      }
    }

    startPolling()

    return () => {
      isMountedRef.current = false
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current)
        intervalIdRef.current = null
      }
    }
  }, [fetchStatus])

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-lg bg-neutral-50 border border-neutral-200">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-600" />
        <span className="text-sm text-neutral-600">Checking SDK connection...</span>
      </div>
    )
  }

  if (hasError) {
    return (
      <div className="flex items-center justify-between gap-3 p-4 rounded-lg bg-red-50 border border-red-200">
        <span className="text-sm text-red-700">Unable to check connection status</span>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRetry}
          className="shrink-0"
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          Retry
        </Button>
      </div>
    )
  }

  if (status?.sdkConnected && status.firstPingAt) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 border border-green-200">
        <div className="flex items-center justify-center h-5 w-5 rounded-full bg-green-500">
          <Check className="h-3 w-3 text-white" strokeWidth={3} />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-green-800">SDK Connected!</span>
          <span className="text-xs text-green-600">
            First ping received {formatRelativeTime(status.firstPingAt)}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 p-4 rounded-lg bg-neutral-50 border border-neutral-200">
      <span
        className={cn(
          'h-2.5 w-2.5 rounded-full bg-amber-500',
          'animate-pulse'
        )}
      />
      <span className="text-sm text-neutral-600">Waiting for SDK connection...</span>
    </div>
  )
}
