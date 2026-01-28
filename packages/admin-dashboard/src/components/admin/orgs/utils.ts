/**
 * Admin Orgs Utility Functions
 *
 * Helper functions for organization management components.
 */

import type { OrgPlan } from '@/lib/api/types'

/**
 * Format date from timestamp
 */
export function formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    })
}

/**
 * Format relative time for last activity
 */
export function formatLastActive(timestamp: number | undefined): string {
    if (!timestamp) return 'Never'

    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${String(diffMins)}m ago`

    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${String(diffHours)}h ago`

    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 7) return `${String(diffDays)}d ago`

    return formatDate(timestamp)
}

/**
 * Get badge class for plan type
 */
export function getPlanBadgeClass(plan: OrgPlan): string {
    const classes: Record<OrgPlan, string> = {
        free: 'bg-gray-100 text-gray-700',
        pro: 'bg-blue-100 text-blue-700',
        enterprise: 'bg-purple-100 text-purple-700',
    }
    return classes[plan]
}

/**
 * Get badge class for active status
 */
export function getStatusBadgeClass(isActive: boolean): string {
    return isActive
        ? 'bg-green-100 text-green-700'
        : 'bg-red-100 text-red-700'
}

/**
 * Plan display labels
 */
export const PLAN_LABELS: Record<OrgPlan | 'all', string> = {
    all: 'All Plans',
    free: 'Free',
    pro: 'Pro',
    enterprise: 'Enterprise',
}

/**
 * Status display labels
 */
export const STATUS_LABELS = {
    all: 'All Status',
    active: 'Active',
    suspended: 'Suspended',
} as const

/**
 * Get badge color class for membership role
 */
export function getRoleBadgeClass(role: string): string {
    switch (role) {
        case 'owner':
            return 'bg-purple-100 text-purple-700'
        case 'admin':
            return 'bg-blue-100 text-blue-700'
        default:
            return 'bg-gray-100 text-gray-700'
    }
}

/**
 * Get plan limits for display
 */
export function getPlanLimits(plan: OrgPlan): {
    mau: string
    apps: string
    storage: string
    members: string
} {
    switch (plan) {
        case 'enterprise':
            return {
                mau: 'Unlimited',
                apps: 'Unlimited',
                storage: 'Unlimited',
                members: 'Unlimited',
            }
        case 'pro':
            return {
                mau: '100,000',
                apps: '10',
                storage: '10 GB',
                members: '25',
            }
        default:
            return {
                mau: '1,000',
                apps: '2',
                storage: '500 MB',
                members: '3',
            }
    }
}
