'use client'

/**
 * OrgTable Component
 *
 * Displays a table of organizations with search, filtering, and quick actions.
 */

import { useState, useCallback } from 'react'
import Link from 'next/link'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    Badge,
    Button,
    Input,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    Skeleton,
} from '@/components/ui'
import { useAdminOrgs, useSuspendOrg, useReactivateOrg } from '@/hooks/useAdmin'
import type { AdminOrg, OrgPlan } from '@/lib/api'

interface OrgTableProps {
    onOrgClick?: (orgId: string) => void
}

export function OrgTable({ onOrgClick }: OrgTableProps) {
    const [search, setSearch] = useState('')
    const [planFilter, setPlanFilter] = useState<OrgPlan | 'all'>('all')

    const { organizations, total, isLoading, isError, error } = useAdminOrgs({
        search: search || undefined,
        plan: planFilter,
    })

    const suspendOrg = useSuspendOrg()
    const reactivateOrg = useReactivateOrg()

    const handleSearchChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            setSearch(e.target.value)
        },
        []
    )

    const handlePlanChange = useCallback((value: string) => {
        setPlanFilter(value as OrgPlan | 'all')
    }, [])

    const handleToggleActive = useCallback(
        (org: AdminOrg) => {
            if (org.isActive) {
                suspendOrg.mutate(org.id)
            } else {
                reactivateOrg.mutate(org.id)
            }
        },
        [suspendOrg, reactivateOrg]
    )

    if (isLoading) {
        return <OrgTableSkeleton />
    }

    if (isError) {
        return (
            <div className="text-center py-8">
                <p className="text-destructive">
                    Failed to load organizations: {error?.message}
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <Input
                    type="search"
                    placeholder="Search organizations..."
                    value={search}
                    onChange={handleSearchChange}
                    className="flex-1"
                />
                <Select value={planFilter} onValueChange={handlePlanChange}>
                    <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="Filter by plan" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Plans</SelectItem>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="pro">Pro</SelectItem>
                        <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Results count */}
            <p className="text-sm text-muted-foreground">
                Showing {organizations.length} of {total} organizations
            </p>

            {/* Table */}
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Organization</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead className="text-right">Members</TableHead>
                        <TableHead className="text-right">Apps</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {organizations.map((org) => (
                        <OrgRow
                            key={org.id}
                            org={org}
                            onToggleActive={handleToggleActive}
                            onClick={onOrgClick}
                        />
                    ))}
                    {organizations.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center py-8">
                                No organizations found
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    )
}

interface OrgRowProps {
    org: AdminOrg
    onToggleActive: (org: AdminOrg) => void
    onClick?: (orgId: string) => void
}

function OrgRow({ org, onToggleActive, onClick }: OrgRowProps) {
    const handleClick = useCallback(() => {
        onClick?.(org.id)
    }, [onClick, org.id])

    return (
        <TableRow className="cursor-pointer" onClick={handleClick}>
            <TableCell>
                <div>
                    <Link
                        href={`/admin/organizations/${org.id}`}
                        className="font-medium hover:underline"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {org.name}
                    </Link>
                    <p className="text-sm text-muted-foreground">{org.email}</p>
                </div>
            </TableCell>
            <TableCell>
                <PlanBadge plan={org.plan} />
            </TableCell>
            <TableCell className="text-right">{org.memberCount}</TableCell>
            <TableCell className="text-right">{org.appCount}</TableCell>
            <TableCell>
                <StatusBadge isActive={org.isActive} />
            </TableCell>
            <TableCell className="text-right">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                        e.stopPropagation()
                        onToggleActive(org)
                    }}
                >
                    {org.isActive ? 'Suspend' : 'Reactivate'}
                </Button>
            </TableCell>
        </TableRow>
    )
}

function PlanBadge({ plan }: { plan: OrgPlan }) {
    const variants: Record<OrgPlan, 'default' | 'secondary' | 'outline'> = {
        free: 'outline',
        pro: 'secondary',
        enterprise: 'default',
    }

    return (
        <Badge variant={variants[plan]}>
            {plan.charAt(0).toUpperCase() + plan.slice(1)}
        </Badge>
    )
}

function StatusBadge({ isActive }: { isActive: boolean }) {
    return (
        <Badge variant={isActive ? 'default' : 'destructive'}>
            {isActive ? 'Active' : 'Suspended'}
        </Badge>
    )
}

function OrgTableSkeleton() {
    return (
        <div className="space-y-4">
            <div className="flex gap-4">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 w-[160px]" />
            </div>
            <Skeleton className="h-4 w-48" />
            <div className="border rounded-md">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 border-b last:border-b-0">
                        <Skeleton className="h-4 flex-1" />
                        <Skeleton className="h-6 w-16" />
                        <Skeleton className="h-4 w-12" />
                        <Skeleton className="h-4 w-12" />
                        <Skeleton className="h-6 w-16" />
                        <Skeleton className="h-8 w-20" />
                    </div>
                ))}
            </div>
        </div>
    )
}
