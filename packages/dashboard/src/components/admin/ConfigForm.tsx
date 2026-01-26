'use client'

/**
 * ConfigForm Component
 *
 * Generic configuration form with save functionality and validation.
 */

import { useState, useEffect, type ReactNode, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, Save, RotateCcw } from 'lucide-react'

interface ConfigFormProps<T> {
    initialValues: T
    onSubmit: (values: T) => Promise<void>
    children: (props: {
        values: T
        setValue: <K extends keyof T>(key: K, value: T[K]) => void
        hasChanges: boolean
    }) => ReactNode
    isSubmitting?: boolean
    submitLabel?: string
}

export function ConfigForm<T extends object>({
    initialValues,
    onSubmit,
    children,
    isSubmitting = false,
    submitLabel = 'Save Changes',
}: ConfigFormProps<T>) {
    const [values, setValues] = useState<T>(initialValues)
    const [hasChanges, setHasChanges] = useState(false)

    useEffect(() => {
        setValues(initialValues)
        setHasChanges(false)
    }, [initialValues])

    const setValue = <K extends keyof T>(key: K, value: T[K]) => {
        setValues((prev) => ({ ...prev, [key]: value }))
        setHasChanges(true)
    }

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        await onSubmit(values)
        setHasChanges(false)
    }

    const handleReset = () => {
        setValues(initialValues)
        setHasChanges(false)
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {children({ values, setValue, hasChanges })}

            <div className="flex items-center gap-3 pt-4 border-t">
                <Button type="submit" disabled={!hasChanges || isSubmitting}>
                    {isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="mr-2 h-4 w-4" />
                            {submitLabel}
                        </>
                    )}
                </Button>
                {hasChanges && (
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleReset}
                        disabled={isSubmitting}
                    >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Reset
                    </Button>
                )}
            </div>
        </form>
    )
}
