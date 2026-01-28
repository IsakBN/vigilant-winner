'use client'

import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { SetupStatus } from './SetupWizard'

interface StepVerifyProps {
  status: SetupStatus | null
  isLoading: boolean
  hasError: boolean
  onRetry: () => void
}

export function StepVerify({
  status,
  isLoading,
  hasError,
  onRetry,
}: StepVerifyProps) {
  const isConnected = status?.sdkConnected

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">
          Verify SDK Connection
        </h3>
        <p className="text-neutral-600">
          Run your app on a device or simulator. We&apos;ll detect the SDK connection
          automatically.
        </p>
      </div>

      {/* Connection status card */}
      <div
        className={cn(
          'p-6 rounded-lg border-2 transition-all duration-300',
          isConnected
            ? 'bg-green-50 border-green-300'
            : hasError
            ? 'bg-red-50 border-red-200'
            : 'bg-neutral-50 border-neutral-200'
        )}
      >
        <div className="flex items-center gap-4">
          {isLoading ? (
            <>
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-neutral-200 border-t-primary" />
              <div>
                <p className="font-medium text-neutral-900">Checking connection...</p>
                <p className="text-sm text-neutral-500">This may take a moment</p>
              </div>
            </>
          ) : hasError ? (
            <>
              <div className="flex items-center justify-center h-10 w-10 rounded-full bg-red-100">
                <span className="text-red-600 text-xl">!</span>
              </div>
              <div className="flex-1">
                <p className="font-medium text-red-800">Unable to check connection</p>
                <p className="text-sm text-red-600">Please try again</p>
              </div>
              <Button variant="outline" size="sm" onClick={onRetry}>
                Retry
              </Button>
            </>
          ) : isConnected ? (
            <>
              <div className="flex items-center justify-center h-10 w-10 rounded-full bg-green-500">
                <Check className="h-5 w-5 text-white" strokeWidth={3} />
              </div>
              <div>
                <p className="font-medium text-green-800">SDK Connected!</p>
                <p className="text-sm text-green-600">
                  Your app successfully connected to BundleNudge
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="relative h-10 w-10">
                <div className="absolute inset-0 rounded-full bg-amber-400 animate-ping opacity-25" />
                <div className="relative flex items-center justify-center h-10 w-10 rounded-full bg-amber-400">
                  <div className="h-3 w-3 rounded-full bg-white" />
                </div>
              </div>
              <div>
                <p className="font-medium text-neutral-900">Waiting for connection...</p>
                <p className="text-sm text-neutral-500">
                  Run your app to establish the connection
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
        <p className="text-sm text-neutral-700 font-medium mb-2">Troubleshooting tips:</p>
        <ul className="text-sm text-neutral-600 space-y-1">
          <li>- Make sure your device/simulator has internet access</li>
          <li>
            - Verify{' '}
            <code className="bg-neutral-200 px-1 rounded text-xs">
              react-native-get-random-values
            </code>{' '}
            is the first import in index.js
          </li>
          <li>- Check the console for any error messages</li>
          <li>
            - For iOS, ensure you ran{' '}
            <code className="bg-neutral-200 px-1 rounded text-xs">pod install</code>
          </li>
          <li>
            - Try restarting the Metro bundler with{' '}
            <code className="bg-neutral-200 px-1 rounded text-xs">--reset-cache</code>
          </li>
        </ul>
      </div>
    </div>
  )
}
