'use client'

/**
 * Admin Settings Page
 *
 * System settings management with:
 * - General settings form
 * - Save changes functionality
 *
 * Note: Settings API to be connected when available.
 */

import { useState, useCallback } from 'react'
import { Settings, Save, RefreshCw } from 'lucide-react'
import {
    Button,
    Input,
    Card,
} from '@bundlenudge/shared-ui'
import { SettingField, ToggleSetting } from '@/components/admin/settings/SettingComponents'

interface SystemSettings {
    siteName: string
    supportEmail: string
    maxAppsPerUser: number
    maxBundleSizeMb: number
    maintenanceMode: boolean
    allowNewRegistrations: boolean
    requireEmailVerification: boolean
    defaultTrialDays: number
}

const DEFAULT_SETTINGS: SystemSettings = {
    siteName: 'BundleNudge',
    supportEmail: 'support@bundlenudge.com',
    maxAppsPerUser: 10,
    maxBundleSizeMb: 100,
    maintenanceMode: false,
    allowNewRegistrations: true,
    requireEmailVerification: true,
    defaultTrialDays: 14,
}

export default function SettingsPage() {
    const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS)
    const [isSaving, setIsSaving] = useState(false)
    const [saveSuccess, setSaveSuccess] = useState(false)
    const [saveError, setSaveError] = useState<string | null>(null)

    const handleInputChange = useCallback((field: keyof SystemSettings, value: string | number | boolean) => {
        setSettings((prev) => ({ ...prev, [field]: value }))
        setSaveSuccess(false)
        setSaveError(null)
    }, [])

    const handleSave = useCallback(async () => {
        setIsSaving(true)
        setSaveError(null)
        setSaveSuccess(false)

        try {
            // TODO: Connect to API when available
            await new Promise((resolve) => setTimeout(resolve, 1000))
            setSaveSuccess(true)
        } catch (err) {
            setSaveError(err instanceof Error ? err.message : 'Failed to save settings')
        } finally {
            setIsSaving(false)
        }
    }, [])

    const handleReset = useCallback(() => {
        setSettings(DEFAULT_SETTINGS)
        setSaveSuccess(false)
        setSaveError(null)
    }, [])

    return (
        <div className="p-6 space-y-6 max-w-4xl">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-pastel-orange/10 rounded-lg">
                        <Settings className="w-5 h-5 text-pastel-orange" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-text-dark">Settings</h1>
                        <p className="text-sm text-text-light">
                            Manage system configuration
                        </p>
                    </div>
                </div>
            </div>

            {/* Success/Error Messages */}
            {saveSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                    Settings saved successfully
                </div>
            )}

            {saveError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {saveError}
                </div>
            )}

            {/* General Settings */}
            <Card className="p-6">
                <h2 className="text-lg font-semibold text-text-dark mb-4">General Settings</h2>
                <div className="space-y-4">
                    <SettingField label="Site Name" description="The name displayed in the UI">
                        <Input
                            value={settings.siteName}
                            onChange={(e) => handleInputChange('siteName', e.target.value)}
                            className="max-w-md"
                        />
                    </SettingField>

                    <SettingField label="Support Email" description="Contact email for support requests">
                        <Input
                            type="email"
                            value={settings.supportEmail}
                            onChange={(e) => handleInputChange('supportEmail', e.target.value)}
                            className="max-w-md"
                        />
                    </SettingField>
                </div>
            </Card>

            {/* Limits Settings */}
            <Card className="p-6">
                <h2 className="text-lg font-semibold text-text-dark mb-4">Limits</h2>
                <div className="space-y-4">
                    <SettingField label="Max Apps Per User" description="Maximum number of apps a single user can create">
                        <Input
                            type="number"
                            min="1"
                            max="100"
                            value={String(settings.maxAppsPerUser)}
                            onChange={(e) => handleInputChange('maxAppsPerUser', parseInt(e.target.value, 10))}
                            className="max-w-32"
                        />
                    </SettingField>

                    <SettingField label="Max Bundle Size (MB)" description="Maximum size for uploaded bundles">
                        <Input
                            type="number"
                            min="1"
                            max="500"
                            value={String(settings.maxBundleSizeMb)}
                            onChange={(e) => handleInputChange('maxBundleSizeMb', parseInt(e.target.value, 10))}
                            className="max-w-32"
                        />
                    </SettingField>

                    <SettingField label="Default Trial Days" description="Number of days for trial subscriptions">
                        <Input
                            type="number"
                            min="0"
                            max="90"
                            value={String(settings.defaultTrialDays)}
                            onChange={(e) => handleInputChange('defaultTrialDays', parseInt(e.target.value, 10))}
                            className="max-w-32"
                        />
                    </SettingField>
                </div>
            </Card>

            {/* Feature Toggles */}
            <Card className="p-6">
                <h2 className="text-lg font-semibold text-text-dark mb-4">Feature Toggles</h2>
                <div className="space-y-4">
                    <ToggleSetting
                        label="Maintenance Mode"
                        description="When enabled, the system shows a maintenance message to users"
                        checked={settings.maintenanceMode}
                        onCheckedChange={(checked) => handleInputChange('maintenanceMode', checked)}
                        variant="warning"
                    />

                    <ToggleSetting
                        label="Allow New Registrations"
                        description="Allow new users to sign up"
                        checked={settings.allowNewRegistrations}
                        onCheckedChange={(checked) => handleInputChange('allowNewRegistrations', checked)}
                    />

                    <ToggleSetting
                        label="Require Email Verification"
                        description="Users must verify their email before accessing the dashboard"
                        checked={settings.requireEmailVerification}
                        onCheckedChange={(checked) => handleInputChange('requireEmailVerification', checked)}
                    />
                </div>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-3">
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? (
                        <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="w-4 h-4 mr-2" />
                            Save Changes
                        </>
                    )}
                </Button>
                <Button variant="outline" onClick={handleReset} disabled={isSaving}>
                    Reset to Defaults
                </Button>
            </div>
        </div>
    )
}

