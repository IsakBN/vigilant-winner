'use client'

/**
 * FlagFormDialog Component
 *
 * Dialog for creating/editing feature flags with:
 * - Name, key, description
 * - Type selection (boolean/percentage/json)
 * - Targeting options (via FlagTargetingFields)
 */

import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    Button,
    Input,
    Label,
    Textarea,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@bundlenudge/shared-ui'
import { FlagTargetingFields } from './FlagTargetingFields'
import type {
    FeatureFlag,
    FeatureFlagType,
    CreateFeatureFlagInput,
    UpdateFeatureFlagInput,
    OrgPlan,
} from '@/lib/api/types'

export interface FlagFormDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    flag: FeatureFlag | null
    onSubmit: (data: CreateFeatureFlagInput | UpdateFeatureFlagInput, flagId?: string) => void
    isSubmitting: boolean
}

export function FlagFormDialog({
    open,
    onOpenChange,
    flag,
    onSubmit,
    isSubmitting,
}: FlagFormDialogProps) {
    const isEditing = Boolean(flag)

    // Form state
    const [key, setKey] = useState('')
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [type, setType] = useState<FeatureFlagType>('boolean')
    const [rolloutPercentage, setRolloutPercentage] = useState(100)
    const [targetOrgIds, setTargetOrgIds] = useState('')
    const [targetPlanTypes, setTargetPlanTypes] = useState<OrgPlan[]>([])

    // Reset form when dialog opens/closes or flag changes
    useEffect(() => {
        if (open) {
            if (flag) {
                setKey(flag.key)
                setName(flag.name)
                setDescription(flag.description ?? '')
                setType(flag.type)
                setRolloutPercentage(flag.rolloutPercentage)
                setTargetOrgIds(flag.targetOrgIds.join(', '))
                setTargetPlanTypes(flag.targetPlanTypes)
            } else {
                setKey('')
                setName('')
                setDescription('')
                setType('boolean')
                setRolloutPercentage(100)
                setTargetOrgIds('')
                setTargetPlanTypes([])
            }
        }
    }, [open, flag])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        const orgIds = targetOrgIds
            .split(',')
            .map((id) => id.trim())
            .filter(Boolean)

        if (isEditing && flag) {
            const updateData: UpdateFeatureFlagInput = {
                name,
                description: description || undefined,
                rolloutPercentage,
                targetOrgIds: orgIds,
                targetPlanTypes,
            }
            onSubmit(updateData, flag.id)
        } else {
            const createData: CreateFeatureFlagInput = {
                key,
                name,
                description: description || undefined,
                type,
            }
            onSubmit(createData)
        }
    }

    const togglePlanType = (plan: OrgPlan) => {
        setTargetPlanTypes((prev) =>
            prev.includes(plan) ? prev.filter((p) => p !== plan) : [...prev, plan]
        )
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? 'Edit Feature Flag' : 'Create Feature Flag'}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? 'Update the feature flag settings and targeting rules.'
                            : 'Create a new feature flag to control feature rollout.'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Key (only for create) */}
                    {!isEditing && (
                        <div className="space-y-2">
                            <Label htmlFor="key">Key</Label>
                            <Input
                                id="key"
                                value={key}
                                onChange={(e) => setKey(e.target.value)}
                                placeholder="feature_key"
                                required
                                pattern="^[a-z][a-z0-9_]*$"
                                title="Lowercase letters, numbers, underscores. Start with letter."
                            />
                            <p className="text-xs text-text-light">
                                Unique identifier used in code. Cannot be changed later.
                            </p>
                        </div>
                    )}

                    {/* Name */}
                    <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Feature Name"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="What does this flag control?"
                            rows={2}
                        />
                    </div>

                    {/* Type (only for create) */}
                    {!isEditing && (
                        <div className="space-y-2">
                            <Label htmlFor="type">Type</Label>
                            <Select
                                value={type}
                                onValueChange={(v) => setType(v as FeatureFlagType)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="boolean">Boolean</SelectItem>
                                    <SelectItem value="percentage">Percentage</SelectItem>
                                    <SelectItem value="json">JSON</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Targeting fields (only for editing) */}
                    {isEditing && (
                        <FlagTargetingFields
                            rolloutPercentage={rolloutPercentage}
                            onRolloutChange={setRolloutPercentage}
                            targetOrgIds={targetOrgIds}
                            onTargetOrgIdsChange={setTargetOrgIds}
                            targetPlanTypes={targetPlanTypes}
                            onPlanTypeToggle={togglePlanType}
                        />
                    )}

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {isEditing ? 'Save Changes' : 'Create Flag'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
