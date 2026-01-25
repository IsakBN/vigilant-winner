'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface RadioGroupContextValue {
    value: string
    onChange: (value: string) => void
}

const RadioGroupContext = React.createContext<RadioGroupContextValue | null>(null)

interface RadioGroupProps {
    value?: string
    defaultValue?: string
    onValueChange?: (value: string) => void
    children: React.ReactNode
    className?: string
}

export function RadioGroup({
    value: controlledValue,
    defaultValue,
    onValueChange,
    children,
    className,
}: RadioGroupProps) {
    const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue || '')
    const value = controlledValue !== undefined ? controlledValue : uncontrolledValue

    const onChange = React.useCallback(
        (newValue: string) => {
            if (controlledValue === undefined) {
                setUncontrolledValue(newValue)
            }
            onValueChange?.(newValue)
        },
        [controlledValue, onValueChange]
    )

    return (
        <RadioGroupContext.Provider value={{ value, onChange }}>
            <div role="radiogroup" className={cn('space-y-2', className)}>
                {children}
            </div>
        </RadioGroupContext.Provider>
    )
}

interface RadioGroupItemProps {
    value: string
    id?: string
    disabled?: boolean
    className?: string
    children?: React.ReactNode
}

export function RadioGroupItem({
    value,
    id,
    disabled = false,
    className,
}: RadioGroupItemProps) {
    const context = React.useContext(RadioGroupContext)
    if (!context) {
        throw new Error('RadioGroupItem must be used within a RadioGroup')
    }

    const { value: selectedValue, onChange } = context
    const isSelected = selectedValue === value

    return (
        <button
            type="button"
            role="radio"
            aria-checked={isSelected}
            id={id}
            disabled={disabled}
            onClick={() => !disabled && onChange(value)}
            className={cn(
                'h-4 w-4 rounded-full border transition-colors',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2',
                isSelected
                    ? 'border-neutral-900 bg-neutral-900'
                    : 'border-neutral-300 bg-white hover:border-neutral-400',
                disabled && 'cursor-not-allowed opacity-50',
                className
            )}
        >
            {isSelected && (
                <span className="flex items-center justify-center">
                    <span className="h-1.5 w-1.5 rounded-full bg-white" />
                </span>
            )}
        </button>
    )
}
