'use client'

/**
 * OrgRow Component
 *
 * Single organization row in the table with:
 * - Organization info (name, slug)
 * - Plan badge
 * - Status badge
 * - Member/app counts
 * - Action buttons
 */

import { Pause, Play, Eye } from 'lucide-react'
import {
    TableCell,
    TableRow,
    Badge,
    Button,
} from '@bundlenudge/shared-ui'
import type { OrgRowProps } from './types'
import { formatDate, formatLastActive, getPlanBadgeClass, getStatusBadgeClass } from './utils'

export function OrgRow({
    org,
    onOrgClick,
    onSuspend,
    onReactivate,
    isPending,
}: OrgRowProps) {
    return (
        <TableRow className="cursor-pointer hover:bg-muted/50">
            <TableCell className="px-4">
                <OrgCell name={org.name} slug={org.slug} createdAt={org.createdAt} />
            </TableCell>
            <TableCell>
                <Badge className={getPlanBadgeClass(org.plan)}>
                    {org.plan.charAt(0).toUpperCase() + org.plan.slice(1)}
                </Badge>
            </TableCell>
            <TableCell>
                <Badge className={getStatusBadgeClass(org.isActive)}>
                    {org.isActive ? 'Active' : 'Suspended'}
                </Badge>
            </TableCell>
            <TableCell className="text-text-dark">
                {org.memberCount}
            </TableCell>
            <TableCell className="text-text-dark">
                {org.appCount}
            </TableCell>
            <TableCell className="text-text-light text-sm">
                {formatLastActive(org.lastActiveAt)}
            </TableCell>
            <TableCell>
                <ActionButtons
                    org={org}
                    onView={() => onOrgClick(org.id)}
                    onSuspend={() => onSuspend(org.id)}
                    onReactivate={() => onReactivate(org.id)}
                    isPending={isPending}
                />
            </TableCell>
        </TableRow>
    )
}

interface OrgCellProps {
    name: string
    slug: string
    createdAt: number
}

function OrgCell({ name, slug, createdAt }: OrgCellProps) {
    return (
        <div>
            <div className="text-sm font-medium text-text-dark">{name}</div>
            <div className="text-xs text-text-light">{slug}</div>
            <div className="text-xs text-text-light">
                Created {formatDate(createdAt)}
            </div>
        </div>
    )
}

interface ActionButtonsProps {
    org: OrgRowProps['org']
    onView: () => void
    onSuspend: () => void
    onReactivate: () => void
    isPending: boolean
}

function ActionButtons({
    org,
    onView,
    onSuspend,
    onReactivate,
    isPending,
}: ActionButtonsProps) {
    return (
        <div className="flex items-center gap-1">
            <Button
                variant="ghost"
                size="icon"
                onClick={onView}
                disabled={isPending}
                title="View Details"
            >
                <Eye className="w-4 h-4" />
                <span className="sr-only">View Details</span>
            </Button>
            {org.isActive ? (
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onSuspend}
                    disabled={isPending}
                    title="Suspend"
                    className="text-yellow-600 hover:text-yellow-700"
                >
                    <Pause className="w-4 h-4" />
                    <span className="sr-only">Suspend</span>
                </Button>
            ) : (
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onReactivate}
                    disabled={isPending}
                    title="Reactivate"
                    className="text-green-600 hover:text-green-700"
                >
                    <Play className="w-4 h-4" />
                    <span className="sr-only">Reactivate</span>
                </Button>
            )}
        </div>
    )
}

export type { OrgRowProps }
