'use client'

/**
 * StorageConfigSection Component
 *
 * Storage configuration section for admin settings.
 */

import { Database } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { ConfigSection, ConfigForm } from '@/components/admin'
import { useUpdateStorageConfig } from '@/hooks/useAdmin'
import type { StorageConfig } from '@/lib/api'

interface StorageConfigSectionProps {
    config: StorageConfig
}

const STORAGE_PROVIDERS = [
    { value: 'r2', label: 'Cloudflare R2' },
    { value: 's3', label: 'Amazon S3' },
    { value: 'gcs', label: 'Google Cloud Storage' },
]

const REGIONS = [
    { value: 'auto', label: 'Auto (Cloudflare R2)' },
    { value: 'us-east-1', label: 'US East (N. Virginia)' },
    { value: 'us-west-2', label: 'US West (Oregon)' },
    { value: 'eu-west-1', label: 'EU (Ireland)' },
    { value: 'ap-southeast-1', label: 'Asia Pacific (Singapore)' },
]

/**
 * Format bytes to human-readable size
 */
function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

export function StorageConfigSection({ config }: StorageConfigSectionProps) {
    const updateConfig = useUpdateStorageConfig()

    const handleSubmit = async (values: StorageConfig) => {
        await updateConfig.mutateAsync(values)
    }

    return (
        <ConfigSection
            title="Storage Settings"
            description="Configure bundle storage and CDN settings."
            icon={<Database className="h-5 w-5" />}
            status={config.cdnEnabled ? 'enabled' : 'disabled'}
            statusLabel={config.cdnEnabled ? 'CDN Enabled' : 'CDN Disabled'}
        >
            <ConfigForm
                initialValues={config}
                onSubmit={handleSubmit}
                isSubmitting={updateConfig.isPending}
            >
                {({ values, setValue }) => (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="storage-provider">Provider</Label>
                                <Select
                                    value={values.provider}
                                    onValueChange={(value) =>
                                        setValue(
                                            'provider',
                                            value as StorageConfig['provider']
                                        )
                                    }
                                >
                                    <SelectTrigger
                                        id="storage-provider"
                                        className="mt-1"
                                    >
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {STORAGE_PROVIDERS.map((provider) => (
                                            <SelectItem
                                                key={provider.value}
                                                value={provider.value}
                                            >
                                                {provider.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="storage-region">Region</Label>
                                <Select
                                    value={values.region}
                                    onValueChange={(value) =>
                                        setValue('region', value)
                                    }
                                >
                                    <SelectTrigger
                                        id="storage-region"
                                        className="mt-1"
                                    >
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {REGIONS.map((region) => (
                                            <SelectItem
                                                key={region.value}
                                                value={region.value}
                                            >
                                                {region.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="bucket-name">Bucket Name</Label>
                                <Input
                                    id="bucket-name"
                                    value={values.bucketName}
                                    onChange={(e) =>
                                        setValue('bucketName', e.target.value)
                                    }
                                    placeholder="bundlenudge-bundles"
                                    className="mt-1"
                                />
                            </div>

                            <div>
                                <Label htmlFor="max-bundle-size">
                                    Max Bundle Size (MB)
                                </Label>
                                <Input
                                    id="max-bundle-size"
                                    type="number"
                                    min={1}
                                    value={values.maxBundleSize / (1024 * 1024)}
                                    onChange={(e) =>
                                        setValue(
                                            'maxBundleSize',
                                            (parseInt(e.target.value) || 50) *
                                                1024 *
                                                1024
                                        )
                                    }
                                    className="mt-1"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    Current: {formatBytes(values.maxBundleSize)}
                                </p>
                            </div>

                            <div>
                                <Label htmlFor="retention-days">
                                    Retention Period (days)
                                </Label>
                                <Input
                                    id="retention-days"
                                    type="number"
                                    min={1}
                                    value={values.retentionDays}
                                    onChange={(e) =>
                                        setValue(
                                            'retentionDays',
                                            parseInt(e.target.value) || 30
                                        )
                                    }
                                    className="mt-1"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    Old bundles will be deleted after this period
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t">
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label htmlFor="cdn-enabled">Enable CDN</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Serve bundles through a CDN for faster downloads
                                    </p>
                                </div>
                                <Switch
                                    id="cdn-enabled"
                                    checked={values.cdnEnabled}
                                    onCheckedChange={(checked) =>
                                        setValue('cdnEnabled', checked)
                                    }
                                />
                            </div>

                            {values.cdnEnabled && (
                                <div>
                                    <Label htmlFor="cdn-url">CDN URL</Label>
                                    <Input
                                        id="cdn-url"
                                        type="url"
                                        value={values.cdnUrl || ''}
                                        onChange={(e) =>
                                            setValue(
                                                'cdnUrl',
                                                e.target.value || null
                                            )
                                        }
                                        placeholder="https://cdn.example.com"
                                        className="mt-1"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </ConfigForm>
        </ConfigSection>
    )
}
