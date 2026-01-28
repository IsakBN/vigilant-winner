'use client'

import { useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { X, Eye } from 'lucide-react'

// ============================================================================
// Types
// ============================================================================

export interface FeaturePreviewProps {
  /** Title shown at the top of the preview */
  title: string
  /** Description explaining what this feature does */
  description: string
  /** Called when user dismisses the preview */
  onDismiss: () => void
  /** The mock UI content to render inside the preview */
  children: React.ReactNode
  /** Optional hint text shown above the dismiss button */
  hint?: string
  /** Custom dismiss button text */
  dismissText?: string
  /** Additional className for the modal */
  className?: string
}

// ============================================================================
// FeaturePreview Component
// ============================================================================

/**
 * FeaturePreview
 *
 * A floating modal that shows mock data for a dashboard feature.
 * Displayed on first visit to help users understand what the feature does.
 *
 * Features:
 * - Semi-transparent backdrop with blur
 * - Floating card (not full-screen)
 * - Escape key dismisses
 * - Smooth fade-in animation
 *
 * Usage:
 * ```tsx
 * <FeaturePreview
 *   title="This is your Releases tab"
 *   description="Track rollout progress and manage staged deployments."
 *   onDismiss={() => markAsSeen('releases')}
 * >
 *   <ReleasesPreviewContent />
 * </FeaturePreview>
 * ```
 */
export function FeaturePreview({
  title,
  description,
  onDismiss,
  children,
  hint,
  dismissText = "Got it, let's go!",
  className,
}: FeaturePreviewProps) {
  // Handle Escape key to dismiss
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onDismiss()
      }
    },
    [onDismiss]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [handleKeyDown])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="preview-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onDismiss}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className={cn(
          'relative w-full max-w-4xl max-h-[85vh] overflow-hidden',
          'bg-background rounded-2xl shadow-2xl border',
          'animate-in zoom-in-95 duration-200',
          className
        )}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b bg-muted/50">
          <div className="flex items-start gap-4">
            {/* Preview Badge */}
            <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary">
              <Eye className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-primary uppercase tracking-wider">
                  Preview
                </span>
              </div>
              <h2
                id="preview-title"
                className="text-lg font-semibold text-foreground"
              >
                {title}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            </div>
            {/* Close button */}
            <button
              onClick={onDismiss}
              className="flex-shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Close preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content - Mock UI */}
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-180px)] bg-muted/30">
          <div className="relative">
            {/* Sample data indicator */}
            <div className="absolute -top-2 -right-2 z-10">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
                Sample data
              </span>
            </div>
            {children}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-background">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {hint || 'Once you have real data, it will appear here.'}
            </p>
            <Button onClick={onDismiss} className="min-w-[140px]">
              {dismissText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
