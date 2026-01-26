'use client'

/**
 * ReleaseForm Component
 *
 * Form for creating and editing releases.
 * Includes version input with semver validation, description, and channel selector.
 */

import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
    Button,
    Input,
    Label,
    Textarea,
    Switch,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui'

// =============================================================================
// Types
// =============================================================================

export interface ReleaseFormData {
    version: string
    description: string
    isMandatory: boolean
    channelId: string
}

export interface Channel {
    id: string
    name: string
}

interface ReleaseFormProps {
    initialData?: Partial<ReleaseFormData>
    channels: Channel[]
    onSubmit: (data: ReleaseFormData) => void
    isLoading?: boolean
    error?: string | null
    submitLabel?: string
}

interface FormErrors {
    version?: string
    channelId?: string
}

// =============================================================================
// Validation
// =============================================================================

const SEMVER_PATTERN = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([\da-zA-Z-]+(?:\.[\da-zA-Z-]+)*))?(?:\+([\da-zA-Z-]+(?:\.[\da-zA-Z-]+)*))?$/

function validateForm(data: Partial<ReleaseFormData>): FormErrors {
    const errors: FormErrors = {}

    if (!data.version?.trim()) {
        errors.version = 'Version is required'
    } else if (!SEMVER_PATTERN.test(data.version.trim())) {
        errors.version = 'Invalid semver format (e.g., 1.0.0, 2.1.0-beta.1)'
    }

    if (!data.channelId) {
        errors.channelId = 'Channel is required'
    }

    return errors
}

// =============================================================================
// Component
// =============================================================================

export function ReleaseForm({
    initialData,
    channels,
    onSubmit,
    isLoading = false,
    error,
    submitLabel = 'Create Release',
}: ReleaseFormProps) {
    const [version, setVersion] = useState(initialData?.version || '')
    const [description, setDescription] = useState(initialData?.description || '')
    const [isMandatory, setIsMandatory] = useState(initialData?.isMandatory || false)
    const [channelId, setChannelId] = useState(initialData?.channelId || '')
    const [errors, setErrors] = useState<FormErrors>({})
    const [touched, setTouched] = useState<Record<string, boolean>>({})

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        const formData: ReleaseFormData = {
            version: version.trim(),
            description: description.trim(),
            isMandatory,
            channelId,
        }

        const formErrors = validateForm(formData)
        setErrors(formErrors)
        setTouched({ version: true, channelId: true })

        if (Object.keys(formErrors).length > 0) {
            return
        }

        onSubmit(formData)
    }

    function handleBlur(field: keyof FormErrors) {
        setTouched((prev) => ({ ...prev, [field]: true }))
        const formErrors = validateForm({ version, channelId })
        setErrors((prev) => ({ ...prev, [field]: formErrors[field] }))
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && <ErrorAlert message={error} />}

            {/* Version */}
            <div className="space-y-2">
                <Label htmlFor="version">Version</Label>
                <Input
                    id="version"
                    type="text"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    onBlur={() => handleBlur('version')}
                    placeholder="1.0.0"
                    disabled={isLoading}
                    className={cn(touched.version && errors.version && 'border-red-500')}
                />
                <p className="text-sm text-muted-foreground">
                    Semantic versioning format (major.minor.patch)
                </p>
                {touched.version && errors.version && (
                    <p className="text-sm text-red-500">{errors.version}</p>
                )}
            </div>

            {/* Description */}
            <div className="space-y-2">
                <Label htmlFor="description">
                    Description <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What's new in this release..."
                    disabled={isLoading}
                    rows={4}
                />
                <p className="text-sm text-muted-foreground">
                    Release notes shown to users during update
                </p>
            </div>

            {/* Channel */}
            <div className="space-y-2">
                <Label htmlFor="channel">Channel</Label>
                <Select
                    value={channelId}
                    onValueChange={(value) => {
                        setChannelId(value)
                        setTouched((prev) => ({ ...prev, channelId: true }))
                    }}
                    disabled={isLoading}
                >
                    <SelectTrigger
                        id="channel"
                        className={cn(touched.channelId && errors.channelId && 'border-red-500')}
                    >
                        <SelectValue placeholder="Select a channel" />
                    </SelectTrigger>
                    <SelectContent>
                        {channels.map((channel) => (
                            <SelectItem key={channel.id} value={channel.id}>
                                {channel.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {touched.channelId && errors.channelId && (
                    <p className="text-sm text-red-500">{errors.channelId}</p>
                )}
            </div>

            {/* Mandatory Toggle */}
            <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                    <Label htmlFor="mandatory" className="cursor-pointer">
                        Mandatory Update
                    </Label>
                    <p className="text-sm text-muted-foreground">
                        Force users to update before using the app
                    </p>
                </div>
                <Switch
                    id="mandatory"
                    checked={isMandatory}
                    onCheckedChange={setIsMandatory}
                    disabled={isLoading}
                />
            </div>

            {isMandatory && (
                <div className="flex items-center gap-2 rounded-lg bg-yellow-50 border border-yellow-200 p-3 text-sm text-yellow-800">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>Mandatory updates interrupt user experience. Use sparingly.</span>
                </div>
            )}

            {/* Submit */}
            <Button
                type="submit"
                disabled={isLoading}
                size="lg"
                className="w-full"
            >
                {isLoading ? 'Saving...' : submitLabel}
            </Button>
        </form>
    )
}

// =============================================================================
// Helper Components
// =============================================================================

function ErrorAlert({ message }: { message: string }) {
    return (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {message}
        </div>
    )
}
