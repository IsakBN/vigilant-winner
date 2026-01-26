'use client'

/**
 * TeamCard Component
 *
 * Displays a team preview card with key information.
 */

import Link from 'next/link'
import { Card, CardContent, Badge } from '@/components/ui'
import { UsersIcon } from '@/components/icons'
import type { Team, TeamRole } from '@/lib/api'

interface TeamCardProps {
    team: Team
    accountId: string
}

/**
 * Get role badge variant based on role
 */
function getRoleBadgeVariant(role: TeamRole): 'default' | 'secondary' | 'outline' {
    switch (role) {
        case 'owner':
            return 'default'
        case 'admin':
            return 'secondary'
        default:
            return 'outline'
    }
}

/**
 * Format role for display
 */
function formatRole(role: TeamRole): string {
    return role.charAt(0).toUpperCase() + role.slice(1)
}

/**
 * Format relative time from timestamp
 */
function formatRelativeTime(timestamp: number): string {
    const now = Date.now()
    const diff = now - timestamp
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 30) return `${Math.floor(days / 30)}mo ago`
    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    if (minutes > 0) return `${minutes}m ago`
    return 'just now'
}

/**
 * Team icon placeholder
 */
function TeamIconPlaceholder({ name }: { name: string }) {
    const initial = name.charAt(0).toUpperCase()

    return (
        <div className="w-12 h-12 rounded-xl bg-bright-accent/10 text-bright-accent flex items-center justify-center font-semibold text-lg">
            {initial}
        </div>
    )
}

export function TeamCard({ team, accountId }: TeamCardProps) {
    const teamUrl = `/dashboard/${accountId}/teams/${team.id}`

    return (
        <Link href={teamUrl} className="block group">
            <Card className="h-full transition-all hover:border-bright-accent/50 hover:shadow-md">
                <CardContent className="p-5">
                    {/* Header: Icon and Role Badge */}
                    <div className="flex items-start justify-between mb-4">
                        <TeamIconPlaceholder name={team.name} />
                        <Badge variant={getRoleBadgeVariant(team.myRole)}>
                            {formatRole(team.myRole)}
                        </Badge>
                    </div>

                    {/* Team Name */}
                    <h3 className="font-semibold text-lg text-text-dark mb-1 truncate group-hover:text-bright-accent transition-colors">
                        {team.name}
                    </h3>

                    {/* Team Slug */}
                    <p className="text-sm text-text-light font-mono truncate mb-4">
                        @{team.slug}
                    </p>

                    {/* Stats Row */}
                    <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
                        {/* Member Count */}
                        <div className="flex items-center gap-1.5 text-sm text-text-light">
                            <UsersIcon className="w-4 h-4" />
                            <span>
                                {team.memberCount ?? 1} member{(team.memberCount ?? 1) !== 1 ? 's' : ''}
                            </span>
                        </div>

                        {/* Created Date */}
                        <div className="text-sm text-text-light">
                            Created {formatRelativeTime(team.createdAt)}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </Link>
    )
}
