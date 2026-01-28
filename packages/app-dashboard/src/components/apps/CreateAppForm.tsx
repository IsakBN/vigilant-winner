'use client'

import { useState } from 'react'
import { Smartphone, Tablet } from 'lucide-react'
import { cn, Button, Input, Label } from '@bundlenudge/shared-ui'
import type { Platform, CreateAppInput } from '@/lib/api'

// =============================================================================
// Types
// =============================================================================

interface CreateAppFormProps {
    onSubmit: (data: CreateAppInput) => void
    isLoading?: boolean
    error?: string | null
}

interface FormErrors {
    name?: string
    bundleId?: string
}

// =============================================================================
// Constants
// =============================================================================

const BUNDLE_ID_PATTERN = /^[a-zA-Z][a-zA-Z0-9]*(\.[a-zA-Z][a-zA-Z0-9]*)+$/

// =============================================================================
// Platform Selector Component
// =============================================================================

interface PlatformSelectorProps {
    value: Platform
    onChange: (platform: Platform) => void
}

function PlatformSelector({ value, onChange }: PlatformSelectorProps) {
    const platforms: { id: Platform; label: string; icon: typeof Smartphone }[] = [
        { id: 'ios', label: 'iOS', icon: Smartphone },
        { id: 'android', label: 'Android', icon: Tablet },
    ]

    return (
        <div className="grid grid-cols-2 gap-3">
            {platforms.map(({ id, label, icon: Icon }) => (
                <button
                    key={id}
                    type="button"
                    onClick={() => onChange(id)}
                    className={cn(
                        'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all',
                        value === id
                            ? 'border-bright-accent bg-bright-accent/5'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                    )}
                >
                    <Icon
                        className={cn(
                            'w-8 h-8',
                            value === id ? 'text-bright-accent' : 'text-gray-400'
                        )}
                    />
                    <span
                        className={cn(
                            'font-medium',
                            value === id ? 'text-bright-accent' : 'text-gray-600'
                        )}
                    >
                        {label}
                    </span>
                </button>
            ))}
        </div>
    )
}

// =============================================================================
// Form Validation
// =============================================================================

function validateForm(name: string, bundleId: string): FormErrors {
    const errors: FormErrors = {}

    if (!name.trim()) {
        errors.name = 'App name is required'
    } else if (name.length > 100) {
        errors.name = 'App name must be 100 characters or less'
    }

    if (bundleId && !BUNDLE_ID_PATTERN.test(bundleId)) {
        errors.bundleId = 'Invalid format. Use: com.company.app'
    }

    return errors
}

// =============================================================================
// Main Component
// =============================================================================

export function CreateAppForm({ onSubmit, isLoading = false, error }: CreateAppFormProps) {
    const [platform, setPlatform] = useState<Platform>('ios')
    const [name, setName] = useState('')
    const [bundleId, setBundleId] = useState('')
    const [errors, setErrors] = useState<FormErrors>({})
    const [touched, setTouched] = useState<Record<string, boolean>>({})

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        const formErrors = validateForm(name, bundleId)
        setErrors(formErrors)

        if (Object.keys(formErrors).length > 0) {
            setTouched({ name: true, bundleId: true })
            return
        }

        onSubmit({
            name: name.trim(),
            platform,
            bundleId: bundleId.trim() || undefined,
        })
    }

    function handleBlur(field: keyof FormErrors) {
        setTouched((prev) => ({ ...prev, [field]: true }))
        const formErrors = validateForm(name, bundleId)
        setErrors((prev) => ({ ...prev, [field]: formErrors[field] }))
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && <ErrorAlert message={error} />}

            <div className="space-y-2">
                <Label htmlFor="platform">Platform</Label>
                <PlatformSelector value={platform} onChange={setPlatform} />
            </div>

            <div className="space-y-2">
                <Label htmlFor="name">App Name</Label>
                <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onBlur={() => handleBlur('name')}
                    placeholder="My Awesome App"
                    disabled={isLoading}
                    className={cn(touched.name && errors.name && 'border-red-500')}
                />
                {touched.name && errors.name && (
                    <p className="text-sm text-red-500">{errors.name}</p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="bundleId">
                    Bundle ID <span className="text-gray-400 font-normal">(optional)</span>
                </Label>
                <Input
                    id="bundleId"
                    type="text"
                    value={bundleId}
                    onChange={(e) => setBundleId(e.target.value)}
                    onBlur={() => handleBlur('bundleId')}
                    placeholder="com.company.myapp"
                    disabled={isLoading}
                    className={cn(touched.bundleId && errors.bundleId && 'border-red-500')}
                />
                <p className="text-sm text-gray-500">
                    {platform === 'ios'
                        ? 'Your iOS Bundle Identifier (e.g., com.company.myapp)'
                        : 'Your Android Application ID (e.g., com.company.myapp)'}
                </p>
                {touched.bundleId && errors.bundleId && (
                    <p className="text-sm text-red-500">{errors.bundleId}</p>
                )}
            </div>

            <Button
                type="submit"
                disabled={isLoading}
                size="lg"
                className="w-full bg-bright-accent text-white hover:opacity-90"
            >
                {isLoading ? 'Creating App...' : 'Create App'}
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
