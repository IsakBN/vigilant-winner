'use client'

import { useState } from 'react'
import { Eye, EyeOff, Copy, RefreshCw, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'

// ============================================================================
// Types
// ============================================================================

interface ApiKeyManagerProps {
  apiKey: string | null
  isLoading?: boolean
  isRegenerating?: boolean
  onRegenerate: () => Promise<void>
}

// ============================================================================
// Helper Functions
// ============================================================================

function maskApiKey(key: string): string {
  if (key.length <= 8) return key
  const prefix = key.slice(0, 4)
  const suffix = key.slice(-4)
  return `${prefix}${'*'.repeat(24)}${suffix}`
}

// ============================================================================
// Loading State
// ============================================================================

function ApiKeyManagerSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-24" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-32" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export function ApiKeyManager({
  apiKey,
  isLoading,
  isRegenerating,
  onRegenerate,
}: ApiKeyManagerProps) {
  const [isRevealed, setIsRevealed] = useState(false)
  const [copied, setCopied] = useState(false)

  if (isLoading) {
    return <ApiKeyManagerSkeleton />
  }

  const handleCopy = async () => {
    if (!apiKey) return
    try {
      await navigator.clipboard.writeText(apiKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Silently fail - browser may not support clipboard API
    }
  }

  const handleRegenerate = async () => {
    await onRegenerate()
    setIsRevealed(true) // Show the new key
  }

  const displayKey = apiKey ? (isRevealed ? apiKey : maskApiKey(apiKey)) : null

  // No API key yet - show generate state
  if (!displayKey) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">API Key</CardTitle>
          <p className="text-sm text-neutral-500 mt-1">
            Generate an API key to authenticate SDK requests from your app.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-800">
                No API key has been generated yet. Click below to create one.
              </p>
            </div>
            <Button onClick={handleRegenerate} disabled={isRegenerating}>
              <RefreshCw className={cn(
                'w-4 h-4 mr-2',
                isRegenerating && 'animate-spin'
              )} />
              {isRegenerating ? 'Generating...' : 'Generate API Key'}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">API Key</CardTitle>
        <p className="text-sm text-neutral-500 mt-1">
          Use this key to authenticate SDK requests from your app.
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* API Key Display */}
          <div className="flex items-center gap-2">
            <div className={cn(
              'flex-1 px-4 py-2.5 rounded-lg font-mono text-sm',
              'bg-neutral-100 border border-neutral-200',
              'select-all overflow-x-auto whitespace-nowrap'
            )}>
              {displayKey}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsRevealed(!isRevealed)}
              aria-label={isRevealed ? 'Hide API key' : 'Show API key'}
            >
              {isRevealed ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              disabled={!apiKey}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2 text-green-600" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </>
              )}
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isRegenerating}
                >
                  <RefreshCw className={cn(
                    'w-4 h-4 mr-2',
                    isRegenerating && 'animate-spin'
                  )} />
                  {isRegenerating ? 'Regenerating...' : 'Regenerate'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Regenerate API Key?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will invalidate your current API key immediately. Any apps
                    using the old key will stop working until you update them with
                    the new key.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleRegenerate}>
                    Regenerate Key
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {/* Security Note */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs text-amber-800">
              <strong>Keep this key secret.</strong> Do not commit it to version control
              or share it publicly. Use environment variables in your app.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
