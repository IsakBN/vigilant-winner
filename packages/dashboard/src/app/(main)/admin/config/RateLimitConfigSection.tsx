'use client'

/**
 * RateLimitConfigSection Component
 *
 * Rate limiting configuration section for admin settings.
 */

import { Gauge } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ConfigSection, ConfigForm } from '@/components/admin'
import { useUpdateRateLimitConfig } from '@/hooks/useAdmin'
import type { RateLimitConfig } from '@/lib/api'

interface RateLimitConfigSectionProps {
    config: RateLimitConfig
}

export function RateLimitConfigSection({ config }: RateLimitConfigSectionProps) {
    const updateConfig = useUpdateRateLimitConfig()

    const handleSubmit = async (values: RateLimitConfig) => {
        await updateConfig.mutateAsync(values)
    }

    return (
        <ConfigSection
            title="Rate Limiting"
            description="Configure rate limits to protect your API from abuse."
            icon={<Gauge className="h-5 w-5" />}
            status={config.enabled ? 'enabled' : 'disabled'}
            statusLabel={config.enabled ? 'Enabled' : 'Disabled'}
        >
            <ConfigForm
                initialValues={config}
                onSubmit={handleSubmit}
                isSubmitting={updateConfig.isPending}
            >
                {({ values, setValue }) => (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="rate-limit-enabled">
                                Enable Rate Limiting
                            </Label>
                            <Switch
                                id="rate-limit-enabled"
                                checked={values.enabled}
                                onCheckedChange={(checked) =>
                                    setValue('enabled', checked)
                                }
                            />
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-sm font-medium">Global Limits</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="global-rate">
                                        Requests per Window
                                    </Label>
                                    <Input
                                        id="global-rate"
                                        type="number"
                                        min={1}
                                        value={values.globalRateLimit}
                                        onChange={(e) =>
                                            setValue(
                                                'globalRateLimit',
                                                parseInt(e.target.value) || 1
                                            )
                                        }
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="global-window">
                                        Window (seconds)
                                    </Label>
                                    <Input
                                        id="global-window"
                                        type="number"
                                        min={1}
                                        value={values.globalRateWindow}
                                        onChange={(e) =>
                                            setValue(
                                                'globalRateWindow',
                                                parseInt(e.target.value) || 1
                                            )
                                        }
                                        className="mt-1"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-sm font-medium">
                                Authentication Limits
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="auth-rate">
                                        Requests per Window
                                    </Label>
                                    <Input
                                        id="auth-rate"
                                        type="number"
                                        min={1}
                                        value={values.authRateLimit}
                                        onChange={(e) =>
                                            setValue(
                                                'authRateLimit',
                                                parseInt(e.target.value) || 1
                                            )
                                        }
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="auth-window">
                                        Window (seconds)
                                    </Label>
                                    <Input
                                        id="auth-window"
                                        type="number"
                                        min={1}
                                        value={values.authRateWindow}
                                        onChange={(e) =>
                                            setValue(
                                                'authRateWindow',
                                                parseInt(e.target.value) || 1
                                            )
                                        }
                                        className="mt-1"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-sm font-medium">Upload Limits</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="upload-rate">
                                        Requests per Window
                                    </Label>
                                    <Input
                                        id="upload-rate"
                                        type="number"
                                        min={1}
                                        value={values.uploadRateLimit}
                                        onChange={(e) =>
                                            setValue(
                                                'uploadRateLimit',
                                                parseInt(e.target.value) || 1
                                            )
                                        }
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="upload-window">
                                        Window (seconds)
                                    </Label>
                                    <Input
                                        id="upload-window"
                                        type="number"
                                        min={1}
                                        value={values.uploadRateWindow}
                                        onChange={(e) =>
                                            setValue(
                                                'uploadRateWindow',
                                                parseInt(e.target.value) || 1
                                            )
                                        }
                                        className="mt-1"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </ConfigForm>
        </ConfigSection>
    )
}
