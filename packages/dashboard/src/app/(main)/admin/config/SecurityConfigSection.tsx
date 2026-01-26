'use client'

/**
 * SecurityConfigSection Component
 *
 * Security configuration section for admin settings.
 */

import { useState } from 'react'
import { Shield, Plus, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ConfigSection, ConfigForm } from '@/components/admin'
import { useUpdateSecurityConfig } from '@/hooks/useAdmin'
import type { SecurityConfig } from '@/lib/api'

interface SecurityConfigSectionProps {
    config: SecurityConfig
}

export function SecurityConfigSection({ config }: SecurityConfigSectionProps) {
    const updateConfig = useUpdateSecurityConfig()

    const handleSubmit = async (values: SecurityConfig) => {
        await updateConfig.mutateAsync(values)
    }

    return (
        <ConfigSection
            title="Security Settings"
            description="Configure authentication and access control settings."
            icon={<Shield className="h-5 w-5" />}
            status={config.requireMfa ? 'enabled' : 'warning'}
            statusLabel={config.requireMfa ? 'MFA Required' : 'MFA Optional'}
        >
            <ConfigForm
                initialValues={config}
                onSubmit={handleSubmit}
                isSubmitting={updateConfig.isPending}
            >
                {({ values, setValue }) => (
                    <SecurityFormFields values={values} setValue={setValue} />
                )}
            </ConfigForm>
        </ConfigSection>
    )
}

interface SecurityFormFieldsProps {
    values: SecurityConfig
    setValue: <K extends keyof SecurityConfig>(
        key: K,
        value: SecurityConfig[K]
    ) => void
}

function SecurityFormFields({ values, setValue }: SecurityFormFieldsProps) {
    const [newIpRange, setNewIpRange] = useState('')
    const [newCorsOrigin, setNewCorsOrigin] = useState('')

    const addIpRange = () => {
        if (newIpRange && !values.allowedIpRanges.includes(newIpRange)) {
            setValue('allowedIpRanges', [...values.allowedIpRanges, newIpRange])
            setNewIpRange('')
        }
    }

    const removeIpRange = (ip: string) => {
        setValue(
            'allowedIpRanges',
            values.allowedIpRanges.filter((i) => i !== ip)
        )
    }

    const addCorsOrigin = () => {
        if (newCorsOrigin && !values.corsOrigins.includes(newCorsOrigin)) {
            setValue('corsOrigins', [...values.corsOrigins, newCorsOrigin])
            setNewCorsOrigin('')
        }
    }

    const removeCorsOrigin = (origin: string) => {
        setValue(
            'corsOrigins',
            values.corsOrigins.filter((o) => o !== origin)
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <Label htmlFor="require-mfa">Require MFA for Admin Access</Label>
                <Switch
                    id="require-mfa"
                    checked={values.requireMfa}
                    onCheckedChange={(checked) => setValue('requireMfa', checked)}
                />
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div>
                    <Label htmlFor="max-login">Max Login Attempts</Label>
                    <Input
                        id="max-login"
                        type="number"
                        min={1}
                        value={values.maxLoginAttempts}
                        onChange={(e) =>
                            setValue('maxLoginAttempts', parseInt(e.target.value) || 5)
                        }
                        className="mt-1"
                    />
                </div>
                <div>
                    <Label htmlFor="lockout">Lockout Duration (min)</Label>
                    <Input
                        id="lockout"
                        type="number"
                        min={1}
                        value={values.lockoutDuration}
                        onChange={(e) =>
                            setValue('lockoutDuration', parseInt(e.target.value) || 15)
                        }
                        className="mt-1"
                    />
                </div>
                <div>
                    <Label htmlFor="session">Session Timeout (min)</Label>
                    <Input
                        id="session"
                        type="number"
                        min={1}
                        value={values.sessionTimeout}
                        onChange={(e) =>
                            setValue('sessionTimeout', parseInt(e.target.value) || 60)
                        }
                        className="mt-1"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label>Allowed IP Ranges</Label>
                <div className="flex gap-2">
                    <Input
                        placeholder="192.168.1.0/24"
                        value={newIpRange}
                        onChange={(e) => setNewIpRange(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addIpRange()}
                    />
                    <Button type="button" variant="outline" onClick={addIpRange}>
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                    {values.allowedIpRanges.map((ip) => (
                        <Badge key={ip} variant="secondary">
                            {ip}
                            <button
                                type="button"
                                onClick={() => removeIpRange(ip)}
                                className="ml-1 hover:text-destructive"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    ))}
                    {values.allowedIpRanges.length === 0 && (
                        <span className="text-sm text-muted-foreground">
                            All IP addresses allowed
                        </span>
                    )}
                </div>
            </div>

            <div className="space-y-2">
                <Label>CORS Origins</Label>
                <div className="flex gap-2">
                    <Input
                        placeholder="https://example.com"
                        value={newCorsOrigin}
                        onChange={(e) => setNewCorsOrigin(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addCorsOrigin()}
                    />
                    <Button type="button" variant="outline" onClick={addCorsOrigin}>
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                    {values.corsOrigins.map((origin) => (
                        <Badge key={origin} variant="secondary">
                            {origin}
                            <button
                                type="button"
                                onClick={() => removeCorsOrigin(origin)}
                                className="ml-1 hover:text-destructive"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    ))}
                </div>
            </div>
        </div>
    )
}
