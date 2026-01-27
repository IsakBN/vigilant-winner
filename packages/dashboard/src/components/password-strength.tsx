'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'

interface PasswordStrengthProps {
  password: string
  className?: string
}

interface PasswordRequirement {
  label: string
  met: boolean
}

type StrengthLevel = 'weak' | 'fair' | 'good' | 'strong'

interface StrengthInfo {
  level: StrengthLevel
  label: string
  color: string
  barColor: string
  width: string
}

function getStrengthInfo(score: number): StrengthInfo {
  if (score <= 1) {
    return {
      level: 'weak',
      label: 'Weak',
      color: 'text-red-600',
      barColor: 'bg-red-500',
      width: 'w-1/4',
    }
  }
  if (score === 2) {
    return {
      level: 'fair',
      label: 'Fair',
      color: 'text-orange-600',
      barColor: 'bg-orange-500',
      width: 'w-2/4',
    }
  }
  if (score === 3) {
    return {
      level: 'good',
      label: 'Good',
      color: 'text-yellow-600',
      barColor: 'bg-yellow-500',
      width: 'w-3/4',
    }
  }
  return {
    level: 'strong',
    label: 'Strong',
    color: 'text-green-600',
    barColor: 'bg-green-500',
    width: 'w-full',
  }
}

export function PasswordStrength({ password, className }: PasswordStrengthProps) {
  const requirements: PasswordRequirement[] = useMemo(() => [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'Contains uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'Contains lowercase letter', met: /[a-z]/.test(password) },
    { label: 'Contains a number', met: /\d/.test(password) },
  ], [password])

  const score = useMemo(() => {
    return requirements.filter(r => r.met).length
  }, [requirements])

  const strengthInfo = useMemo(() => getStrengthInfo(score), [score])

  if (!password) {
    return null
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div className="space-y-1">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Password strength</span>
          <span className={cn('font-medium', strengthInfo.color)}>
            {strengthInfo.label}
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-300',
              strengthInfo.barColor,
              strengthInfo.width
            )}
          />
        </div>
      </div>

      <ul className="space-y-1">
        {requirements.map((req) => (
          <li
            key={req.label}
            className={cn(
              'flex items-center gap-2 text-sm transition-colors',
              req.met ? 'text-green-600' : 'text-gray-500'
            )}
          >
            {req.met ? (
              <CheckCircleIcon className="w-4 h-4 flex-shrink-0" />
            ) : (
              <CircleIcon className="w-4 h-4 flex-shrink-0" />
            )}
            {req.label}
          </li>
        ))}
      </ul>
    </div>
  )
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function CircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" strokeWidth={2} />
    </svg>
  )
}
