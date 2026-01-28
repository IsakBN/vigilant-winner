/**
 * User Detail Modal Types
 *
 * Shared types for the user detail modal and its sub-components.
 */

import type { AdminUserDetail } from '@/lib/api/types'

/**
 * Main modal props
 */
export interface UserDetailModalProps {
    userId: string | null
    open: boolean
    onClose: () => void
    onUserUpdated?: () => void
}

/**
 * Tab content props - shared base for all tab components
 */
export interface UserTabProps {
    user: AdminUserDetail
    onRefresh: () => void
}

/**
 * Actions tab specific props
 */
export interface UserActionsTabProps extends UserTabProps {
    onUserUpdated?: () => void
}

/**
 * Limit override form props
 */
export interface UserLimitOverrideFormProps {
    userId: string
    onSuccess: () => void
    onCancel: () => void
}

/**
 * Override limit types
 */
export type OverrideType = 'mau' | 'storage' | 'builds'
export type OverrideMode = 'absolute' | 'multiplier'

/**
 * User app display interface (simplified from legacy)
 */
export interface UserApp {
    id: string
    name: string
    platform?: string
    releaseCount?: number
    createdAt: number
}

/**
 * Team membership display interface
 */
export interface TeamMembership {
    orgId: string
    orgName: string
    orgSlug: string
    role: 'owner' | 'admin' | 'member'
    memberCount?: number
    appCount?: number
    joinedAt: number
}

/**
 * Project access display interface
 */
export interface ProjectAccess {
    appId: string
    appName: string
    role: string
    orgName?: string
    createdAt: number
}
