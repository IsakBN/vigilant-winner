'use client'

/**
 * OrgDetail Component
 *
 * Displays detailed organization information including members, apps, and admin actions.
 */

import { useCallback } from 'react'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    Badge,
    Button,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    Skeleton,
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    useConfirm,
} from '@/components/ui'
import {
    useAdminOrg,
    useUpdateAdminOrg,
    useSuspendOrg,
    useReactivateOrg,
    useDeleteAdminOrg,
} from '@/hooks/useAdmin'
import type { OrgPlan, AdminOrgMember, AdminOrgApp } from '@/lib/api'

interface OrgDetailProps {
    orgId: string
}

export function OrgDetail({ orgId }: OrgDetailProps) {
    const { organization, isLoading, isError, error } = useAdminOrg(orgId)
    const updateOrg = useUpdateAdminOrg(orgId)
    const suspendOrg = useSuspendOrg()
    const reactivateOrg = useReactivateOrg()
    const deleteOrg = useDeleteAdminOrg()
    const confirm = useConfirm()

    const handlePlanChange = useCallback(
        (plan: string) => {
            updateOrg.mutate({ plan: plan as OrgPlan })
        },
        [updateOrg]
    )

    const handleToggleActive = useCallback(async () => {
        if (!organization) return

        if (organization.isActive) {
            const confirmed = await confirm({
                title: 'Suspend Organization',
                description: `Are you sure you want to suspend "${organization.name}"? Users will not be able to access their apps.`,
            })
            if (confirmed) {
                suspendOrg.mutate(orgId)
            }
        } else {
            reactivateOrg.mutate(orgId)
        }
    }, [organization, confirm, suspendOrg, reactivateOrg, orgId])

    const handleDelete = useCallback(async () => {
        if (!organization) return

        const confirmed = await confirm({
            title: 'Delete Organization',
            description: `This will permanently delete "${organization.name}" and all associated data. This cannot be undone.`,
        })
        if (confirmed) {
            deleteOrg.mutate(orgId)
        }
    }, [organization, confirm, deleteOrg, orgId])

    if (isLoading) {
        return <OrgDetailSkeleton />
    }

    if (isError || !organization) {
        return (
            <div className="text-center py-8">
                <p className="text-destructive">
                    Failed to load organization: {error?.message ?? 'Not found'}
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold">{organization.name}</h1>
                    <p className="text-muted-foreground">{organization.email}</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant={organization.isActive ? 'outline' : 'default'}
                        onClick={handleToggleActive}
                    >
                        {organization.isActive ? 'Suspend' : 'Reactivate'}
                    </Button>
                    <Button variant="destructive" onClick={handleDelete}>
                        Delete
                    </Button>
                </div>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Plan</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Select
                            value={organization.plan}
                            onValueChange={handlePlanChange}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="free">Free</SelectItem>
                                <SelectItem value="pro">Pro</SelectItem>
                                <SelectItem value="enterprise">Enterprise</SelectItem>
                            </SelectContent>
                        </Select>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Members</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">{organization.memberCount}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Apps</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">{organization.appCount}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Status</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Badge variant={organization.isActive ? 'default' : 'destructive'}>
                            {organization.isActive ? 'Active' : 'Suspended'}
                        </Badge>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs for Members and Apps */}
            <Tabs defaultValue="members">
                <TabsList>
                    <TabsTrigger value="members">
                        Members ({organization.members?.length ?? 0})
                    </TabsTrigger>
                    <TabsTrigger value="apps">
                        Apps ({organization.apps?.length ?? 0})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="members" className="mt-4">
                    <MembersTable members={organization.members ?? []} />
                </TabsContent>

                <TabsContent value="apps" className="mt-4">
                    <AppsTable apps={organization.apps ?? []} />
                </TabsContent>
            </Tabs>
        </div>
    )
}

function MembersTable({ members }: { members: AdminOrgMember[] }) {
    if (members.length === 0) {
        return <p className="text-muted-foreground py-4">No members found</p>
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {members.map((member) => (
                    <TableRow key={member.id}>
                        <TableCell>{member.name ?? 'Unknown'}</TableCell>
                        <TableCell>{member.email}</TableCell>
                        <TableCell>
                            <Badge variant="outline">{member.role}</Badge>
                        </TableCell>
                        <TableCell>
                            {new Date(member.joinedAt).toLocaleDateString()}
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}

function AppsTable({ apps }: { apps: AdminOrgApp[] }) {
    if (apps.length === 0) {
        return <p className="text-muted-foreground py-4">No apps found</p>
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Platform</TableHead>
                    <TableHead>Bundle ID</TableHead>
                    <TableHead className="text-right">Active Devices</TableHead>
                    <TableHead>Last Release</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {apps.map((app) => (
                    <TableRow key={app.id}>
                        <TableCell className="font-medium">{app.name}</TableCell>
                        <TableCell>
                            <Badge variant="outline">{app.platform}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                            {app.bundleId ?? '-'}
                        </TableCell>
                        <TableCell className="text-right">{app.activeDevices}</TableCell>
                        <TableCell>
                            {app.lastReleaseAt
                                ? new Date(app.lastReleaseAt).toLocaleDateString()
                                : 'Never'}
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}

function OrgDetailSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between">
                <div>
                    <Skeleton className="h-8 w-48 mb-2" />
                    <Skeleton className="h-4 w-32" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-20" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i}>
                        <CardHeader className="pb-2">
                            <Skeleton className="h-4 w-16" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-8 w-20" />
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-64 w-full" />
        </div>
    )
}
