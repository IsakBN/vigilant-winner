'use client'

/**
 * EmailConfigSection Component
 *
 * Email configuration section for admin settings.
 */

import { Mail, Send } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { ConfigSection, ConfigForm } from '@/components/admin'
import { useUpdateEmailConfig, useTestEmailConfig } from '@/hooks/useAdmin'
import type { EmailConfig } from '@/lib/api'

interface EmailConfigSectionProps {
    config: EmailConfig
}

const EMAIL_PROVIDERS = [
    { value: 'sendgrid', label: 'SendGrid' },
    { value: 'ses', label: 'Amazon SES' },
    { value: 'resend', label: 'Resend' },
    { value: 'smtp', label: 'SMTP' },
]

export function EmailConfigSection({ config }: EmailConfigSectionProps) {
    const updateConfig = useUpdateEmailConfig()
    const testEmail = useTestEmailConfig()

    const handleSubmit = async (values: EmailConfig) => {
        await updateConfig.mutateAsync(values)
    }

    const handleTestEmail = () => {
        void testEmail.mutateAsync()
    }

    return (
        <ConfigSection
            title="Email Settings"
            description="Configure email delivery settings for notifications and alerts."
            icon={<Mail className="h-5 w-5" />}
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
                            <Label htmlFor="email-enabled">Enable Email</Label>
                            <Switch
                                id="email-enabled"
                                checked={values.enabled}
                                onCheckedChange={(checked) =>
                                    setValue('enabled', checked)
                                }
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="email-provider">Provider</Label>
                                <Select
                                    value={values.provider}
                                    onValueChange={(value) =>
                                        setValue(
                                            'provider',
                                            value as EmailConfig['provider']
                                        )
                                    }
                                >
                                    <SelectTrigger id="email-provider" className="mt-1">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {EMAIL_PROVIDERS.map((provider) => (
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
                                <Label htmlFor="from-email">From Email</Label>
                                <Input
                                    id="from-email"
                                    type="email"
                                    value={values.fromEmail}
                                    onChange={(e) =>
                                        setValue('fromEmail', e.target.value)
                                    }
                                    placeholder="noreply@example.com"
                                    className="mt-1"
                                />
                            </div>

                            <div>
                                <Label htmlFor="from-name">From Name</Label>
                                <Input
                                    id="from-name"
                                    value={values.fromName}
                                    onChange={(e) =>
                                        setValue('fromName', e.target.value)
                                    }
                                    placeholder="BundleNudge"
                                    className="mt-1"
                                />
                            </div>

                            <div>
                                <Label htmlFor="reply-to">Reply-To Email</Label>
                                <Input
                                    id="reply-to"
                                    type="email"
                                    value={values.replyToEmail || ''}
                                    onChange={(e) =>
                                        setValue(
                                            'replyToEmail',
                                            e.target.value || null
                                        )
                                    }
                                    placeholder="support@example.com"
                                    className="mt-1"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleTestEmail}
                                disabled={testEmail.isPending || !values.enabled}
                            >
                                <Send className="mr-2 h-4 w-4" />
                                {testEmail.isPending
                                    ? 'Sending...'
                                    : 'Send Test Email'}
                            </Button>
                            {testEmail.isSuccess && (
                                <span className="text-sm text-green-600">
                                    Test email sent successfully!
                                </span>
                            )}
                            {testEmail.isError && (
                                <span className="text-sm text-destructive">
                                    Failed to send test email.
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </ConfigForm>
        </ConfigSection>
    )
}
