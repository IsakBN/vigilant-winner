'use client'

/**
 * RoleSelector Component
 *
 * Dropdown for selecting member roles.
 */

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui'

type SelectableRole = 'admin' | 'member'

interface RoleSelectorProps {
    value: SelectableRole
    onChange: (value: SelectableRole) => void
    disabled?: boolean
    className?: string
}

const ROLE_OPTIONS: { value: SelectableRole; label: string; description: string }[] = [
    {
        value: 'admin',
        label: 'Admin',
        description: 'Can manage team members and settings',
    },
    {
        value: 'member',
        label: 'Member',
        description: 'Can access team resources',
    },
]

export function RoleSelector({
    value,
    onChange,
    disabled,
    className,
}: RoleSelectorProps) {
    return (
        <Select
            value={value}
            onValueChange={(val) => onChange(val as SelectableRole)}
            disabled={disabled}
        >
            <SelectTrigger className={className ?? 'w-[120px]'}>
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                {ROLE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                        <div className="flex flex-col">
                            <span>{option.label}</span>
                        </div>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}

/**
 * Role selector with descriptions (for forms)
 */
interface RoleSelectorWithDescriptionProps extends RoleSelectorProps {
    showDescription?: boolean
}

export function RoleSelectorWithDescription({
    value,
    onChange,
    disabled,
    className,
    showDescription = true,
}: RoleSelectorWithDescriptionProps) {
    const selectedOption = ROLE_OPTIONS.find((o) => o.value === value)

    return (
        <div className="space-y-1">
            <Select
                value={value}
                onValueChange={(val) => onChange(val as SelectableRole)}
                disabled={disabled}
            >
                <SelectTrigger className={className ?? 'w-full'}>
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {ROLE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            <div className="flex flex-col items-start">
                                <span className="font-medium">{option.label}</span>
                                <span className="text-xs text-text-light">
                                    {option.description}
                                </span>
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            {showDescription && selectedOption && (
                <p className="text-xs text-text-light">
                    {selectedOption.description}
                </p>
            )}
        </div>
    )
}
