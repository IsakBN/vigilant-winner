'use client'

/**
 * useRecentActivity Hook
 *
 * TanStack Query hook for fetching recent account activity.
 */

import { useQuery } from '@tanstack/react-query'

/**
 * Activity item types
 */
export type ActivityType =
    | 'release_created'
    | 'release_deployed'
    | 'build_completed'
    | 'build_failed'
    | 'device_registered'
    | 'team_member_added'

/**
 * Activity item interface
 */
export interface ActivityItem {
    id: string
    type: ActivityType
    message: string
    appName?: string
    timestamp: string
}

/**
 * Query key factory for activity
 */
export const activityKeys = {
    all: ['activity'] as const,
    recent: (accountId: string) =>
        [...activityKeys.all, 'recent', accountId] as const,
}

/**
 * Hook to fetch recent account activity
 */
export function useRecentActivity(accountId: string) {
    return useQuery({
        queryKey: activityKeys.recent(accountId),
        queryFn: async (): Promise<ActivityItem[]> => {
            // For now, call the activity endpoint - returns empty if not implemented
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/v1/accounts/${accountId}/activity?limit=10`,
                { credentials: 'include' }
            )
            if (!response.ok) {
                // If endpoint doesn't exist yet, return empty array
                return []
            }
            return response.json() as Promise<ActivityItem[]>
        },
        enabled: Boolean(accountId),
    })
}
