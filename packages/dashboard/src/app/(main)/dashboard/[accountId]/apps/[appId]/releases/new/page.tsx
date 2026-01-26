'use client'

import { useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Upload, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { useCreateRelease, useChannels } from '@/hooks/useReleases'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

// =============================================================================
// Types
// =============================================================================

interface FormState {
    version: string
    description: string
    channel: string
    minAppVersion: string
    maxAppVersion: string
    rolloutPercentage: number
}

interface FormErrors {
    version?: string
    channel?: string
    bundle?: string
}

// =============================================================================
// Helper Components
// =============================================================================

function BundleUploadArea({
    file,
    onFileSelect,
    error,
}: {
    file: File | null
    onFileSelect: (file: File | null) => void
    error?: string
}) {
    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault()
            const droppedFile = e.dataTransfer.files[0]
            if (droppedFile) {
                onFileSelect(droppedFile)
            }
        },
        [onFileSelect]
    )

    const handleFileInput = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const selectedFile = e.target.files?.[0]
            if (selectedFile) {
                onFileSelect(selectedFile)
            }
        },
        [onFileSelect]
    )

    return (
        <div className="space-y-2">
            <Label>Bundle File</Label>
            <div
                className={cn(
                    'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
                    error ? 'border-red-300 bg-red-50' : 'border-neutral-200 hover:border-primary/50',
                    file && 'border-green-300 bg-green-50'
                )}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
            >
                {file ? (
                    <div className="flex flex-col items-center gap-2">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                        <p className="text-sm font-medium text-green-700">{file.name}</p>
                        <p className="text-xs text-green-600">
                            {(file.size / 1024).toFixed(1)} KB
                        </p>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onFileSelect(null)}
                            className="mt-2"
                        >
                            Remove
                        </Button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-2">
                        <Upload className="w-8 h-8 text-neutral-400" />
                        <p className="text-sm text-neutral-600">
                            Drag and drop your bundle file here, or{' '}
                            <label className="text-primary cursor-pointer hover:underline">
                                browse
                                <input
                                    type="file"
                                    accept=".zip,.bundle"
                                    className="hidden"
                                    onChange={handleFileInput}
                                />
                            </label>
                        </p>
                        <p className="text-xs text-neutral-400">
                            Accepts .zip or .bundle files
                        </p>
                    </div>
                )}
            </div>
            {error && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                </p>
            )}
        </div>
    )
}

// =============================================================================
// Main Page Component
// =============================================================================

export default function CreateReleasePage() {
    const params = useParams()
    const router = useRouter()
    const appId = params.appId as string
    const accountId = params.accountId as string

    // Form state
    const [form, setForm] = useState<FormState>({
        version: '',
        description: '',
        channel: 'production',
        minAppVersion: '',
        maxAppVersion: '',
        rolloutPercentage: 100,
    })
    const [bundleFile, setBundleFile] = useState<File | null>(null)
    const [errors, setErrors] = useState<FormErrors>({})

    // Hooks
    const { data: channels = [] } = useChannels(appId)
    const createRelease = useCreateRelease(appId)

    const basePath = `/dashboard/${accountId}/apps/${appId}`

    // Form handlers
    const updateField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
        setForm((prev) => ({ ...prev, [field]: value }))
        if (errors[field as keyof FormErrors]) {
            setErrors((prev) => ({ ...prev, [field]: undefined }))
        }
    }

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {}

        if (!form.version.trim()) {
            newErrors.version = 'Version is required'
        } else if (!/^\d+\.\d+\.\d+/.test(form.version)) {
            newErrors.version = 'Version must be in semver format (e.g., 1.0.0)'
        }

        if (!form.channel) {
            newErrors.channel = 'Channel is required'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateForm()) {
            return
        }

        try {
            await createRelease.mutateAsync({
                version: form.version,
                description: form.description || undefined,
                channel: form.channel,
                minAppVersion: form.minAppVersion || undefined,
                maxAppVersion: form.maxAppVersion || undefined,
                rolloutPercentage: form.rolloutPercentage,
                bundleFile: bundleFile ?? undefined,
            })

            router.push(`${basePath}/releases`)
        } catch {
            // Error is handled by the mutation
        }
    }

    // Default channels if none loaded
    const availableChannels = channels.length > 0
        ? channels
        : [
            { id: 'production', name: 'Production', description: null, isDefault: true },
            { id: 'staging', name: 'Staging', description: null, isDefault: false },
            { id: 'development', name: 'Development', description: null, isDefault: false },
        ]

    return (
        <div className="space-y-6 max-w-2xl">
            {/* Header */}
            <div>
                <Link
                    href={`${basePath}/releases`}
                    className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700 transition-colors mb-2"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Releases
                </Link>
                <h1 className="text-2xl font-bold text-neutral-900">Create Release</h1>
                <p className="text-sm text-neutral-500 mt-1">
                    Push a new OTA update to your app users
                </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Version & Channel */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Release Info</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="version">Version *</Label>
                                <Input
                                    id="version"
                                    placeholder="1.0.0"
                                    value={form.version}
                                    onChange={(e) => updateField('version', e.target.value)}
                                    className={cn(errors.version && 'border-red-300')}
                                />
                                {errors.version && (
                                    <p className="text-sm text-red-600">{errors.version}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="channel">Channel *</Label>
                                <Select
                                    value={form.channel}
                                    onValueChange={(value) => updateField('channel', value)}
                                >
                                    <SelectTrigger className={cn(errors.channel && 'border-red-300')}>
                                        <SelectValue placeholder="Select channel" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableChannels.map((channel) => (
                                            <SelectItem key={channel.id} value={channel.name.toLowerCase()}>
                                                {channel.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.channel && (
                                    <p className="text-sm text-red-600">{errors.channel}</p>
                                )}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                placeholder="What's new in this release..."
                                value={form.description}
                                onChange={(e) => updateField('description', e.target.value)}
                                rows={3}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Bundle Upload */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Bundle</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <BundleUploadArea
                            file={bundleFile}
                            onFileSelect={setBundleFile}
                            error={errors.bundle}
                        />
                    </CardContent>
                </Card>

                {/* Targeting */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Targeting</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="minAppVersion">Min App Version</Label>
                                <Input
                                    id="minAppVersion"
                                    placeholder="1.0.0"
                                    value={form.minAppVersion}
                                    onChange={(e) => updateField('minAppVersion', e.target.value)}
                                />
                                <p className="text-xs text-neutral-400">
                                    Only apps {'>='} this version will receive the update
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="maxAppVersion">Max App Version</Label>
                                <Input
                                    id="maxAppVersion"
                                    placeholder="2.0.0"
                                    value={form.maxAppVersion}
                                    onChange={(e) => updateField('maxAppVersion', e.target.value)}
                                />
                                <p className="text-xs text-neutral-400">
                                    Only apps {'<='} this version will receive the update
                                </p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label>Rollout Percentage</Label>
                                <span className="text-sm font-medium text-neutral-900">
                                    {form.rolloutPercentage}%
                                </span>
                            </div>
                            <Slider
                                value={[form.rolloutPercentage]}
                                onValueChange={([value]) => updateField('rolloutPercentage', value)}
                                min={0}
                                max={100}
                                step={5}
                            />
                            <p className="text-xs text-neutral-400">
                                Start with a lower percentage to safely roll out to a subset of users
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Submit */}
                <div className="flex items-center justify-end gap-3">
                    <Button variant="outline" asChild>
                        <Link href={`${basePath}/releases`}>Cancel</Link>
                    </Button>
                    <Button type="submit" disabled={createRelease.isPending}>
                        {createRelease.isPending ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            'Create Release'
                        )}
                    </Button>
                </div>

                {createRelease.error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                        {createRelease.error instanceof Error
                            ? createRelease.error.message
                            : 'Failed to create release'}
                    </div>
                )}
            </form>
        </div>
    )
}
