'use client'

/**
 * ConfigSection Component
 *
 * Reusable section wrapper for configuration forms with collapsible content.
 */

import { useState, type ReactNode } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface ConfigSectionProps {
    title: string
    description: string
    icon?: ReactNode
    children: ReactNode
    defaultOpen?: boolean
    status?: 'enabled' | 'disabled' | 'warning'
    statusLabel?: string
}

/**
 * Get badge variant based on status
 */
function getStatusVariant(
    status: ConfigSectionProps['status']
): 'default' | 'secondary' | 'destructive' {
    switch (status) {
        case 'enabled':
            return 'default'
        case 'warning':
            return 'destructive'
        default:
            return 'secondary'
    }
}

export function ConfigSection({
    title,
    description,
    icon,
    children,
    defaultOpen = true,
    status,
    statusLabel,
}: ConfigSectionProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen)

    return (
        <Card>
            <CardHeader
                className="cursor-pointer select-none"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {icon && (
                            <div className="text-muted-foreground">{icon}</div>
                        )}
                        <div>
                            <CardTitle className="text-lg">{title}</CardTitle>
                            <CardDescription>{description}</CardDescription>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {status && statusLabel && (
                            <Badge variant={getStatusVariant(status)}>
                                {statusLabel}
                            </Badge>
                        )}
                        <Button variant="ghost" size="sm">
                            {isOpen ? (
                                <ChevronDown className="h-4 w-4" />
                            ) : (
                                <ChevronRight className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                </div>
            </CardHeader>
            {isOpen && <CardContent>{children}</CardContent>}
        </Card>
    )
}
