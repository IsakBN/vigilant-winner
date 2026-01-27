'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react'

// ============================================================================
// Types
// ============================================================================

/** Features that can be tracked for onboarding */
export type OnboardingFeature =
  | 'releases'
  | 'audience'
  | 'ab-testing'
  | 'dashboard'
  | 'analytics'
  | 'settings'

interface OnboardingContextValue {
  /** Set of features the user has already seen */
  seenFeatures: Set<OnboardingFeature>
  /** Whether the onboarding state is still loading */
  isLoading: boolean
  /** Check if a specific feature has been seen */
  hasSeenFeature: (feature: OnboardingFeature) => boolean
  /** Mark a feature as seen (dismisses the preview) */
  markAsSeen: (feature: OnboardingFeature) => void
  /** Reset a specific feature (for debugging) */
  reset: (feature: OnboardingFeature) => void
  /** Reset all onboarding state (for debugging) */
  resetAll: () => void
}

// ============================================================================
// Constants
// ============================================================================

const STORAGE_KEY = 'bundlenudge-onboarding-seen'

// ============================================================================
// Context
// ============================================================================

const OnboardingContext = createContext<OnboardingContextValue | null>(null)

// ============================================================================
// Provider
// ============================================================================

interface OnboardingProviderProps {
  children: ReactNode
}

/**
 * OnboardingProvider
 *
 * Wraps the dashboard to provide onboarding state to all child components.
 * This enables the "show preview once" behavior for empty tab states.
 *
 * Usage:
 * ```tsx
 * // In layout.tsx
 * <OnboardingProvider>
 *   <DashboardShell>{children}</DashboardShell>
 * </OnboardingProvider>
 * ```
 */
export function OnboardingProvider({ children }: OnboardingProviderProps) {
  const [seenFeatures, setSeenFeatures] = useState<Set<OnboardingFeature>>(
    new Set()
  )
  const [isLoading, setIsLoading] = useState(true)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as OnboardingFeature[]
        setSeenFeatures(new Set(parsed))
      }
    } catch {
      // Ignore localStorage errors
    }
    setIsLoading(false)
  }, [])

  // Save to localStorage when seenFeatures changes
  useEffect(() => {
    if (!isLoading) {
      try {
        const array = Array.from(seenFeatures)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(array))
      } catch {
        // Ignore localStorage errors
      }
    }
  }, [seenFeatures, isLoading])

  const hasSeenFeature = useCallback(
    (feature: OnboardingFeature): boolean => {
      return seenFeatures.has(feature)
    },
    [seenFeatures]
  )

  const markAsSeen = useCallback((feature: OnboardingFeature) => {
    setSeenFeatures((prev) => {
      const next = new Set(prev)
      next.add(feature)
      return next
    })
  }, [])

  const reset = useCallback((feature: OnboardingFeature) => {
    setSeenFeatures((prev) => {
      const next = new Set(prev)
      next.delete(feature)
      return next
    })
  }, [])

  const resetAll = useCallback(() => {
    setSeenFeatures(new Set())
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // Ignore localStorage errors
    }
  }, [])

  const value: OnboardingContextValue = {
    seenFeatures,
    isLoading,
    hasSeenFeature,
    markAsSeen,
    reset,
    resetAll,
  }

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  )
}

// ============================================================================
// Hook
// ============================================================================

/**
 * useOnboardingContext
 *
 * Access the onboarding context from any component within the OnboardingProvider.
 *
 * Usage:
 * ```tsx
 * const { hasSeenFeature, markAsSeen } = useOnboardingContext()
 *
 * if (!hasSeenFeature('releases')) {
 *   return <FeaturePreview onDismiss={() => markAsSeen('releases')} />
 * }
 * ```
 */
export function useOnboardingContext(): OnboardingContextValue {
  const context = useContext(OnboardingContext)

  if (!context) {
    throw new Error(
      'useOnboardingContext must be used within an OnboardingProvider'
    )
  }

  return context
}
