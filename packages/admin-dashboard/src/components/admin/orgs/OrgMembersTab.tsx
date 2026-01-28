'use client'

/**
 * OrgMembersTab Component
 *
 * Displays organization members with their roles.
 * Lists owner, admins, and regular members.
 */

import { Badge, Label } from '@bundlenudge/shared-ui'
import type { OrgTabProps } from './types'
import { formatDate, getRoleBadgeClass } from './utils'

export function OrgMembersTab({ organization }: OrgTabProps) {
    const members = organization.members ?? []
    const memberCount = members.length

    if (memberCount === 0) {
        return (
            <div className="mt-4">
                <p className="text-sm text-muted-foreground text-center py-8">
                    No members found
                </p>
            </div>
        )
    }

    // Sort members by role: owner first, then admin, then member
    const sortedMembers = [...members].sort((a, b) => {
        const roleOrder = { owner: 0, admin: 1, member: 2 }
        return roleOrder[a.role] - roleOrder[b.role]
    })

    // Group by role for display
    const owners = sortedMembers.filter((m) => m.role === 'owner')
    const admins = sortedMembers.filter((m) => m.role === 'admin')
    const regularMembers = sortedMembers.filter((m) => m.role === 'member')

    return (
        <div className="mt-4 space-y-4">
            {/* Summary */}
            <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Team Members</h4>
                    <Badge variant="outline">{String(memberCount)} members</Badge>
                </div>
                <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>{String(owners.length)} owner</span>
                    <span>{String(admins.length)} admins</span>
                    <span>{String(regularMembers.length)} members</span>
                </div>
            </div>

            {/* Owners */}
            {owners.length > 0 && (
                <MemberSection title="Owner" members={owners} />
            )}

            {/* Admins */}
            {admins.length > 0 && (
                <MemberSection title="Administrators" members={admins} />
            )}

            {/* Regular Members */}
            {regularMembers.length > 0 && (
                <MemberSection title="Members" members={regularMembers} />
            )}
        </div>
    )
}

// Sub-components

interface MemberSectionProps {
    title: string
    members: {
        id: string
        userId: string
        email: string
        name: string | null
        role: 'owner' | 'admin' | 'member'
        joinedAt: number
    }[]
}

function MemberSection({ title, members }: MemberSectionProps) {
    return (
        <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-3">{title}</h4>
            <div className="space-y-3">
                {members.map((member) => (
                    <MemberRow key={member.id} member={member} />
                ))}
            </div>
        </div>
    )
}

interface MemberRowProps {
    member: {
        id: string
        userId: string
        email: string
        name: string | null
        role: 'owner' | 'admin' | 'member'
        joinedAt: number
    }
}

function MemberRow({ member }: MemberRowProps) {
    return (
        <div className="flex items-center justify-between py-2 border-b last:border-0">
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">
                        {member.name ?? 'Unnamed'}
                    </p>
                    <Badge className={getRoleBadgeClass(member.role)}>
                        {member.role}
                    </Badge>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                    {member.email}
                </p>
            </div>
            <div className="text-right ml-4">
                <Label className="text-xs text-muted-foreground">Joined</Label>
                <p className="text-xs">{formatDate(member.joinedAt)}</p>
            </div>
        </div>
    )
}
