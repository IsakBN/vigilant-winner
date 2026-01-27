/**
 * A/B Testing Types for BundleNudge Dashboard
 *
 * Types for A/B test management, rollout progress, and analytics.
 */

// =============================================================================
// Core Types
// =============================================================================

/**
 * Status of an A/B test
 */
export type ABTestStatus = 'running' | 'completed' | 'stopped'

/**
 * Confidence level for statistical significance
 */
export type ConfidenceLevel = 'high' | 'medium' | 'low'

// =============================================================================
// Metrics Types
// =============================================================================

/**
 * Performance metrics for a single variant
 */
export interface VariantMetrics {
    devices: number
    sessions: number
    avgSessionDuration: number
    crashes: number
    crashRate: number
    customMetrics?: Record<string, number>
}

/**
 * A/B test variant with allocation and metrics
 */
export interface ABTestVariant {
    id: string
    name: string
    isControl: boolean
    percentage: number
    metrics: VariantMetrics
}

// =============================================================================
// A/B Test Results
// =============================================================================

/**
 * Complete A/B test results with variants and winner info
 */
export interface ABTestResults {
    id: string
    releaseId: string
    status: ABTestStatus
    startedAt: string
    completedAt?: string
    variants: ABTestVariant[]
    winner?: string
    confidence: number
}

// =============================================================================
// Rollout Progress
// =============================================================================

/**
 * Adoption breakdown by update stage
 */
export interface AdoptionStats {
    checking: number
    downloading: number
    applied: number
    active: number
}

/**
 * Rollout progress tracking for a release
 */
export interface RolloutProgress {
    releaseId: string
    currentPercentage: number
    targetPercentage: number
    devicesReached: number
    totalDevices: number
    adoption: AdoptionStats
}

// =============================================================================
// Version Distribution
// =============================================================================

/**
 * Distribution of devices across versions
 */
export interface VersionDistribution {
    version: string
    devices: number
    percentage: number
}

// =============================================================================
// A/B Test List Types
// =============================================================================

/**
 * Summary of an A/B test for list display
 */
export interface ABTestSummary {
    id: string
    name: string
    status: ABTestStatus
    variants: number
    devices: number
    startedAt: string
    winner?: string
}

/**
 * Paginated list response for A/B tests
 */
export interface ABTestListResponse {
    tests: ABTestSummary[]
    total: number
    page: number
    limit: number
}

// =============================================================================
// Create A/B Test Types
// =============================================================================

/**
 * Variant configuration for creating an A/B test
 */
export interface CreateABTestVariant {
    name: string
    branchOrBundleId: string
    percentage: number
    isControl: boolean
}

/**
 * Request payload for creating an A/B test
 */
export interface CreateABTestRequest {
    name: string
    description?: string
    variants: CreateABTestVariant[]
}

/**
 * Response after creating an A/B test
 */
export interface CreateABTestResponse {
    id: string
    name: string
    status: 'running'
    createdAt: string
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Get confidence level based on confidence percentage
 *
 * @param confidence - Confidence percentage (0-100)
 * @returns Confidence level category
 */
export function getConfidenceLevel(confidence: number): ConfidenceLevel {
    if (confidence >= 95) {
        return 'high'
    }
    if (confidence >= 80) {
        return 'medium'
    }
    return 'low'
}

/**
 * Get human-readable label for confidence level
 *
 * @param level - Confidence level
 * @returns Human-readable label
 */
export function getConfidenceLabel(level: ConfidenceLevel): string {
    switch (level) {
        case 'high':
            return 'High Confidence (95%+)'
        case 'medium':
            return 'Medium Confidence (80-95%)'
        case 'low':
            return 'Low Confidence (<80%)'
    }
}
