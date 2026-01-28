/**
 * User Detail Modal Utilities
 *
 * Formatting and helper functions for user display.
 */

/**
 * Format a timestamp to a readable date string
 */
export function formatDate(timestamp: number | null | undefined): string {
    if (!timestamp) return 'N/A'
    return new Date(timestamp).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    })
}

/**
 * Format a number with K/M suffixes for large values
 */
export function formatNumber(num: number | null | undefined): string {
    if (num === null || num === undefined) return '0'
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`
    return num.toLocaleString()
}

/**
 * Get badge color class for user status
 */
export function getStatusBadgeClass(status: string): string {
    switch (status) {
        case 'active':
            return 'bg-green-100 text-green-700'
        case 'trialing':
            return 'bg-blue-100 text-blue-700'
        case 'suspended':
            return 'bg-yellow-100 text-yellow-700'
        case 'banned':
            return 'bg-red-100 text-red-700'
        default:
            return 'bg-gray-100 text-gray-700'
    }
}

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
