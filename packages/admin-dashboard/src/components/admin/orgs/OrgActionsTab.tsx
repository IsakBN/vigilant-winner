'use client'

/**
 * OrgActionsTab Component
 *
 * Admin actions for managing organizations:
 * - Suspend/reactivate organization
 * - Change plan
 */

import { useState } from 'react'
import {
    Button,
    Label,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@bundlenudge/shared-ui'
import {
    useSuspendOrg,
    useReactivateOrg,
    useUpdateAdminOrg,
} from '@/hooks/useAdminOrgs'
import type { OrgActionsTabProps } from './types'
import type { OrgPlan } from '@/lib/api/types'
import { PLAN_LABELS } from './utils'

export function OrgActionsTab({
    organization,
    onRefresh,
    onOrgUpdated,
}: OrgActionsTabProps) {
    const [showSuspend, setShowSuspend] = useState(false)
    const [selectedPlan, setSelectedPlan] = useState<OrgPlan>(organization.plan)
    const [showPlanChange, setShowPlanChange] = useState(false)

    // Mutations
    const suspendMutation = useSuspendOrg()
    const reactivateMutation = useReactivateOrg()
    const updateMutation = useUpdateAdminOrg(organization.id)

    const isLoading =
        suspendMutation.isPending ||
        reactivateMutation.isPending ||
        updateMutation.isPending

    function handleSuccess() {
        onRefresh()
        onOrgUpdated?.()
    }

    async function handleSuspend() {
        await suspendMutation.mutateAsync(organization.id)
        setShowSuspend(false)
        handleSuccess()
    }

    async function handleReactivate() {
        await reactivateMutation.mutateAsync(organization.id)
        handleSuccess()
    }

    async function handlePlanChange() {
        if (selectedPlan === organization.plan) return
        await updateMutation.mutateAsync({ plan: selectedPlan })
        setShowPlanChange(false)
        handleSuccess()
    }

    return (
        <div className="mt-4 space-y-4">
            {/* Suspend/Reactivate */}
            <ActionCard
                title="Organization Status"
                description={
                    organization.isActive
                        ? 'Suspend this organization to disable access for all members.'
                        : 'This organization is currently suspended.'
                }
            >
                {organization.isActive ? (
                    showSuspend ? (
                        <ConfirmAction
                            message="Are you sure you want to suspend this organization? All members will lose access."
                            onCancel={() => setShowSuspend(false)}
                            onConfirm={handleSuspend}
                            isLoading={isLoading}
                            confirmLabel="Suspend Organization"
                        />
                    ) : (
                        <Button
                            variant="destructive"
                            onClick={() => setShowSuspend(true)}
                            disabled={isLoading}
                        >
                            Suspend Organization
                        </Button>
                    )
                ) : (
                    <Button
                        variant="outline"
                        onClick={handleReactivate}
                        disabled={isLoading}
                    >
                        Reactivate Organization
                    </Button>
                )}
            </ActionCard>

            {/* Change Plan */}
            <ActionCard
                title="Change Plan"
                description={`Current plan: ${PLAN_LABELS[organization.plan]}`}
            >
                {showPlanChange ? (
                    <div className="space-y-3">
                        <div>
                            <Label className="text-sm">New Plan</Label>
                            <Select
                                value={selectedPlan}
                                onValueChange={(value: string) => setSelectedPlan(value as OrgPlan)}
                            >
                                <SelectTrigger className="w-full mt-1">
                                    <SelectValue placeholder="Select plan" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="free">Free</SelectItem>
                                    <SelectItem value="pro">Pro</SelectItem>
                                    <SelectItem value="enterprise">Enterprise</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowPlanChange(false)
                                    setSelectedPlan(organization.plan)
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handlePlanChange}
                                disabled={selectedPlan === organization.plan || isLoading}
                            >
                                Update Plan
                            </Button>
                        </div>
                    </div>
                ) : (
                    <Button
                        variant="outline"
                        onClick={() => setShowPlanChange(true)}
                        disabled={isLoading}
                    >
                        Change Plan
                    </Button>
                )}
            </ActionCard>

            {/* Organization Info */}
            <ActionCard
                title="Organization Info"
                description="Additional organization details."
            >
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">ID</span>
                        <span className="font-mono">{organization.id}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Members</span>
                        <span>{String(organization.memberCount)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Apps</span>
                        <span>{String(organization.appCount)}</span>
                    </div>
                </div>
            </ActionCard>
        </div>
    )
}

// Sub-components

interface ActionCardProps {
    title: string
    description: string
    children: React.ReactNode
}

function ActionCard({ title, description, children }: ActionCardProps) {
    return (
        <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-2">{title}</h4>
            <p className="text-sm text-muted-foreground mb-3">{description}</p>
            {children}
        </div>
    )
}

interface ConfirmActionProps {
    message: string
    onCancel: () => void
    onConfirm: () => void
    isLoading: boolean
    confirmLabel: string
}

function ConfirmAction({
    message,
    onCancel,
    onConfirm,
    isLoading,
    confirmLabel,
}: ConfirmActionProps) {
    return (
        <div className="space-y-3">
            <p className="text-sm text-red-600">{message}</p>
            <div className="flex gap-2">
                <Button variant="outline" onClick={onCancel}>
                    Cancel
                </Button>
                <Button variant="destructive" onClick={onConfirm} disabled={isLoading}>
                    {confirmLabel}
                </Button>
            </div>
        </div>
    )
}
