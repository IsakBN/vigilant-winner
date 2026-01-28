'use client'

/**
 * OrgOverviewTab Component
 *
 * Displays organization overview information including:
 * - Basic info (name, slug, created date)
 * - Plan details with limits
 * - Usage statistics
 */

import { Badge, Label } from '@bundlenudge/shared-ui'
import type { OrgTabProps } from './types'
import {
    formatDate,
    formatLastActive,
    getPlanBadgeClass,
    getStatusBadgeClass,
    getPlanLimits,
} from './utils'

export function OrgOverviewTab({ organization }: OrgTabProps) {
    const limits = getPlanLimits(organization.plan)
    const memberCount = organization.members?.length ?? organization.memberCount ?? 0
    const appCount = organization.apps?.length ?? organization.appCount ?? 0

    return (
        <div className="space-y-4 mt-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label className="text-xs text-muted-foreground">Name</Label>
                    <p className="text-sm font-medium">{organization.name}</p>
                </div>
                <div>
                    <Label className="text-xs text-muted-foreground">Slug</Label>
                    <p className="text-sm font-medium font-mono">{organization.slug}</p>
                </div>
                <div>
                    <Label className="text-xs text-muted-foreground">Created</Label>
                    <p className="text-sm font-medium">{formatDate(organization.createdAt)}</p>
                </div>
                <div>
                    <Label className="text-xs text-muted-foreground">Last Active</Label>
                    <p className="text-sm font-medium">
                        {formatLastActive(organization.lastActiveAt)}
                    </p>
                </div>
            </div>

            {/* Contact Info */}
            {(organization.email ?? organization.billingEmail) && (
                <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">Contact</h4>
                    <div className="grid grid-cols-2 gap-4">
                        {organization.email && (
                            <div>
                                <Label className="text-xs text-muted-foreground">Email</Label>
                                <p className="text-sm font-medium">{organization.email}</p>
                            </div>
                        )}
                        {organization.billingEmail && (
                            <div>
                                <Label className="text-xs text-muted-foreground">
                                    Billing Email
                                </Label>
                                <p className="text-sm font-medium">{organization.billingEmail}</p>
                            </div>
                        )}
                        {organization.domain && (
                            <div>
                                <Label className="text-xs text-muted-foreground">Domain</Label>
                                <p className="text-sm font-medium">{organization.domain}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Status & Plan */}
            <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-2">Status & Plan</h4>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label className="text-xs text-muted-foreground">Status</Label>
                        <div className="mt-1">
                            <Badge className={getStatusBadgeClass(organization.isActive)}>
                                {organization.isActive ? 'Active' : 'Suspended'}
                            </Badge>
                        </div>
                    </div>
                    <div>
                        <Label className="text-xs text-muted-foreground">Plan</Label>
                        <div className="mt-1">
                            <Badge className={getPlanBadgeClass(organization.plan)}>
                                {organization.plan.toUpperCase()}
                            </Badge>
                        </div>
                    </div>
                </div>
            </div>

            {/* Plan Limits */}
            <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-2">Plan Limits</h4>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label className="text-xs text-muted-foreground">Monthly Active Users</Label>
                        <p className="text-sm font-medium">{limits.mau}</p>
                    </div>
                    <div>
                        <Label className="text-xs text-muted-foreground">Apps</Label>
                        <p className="text-sm font-medium">{limits.apps}</p>
                    </div>
                    <div>
                        <Label className="text-xs text-muted-foreground">Storage</Label>
                        <p className="text-sm font-medium">{limits.storage}</p>
                    </div>
                    <div>
                        <Label className="text-xs text-muted-foreground">Team Members</Label>
                        <p className="text-sm font-medium">{limits.members}</p>
                    </div>
                </div>
            </div>

            {/* Usage Stats */}
            <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-2">Current Usage</h4>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label className="text-xs text-muted-foreground">Members</Label>
                        <p className="text-sm font-medium">{String(memberCount)}</p>
                    </div>
                    <div>
                        <Label className="text-xs text-muted-foreground">Apps</Label>
                        <p className="text-sm font-medium">{String(appCount)}</p>
                    </div>
                </div>
            </div>

            {/* Stripe Info */}
            {organization.stripeCustomerId && (
                <div className="border rounded-lg p-4 bg-muted/20">
                    <h4 className="font-medium mb-2">Billing</h4>
                    <div>
                        <Label className="text-xs text-muted-foreground">Stripe Customer ID</Label>
                        <p className="text-sm font-medium font-mono">
                            {organization.stripeCustomerId}
                        </p>
                    </div>
                </div>
            )}
        </div>
    )
}
