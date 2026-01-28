'use client'

import { ArrowRight, ChevronRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface StepCompleteProps {
  accountId: string
  appId: string
  onComplete?: () => void
}

export function StepComplete({ accountId, appId, onComplete }: StepCompleteProps) {
  return (
    <div className="space-y-6 text-center">
      {/* Celebration animation */}
      <div className="flex justify-center">
        <div className="relative">
          <div className="absolute inset-0 animate-ping opacity-25">
            <div className="w-20 h-20 rounded-full bg-green-500" />
          </div>
          <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-green-500">
            <Sparkles className="h-10 w-10 text-white" />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-2xl font-bold text-neutral-900 mb-2">
          You&apos;re all set!
        </h3>
        <p className="text-neutral-600 max-w-md mx-auto">
          Your app is connected to BundleNudge. You can now push OTA updates directly
          to your users without going through the app store review process.
        </p>
      </div>

      <div className="pt-4">
        <h4 className="text-sm font-semibold text-neutral-700 mb-4">Next steps:</h4>
        <div className="grid gap-3 text-left max-w-md mx-auto">
          <a
            href={`/dashboard/${accountId}/apps/${appId}/releases`}
            className="flex items-center gap-3 p-4 rounded-lg border border-neutral-200 hover:border-primary hover:bg-primary/5 transition-colors group"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-neutral-100 group-hover:bg-primary/10">
              <ArrowRight className="w-4 h-4 text-neutral-600 group-hover:text-primary" />
            </div>
            <div>
              <p className="font-medium text-neutral-900">View Releases</p>
              <p className="text-sm text-neutral-500">Manage your OTA updates</p>
            </div>
          </a>
          <a
            href="https://docs.bundlenudge.com/quickstart"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 rounded-lg border border-neutral-200 hover:border-primary hover:bg-primary/5 transition-colors group"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-neutral-100 group-hover:bg-primary/10">
              <ChevronRight className="w-4 h-4 text-neutral-600 group-hover:text-primary" />
            </div>
            <div>
              <p className="font-medium text-neutral-900">Read the Docs</p>
              <p className="text-sm text-neutral-500">Learn advanced features</p>
            </div>
          </a>
        </div>
      </div>

      {onComplete && (
        <div className="pt-4">
          <Button onClick={onComplete} size="lg">
            Go to Dashboard
          </Button>
        </div>
      )}
    </div>
  )
}
