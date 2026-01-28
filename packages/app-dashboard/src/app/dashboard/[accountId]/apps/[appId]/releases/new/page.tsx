'use client'

/**
 * Create Release Page
 *
 * Form for creating a new OTA release with bundle upload.
 */

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useCreateRelease, useUploadBundle } from '@/hooks/useReleases'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@bundlenudge/shared-ui'
import {
    BundleUploader,
    ReleaseInfoCard,
    TargetingCard,
    type ReleaseFormState,
    type ReleaseFormErrors,
} from '@/components/releases'

const DEFAULT_CHANNELS = [
    { id: 'production', name: 'Production' },
    { id: 'staging', name: 'Staging' },
    { id: 'development', name: 'Development' },
]

// =============================================================================
// Main Component
// =============================================================================

export default function CreateReleasePage() {
    const params = useParams()
    const router = useRouter()
    const appId = params.appId as string
    const accountId = params.accountId as string

    const [form, setForm] = useState<ReleaseFormState>({
        version: '',
        description: '',
        channel: 'production',
        minAppVersion: '',
        maxAppVersion: '',
        rolloutPercentage: 100,
    })
    const [bundleFile, setBundleFile] = useState<File | null>(null)
    const [errors, setErrors] = useState<ReleaseFormErrors>({})

    const createRelease = useCreateRelease(accountId, appId)
    const uploadBundle = useUploadBundle(accountId, appId)

    const basePath = `/dashboard/${accountId}/apps/${appId}`
    const channels = DEFAULT_CHANNELS

    const updateField = <K extends keyof ReleaseFormState>(
        field: K,
        value: ReleaseFormState[K]
    ) => {
        setForm((prev) => ({ ...prev, [field]: value }))
        if (errors[field as keyof ReleaseFormErrors]) {
            setErrors((prev) => ({ ...prev, [field]: undefined }))
        }
    }

    const validateForm = (): boolean => {
        const newErrors: ReleaseFormErrors = {}

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

        if (!validateForm()) return

        try {
            const result = await createRelease.mutateAsync({
                version: form.version,
                description: form.description || undefined,
                channel: form.channel,
                minAppVersion: form.minAppVersion || undefined,
                maxAppVersion: form.maxAppVersion || undefined,
                rolloutPercentage: form.rolloutPercentage,
            })

            // Upload bundle if provided
            if (bundleFile && result.release?.id) {
                await uploadBundle.mutateAsync({
                    releaseId: result.release.id,
                    file: bundleFile,
                })
            }

            router.push(`${basePath}/releases`)
        } catch {
            // Error handled by mutation
        }
    }

    const isSubmitting = createRelease.isPending || uploadBundle.isPending
    const error = createRelease.error ?? uploadBundle.error

    return (
        <div className="space-y-6 max-w-2xl p-6">
            {/* Header */}
            <div>
                <Link
                    href={`${basePath}/releases`}
                    className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700 transition-colors mb-2"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Releases
                </Link>
                <h1 className="text-2xl font-bold text-neutral-900">
                    Create Release
                </h1>
                <p className="text-sm text-neutral-500 mt-1">
                    Push a new OTA update to your app users
                </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
                <ReleaseInfoCard
                    form={form}
                    errors={errors}
                    channels={channels}
                    onUpdateField={updateField}
                />

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Bundle</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <BundleUploader
                            file={bundleFile}
                            onFileSelect={setBundleFile}
                            error={errors.bundle}
                        />
                    </CardContent>
                </Card>

                <TargetingCard form={form} onUpdateField={updateField} />

                {/* Submit Actions */}
                <div className="flex items-center justify-end gap-3">
                    <Button variant="outline" asChild>
                        <Link href={`${basePath}/releases`}>Cancel</Link>
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                {uploadBundle.isPending ? 'Uploading...' : 'Creating...'}
                            </>
                        ) : (
                            'Create Release'
                        )}
                    </Button>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                        {error.message ?? 'Failed to create release'}
                    </div>
                )}
            </form>
        </div>
    )
}
