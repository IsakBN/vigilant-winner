/**
 * Admin Orgs Component Types
 *
 * Type definitions for organization management components.
 */

import type { AdminOrg, AdminOrgDetails, OrgPlan } from '@/lib/api/types'

export interface OrgsFiltersProps {
    search: string
    onSearchChange: (value: string) => void
    plan: OrgPlan | 'all'
    onPlanChange: (value: OrgPlan | 'all') => void
    status: 'all' | 'active' | 'suspended'
    onStatusChange: (value: 'all' | 'active' | 'suspended') => void
}

export interface OrgsTableProps {
    organizations: AdminOrg[]
    isLoading: boolean
    onOrgClick: (orgId: string) => void
    onSuspend: (orgId: string) => void
    onReactivate: (orgId: string) => void
    pendingActions: Set<string>
}

export interface OrgRowProps {
    org: AdminOrg
    onOrgClick: (orgId: string) => void
    onSuspend: (orgId: string) => void
    onReactivate: (orgId: string) => void
    isPending: boolean
}

export interface OrgsPaginationProps {
    page: number
    totalPages: number
    total: number
    limit: number
    onPageChange: (page: number) => void
}

export interface OrgDetailModalProps {
    orgId: string | null
    open: boolean
    onClose: () => void
    onOrgUpdated?: () => void
}

/**
 * Tab content props - shared base for all tab components
 */
export interface OrgTabProps {
    organization: AdminOrgDetails
    onRefresh: () => void
}

/**
 * Actions tab specific props
 */
export interface OrgActionsTabProps extends OrgTabProps {
    onOrgUpdated?: () => void
}

export type { AdminOrg, AdminOrgDetails, OrgPlan }
