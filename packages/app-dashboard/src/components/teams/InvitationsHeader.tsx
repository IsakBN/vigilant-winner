'use client'

/**
 * InvitationsHeader Component
 *
 * Header and breadcrumb for the team invitations page.
 */

import Link from 'next/link'
import { Mail, ChevronRight } from 'lucide-react'

// =============================================================================
// Breadcrumb
// =============================================================================

interface BreadcrumbProps {
    accountId: string
    teamId: string
    teamName?: string
}

export function InvitationsBreadcrumb({ accountId, teamId, teamName }: BreadcrumbProps) {
    return (
        <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-6">
            <Link
                href={`/dashboard/${accountId}/teams`}
                className="hover:text-foreground transition-colors"
            >
                Teams
            </Link>
            <ChevronRight className="w-4 h-4" />
            <Link
                href={`/dashboard/${accountId}/teams/${teamId}`}
                className="hover:text-foreground transition-colors"
            >
                {teamName ?? 'Team'}
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground">Invitations</span>
        </nav>
    )
}

// =============================================================================
// Page Header
// =============================================================================

interface PageHeaderProps {
    teamName?: string
}

export function InvitationsPageHeader({ teamName }: PageHeaderProps) {
    return (
        <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-neutral-100 rounded-lg">
                <Mail className="w-5 h-5 text-neutral-600" />
            </div>
            <div>
                <h1 className="text-xl font-semibold text-neutral-900">Invitations</h1>
                <p className="text-sm text-neutral-500">
                    Invite new members to {teamName ?? 'your team'} and manage pending invitations.
                </p>
            </div>
        </div>
    )
}
