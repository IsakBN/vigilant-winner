'use client'

import Link from 'next/link'
import { AlertTriangle, XCircle, CheckCircle2, Info, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface AlertBannerProps {
  type: 'warning' | 'critical' | 'success' | 'info'
  title: string
  message: string
  action?: { label: string; href: string }
  onDismiss?: () => void
  className?: string
}

const ALERT_CONFIG = {
  warning: {
    icon: AlertTriangle,
    containerClass: 'bg-amber-100 text-amber-800',
    iconClass: 'text-amber-800',
    actionClass: 'text-amber-800 hover:bg-amber-200 border-amber-800/30',
    dismissClass: 'text-amber-800 hover:bg-amber-200',
  },
  critical: {
    icon: XCircle,
    containerClass: 'bg-red-100 text-red-800',
    iconClass: 'text-red-800',
    actionClass: 'text-red-800 hover:bg-red-200 border-red-800/30',
    dismissClass: 'text-red-800 hover:bg-red-200',
  },
  success: {
    icon: CheckCircle2,
    containerClass: 'bg-emerald-100 text-emerald-800',
    iconClass: 'text-emerald-800',
    actionClass: 'text-emerald-800 hover:bg-emerald-200 border-emerald-800/30',
    dismissClass: 'text-emerald-800 hover:bg-emerald-200',
  },
  info: {
    icon: Info,
    containerClass: 'bg-blue-100 text-blue-800',
    iconClass: 'text-blue-800',
    actionClass: 'text-blue-800 hover:bg-blue-200 border-blue-800/30',
    dismissClass: 'text-blue-800 hover:bg-blue-200',
  },
} as const

export function AlertBanner({
  type,
  title,
  message,
  action,
  onDismiss,
  className,
}: AlertBannerProps) {
  const config = ALERT_CONFIG[type]
  const Icon = config.icon

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3',
        config.containerClass,
        className
      )}
      role="alert"
    >
      <Icon className={cn('h-5 w-5 flex-shrink-0', config.iconClass)} />

      <div className="flex-1 min-w-0">
        <span className="font-medium">{title}</span>
        <span className="mx-1.5">-</span>
        <span>{message}</span>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {action && (
          <Button
            variant="outline"
            size="sm"
            asChild
            className={cn(
              'bg-transparent border',
              config.actionClass
            )}
          >
            <Link href={action.href}>{action.label}</Link>
          </Button>
        )}

        {onDismiss && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onDismiss}
            className={cn('h-8 w-8', config.dismissClass)}
            aria-label="Dismiss alert"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}

export { AlertBanner as default }
