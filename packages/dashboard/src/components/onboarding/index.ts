/**
 * Onboarding components for progressive feature discovery and SDK setup
 *
 * This module provides:
 * - SetupWizardContainer: Full wizard for guiding users through SDK setup
 * - SetupVerification: Standalone component for checking SDK connection
 * - OnboardingProvider: Context for tracking seen features
 * - useOnboardingContext: Hook to access onboarding state
 * - FeaturePreview: Modal showing mock data for first-time visits
 * - Preview components for each dashboard tab
 * - Mock data for demonstrations
 */

// Setup Wizard components
export { SetupWizardContainer } from './SetupWizardContainer'
export type { SetupWizardContainerProps } from './SetupWizardContainer'

export { STEPS, StepInstall, StepIntegrate, Checkbox } from './SetupWizard'
export type { SetupWizardProps, Step, SetupStatus } from './SetupWizard'

export { StepVerify } from './StepVerify'
export { StepComplete } from './StepComplete'
export { StepIndicator } from './StepIndicator'

export { CodeBlock, CopyButton } from './CodeBlock'
export { CodeSnippet } from './CodeSnippet'
export { SetupVerification } from './SetupVerification'

// Onboarding context
export {
  OnboardingProvider,
  useOnboardingContext,
} from './useOnboardingContext'
export type { OnboardingFeature } from './useOnboardingContext'

export { FeaturePreview } from './FeaturePreview'
export type { FeaturePreviewProps } from './FeaturePreview'

// Preview components
export {
  ReleasesPreview,
  AudiencePreview,
  ABTestingPreview,
} from './previews'

// Mock data (for testing and demos)
export {
  mockReleases,
  mockReleaseStats,
  mockAudienceTesters,
  mockRegisteredDevices,
  mockAudienceStats,
  mockABTests,
  mockABTestStats,
} from './mockData'

export type {
  MockRelease,
  MockTester,
  MockRegisteredDevice,
  MockABTest,
  MockVariant,
} from './mockData'
