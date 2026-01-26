'use client'

/**
 * FeatureFlagEditor Component
 *
 * Form for creating and editing feature flags with rollout and targeting controls.
 */

import { useState, useCallback, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    Button,
    Input,
    Label,
    Textarea,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    Slider,
    Switch,
    useToast,
} from '@/components/ui'
import { useFeatureFlagActions } from '@/hooks/useAdmin'
import type { FeatureFlag, FeatureFlagType, OrgPlan } from '@/lib/api'

interface FeatureFlagEditorProps {
    flag?: FeatureFlag | null
    open: boolean
    onClose: () => void
}

interface FormData {
    key: string
    name: string
    description: string
    type: FeatureFlagType
    enabled: boolean
    rolloutPercentage: number
    targetPlanTypes: OrgPlan[]
}

const DEFAULT_FORM_DATA: FormData = {
    key: '',
    name: '',
    description: '',
    type: 'boolean',
    enabled: false,
    rolloutPercentage: 100,
    targetPlanTypes: [],
}

export function FeatureFlagEditor({ flag, open, onClose }: FeatureFlagEditorProps) {
    const [formData, setFormData] = useState<FormData>(DEFAULT_FORM_DATA)
    const { createFlag, updateFlag } = useFeatureFlagActions()
    const { toast } = useToast()

    const isEditing = Boolean(flag)

    // Initialize form data when flag changes
    useEffect(() => {
        if (flag) {
            setFormData({
                key: flag.key,
                name: flag.name,
                description: flag.description ?? '',
                type: flag.type,
                enabled: flag.enabled,
                rolloutPercentage: flag.rolloutPercentage,
                targetPlanTypes: flag.targetPlanTypes,
            })
        } else {
            setFormData(DEFAULT_FORM_DATA)
        }
    }, [flag])

    const handleChange = useCallback(
        (field: keyof FormData, value: FormData[keyof FormData]) => {
            setFormData((prev) => ({ ...prev, [field]: value }))
        },
        []
    )

    const handlePlanToggle = useCallback((plan: OrgPlan) => {
        setFormData((prev) => {
            const plans = prev.targetPlanTypes.includes(plan)
                ? prev.targetPlanTypes.filter((p) => p !== plan)
                : [...prev.targetPlanTypes, plan]
            return { ...prev, targetPlanTypes: plans }
        })
    }, [])

    const handleSubmit = useCallback(
        (e: React.FormEvent) => {
            e.preventDefault()

            if (isEditing && flag) {
                updateFlag.mutate(
                    {
                        flagId: flag.id,
                        data: {
                            name: formData.name,
                            description: formData.description || undefined,
                            enabled: formData.enabled,
                            rolloutPercentage: formData.rolloutPercentage,
                            targetPlanTypes: formData.targetPlanTypes,
                        },
                    },
                    {
                        onSuccess: () => {
                            toast({
                                title: 'Flag updated',
                                description: `"${formData.name}" has been updated.`,
                            })
                            onClose()
                        },
                        onError: (err) => {
                            toast({
                                title: 'Error',
                                description: err.message,
                                variant: 'error',
                            })
                        },
                    }
                )
            } else {
                createFlag.mutate(
                    {
                        key: formData.key,
                        name: formData.name,
                        description: formData.description || undefined,
                        type: formData.type,
                    },
                    {
                        onSuccess: () => {
                            toast({
                                title: 'Flag created',
                                description: `"${formData.name}" has been created.`,
                            })
                            onClose()
                        },
                        onError: (err) => {
                            toast({
                                title: 'Error',
                                description: err.message,
                                variant: 'error',
                            })
                        },
                    }
                )
            }
        },
        [isEditing, flag, formData, createFlag, updateFlag, toast, onClose]
    )

    const isSubmitting = createFlag.isPending || updateFlag.isPending

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>
                            {isEditing ? 'Edit Feature Flag' : 'Create Feature Flag'}
                        </DialogTitle>
                        <DialogDescription>
                            {isEditing
                                ? 'Update the feature flag settings.'
                                : 'Create a new feature flag to control feature rollouts.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        {/* Key (only for new flags) */}
                        {!isEditing && (
                            <div className="grid gap-2">
                                <Label htmlFor="key">Key</Label>
                                <Input
                                    id="key"
                                    value={formData.key}
                                    onChange={(e) => handleChange('key', e.target.value)}
                                    placeholder="feature_new_dashboard"
                                    pattern="^[a-z][a-z0-9_]*$"
                                    required
                                />
                                <p className="text-xs text-muted-foreground">
                                    Lowercase letters, numbers, and underscores only.
                                </p>
                            </div>
                        )}

                        {/* Name */}
                        <div className="grid gap-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => handleChange('name', e.target.value)}
                                placeholder="New Dashboard"
                                required
                            />
                        </div>

                        {/* Description */}
                        <div className="grid gap-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => handleChange('description', e.target.value)}
                                placeholder="Enable the new dashboard experience"
                                rows={2}
                            />
                        </div>

                        {/* Type (only for new flags) */}
                        {!isEditing && (
                            <div className="grid gap-2">
                                <Label htmlFor="type">Type</Label>
                                <Select
                                    value={formData.type}
                                    onValueChange={(v) => handleChange('type', v as FeatureFlagType)}
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

                        {/* Enabled toggle (only for editing) */}
                        {isEditing && (
                            <div className="flex items-center justify-between">
                                <Label htmlFor="enabled">Enabled</Label>
                                <Switch
                                    id="enabled"
                                    checked={formData.enabled}
                                    onCheckedChange={(v) => handleChange('enabled', v)}
                                />
                            </div>
                        )}

                        {/* Rollout percentage (for percentage type) */}
                        {(formData.type === 'percentage' || isEditing) && (
                            <div className="grid gap-2">
                                <div className="flex items-center justify-between">
                                    <Label>Rollout Percentage</Label>
                                    <span className="text-sm font-medium">
                                        {formData.rolloutPercentage}%
                                    </span>
                                </div>
                                <Slider
                                    value={[formData.rolloutPercentage]}
                                    onValueChange={([v]) => handleChange('rolloutPercentage', v)}
                                    max={100}
                                    step={1}
                                />
                            </div>
                        )}

                        {/* Target Plans */}
                        {isEditing && (
                            <div className="grid gap-2">
                                <Label>Target Plans</Label>
                                <div className="flex gap-4">
                                    {(['free', 'pro', 'enterprise'] as OrgPlan[]).map((plan) => (
                                        <label
                                            key={plan}
                                            className="flex items-center gap-2 cursor-pointer"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={formData.targetPlanTypes.includes(plan)}
                                                onChange={() => handlePlanToggle(plan)}
                                                className="rounded"
                                            />
                                            <span className="text-sm capitalize">{plan}</span>
                                        </label>
                                    ))}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Leave empty to target all plans.
                                </p>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
