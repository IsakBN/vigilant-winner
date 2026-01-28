'use client'

/**
 * Settings Sub-components
 *
 * Reusable form components for the settings page.
 */

import { Label, Switch } from '@bundlenudge/shared-ui'

export interface SettingFieldProps {
    label: string
    description: string
    children: React.ReactNode
}

export function SettingField({ label, description, children }: SettingFieldProps) {
    return (
        <div className="space-y-2">
            <Label className="text-sm font-medium text-text-dark">{label}</Label>
            <p className="text-xs text-text-light">{description}</p>
            {children}
        </div>
    )
}

export interface ToggleSettingProps {
    label: string
    description: string
    checked: boolean
    onCheckedChange: (checked: boolean) => void
    variant?: 'default' | 'warning'
}

export function ToggleSetting({
    label,
    description,
    checked,
    onCheckedChange,
    variant = 'default',
}: ToggleSettingProps) {
    return (
        <div className={`flex items-center justify-between p-4 rounded-lg border ${
            variant === 'warning' && checked
                ? 'bg-yellow-50 border-yellow-200'
                : 'bg-muted/30 border-border'
        }`}>
            <div>
                <Label className={`text-sm font-medium ${
                    variant === 'warning' && checked ? 'text-yellow-800' : 'text-text-dark'
                }`}>
                    {label}
                </Label>
                <p className={`text-xs ${
                    variant === 'warning' && checked ? 'text-yellow-700' : 'text-text-light'
                }`}>
                    {description}
                </p>
            </div>
            <Switch checked={checked} onCheckedChange={onCheckedChange} />
        </div>
    )
}
