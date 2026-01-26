'use client'

/**
 * IntegrationCard Component
 *
 * Displays integration status with connect/disconnect options.
 */

import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ExternalLink, Check, X } from 'lucide-react'

interface IntegrationCardProps {
    name: string
    description: string
    icon: React.ReactNode
    connected: boolean
    connectedAccount?: string | null
    onConnect: () => void
    onDisconnect: () => void
    isLoading?: boolean
    docsUrl?: string
}

export function IntegrationCard({
    name,
    description,
    icon,
    connected,
    connectedAccount,
    onConnect,
    onDisconnect,
    isLoading,
    docsUrl,
}: IntegrationCardProps) {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                            {icon}
                        </div>
                        <div>
                            <CardTitle className="text-base">{name}</CardTitle>
                            <CardDescription className="mt-1">
                                {description}
                            </CardDescription>
                        </div>
                    </div>
                    <Badge
                        variant={connected ? 'default' : 'secondary'}
                        className="flex items-center gap-1"
                    >
                        {connected ? (
                            <>
                                <Check className="h-3 w-3" />
                                Connected
                            </>
                        ) : (
                            <>
                                <X className="h-3 w-3" />
                                Not Connected
                            </>
                        )}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between">
                    <div>
                        {connected && connectedAccount && (
                            <p className="text-sm text-muted-foreground">
                                Connected as{' '}
                                <span className="font-medium text-foreground">
                                    {connectedAccount}
                                </span>
                            </p>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {docsUrl && (
                            <Button variant="ghost" size="sm" asChild>
                                <a
                                    href={docsUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <ExternalLink className="mr-1 h-4 w-4" />
                                    Docs
                                </a>
                            </Button>
                        )}
                        {connected ? (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onDisconnect}
                                disabled={isLoading}
                            >
                                {isLoading ? 'Disconnecting...' : 'Disconnect'}
                            </Button>
                        ) : (
                            <Button
                                size="sm"
                                onClick={onConnect}
                                disabled={isLoading}
                            >
                                {isLoading ? 'Connecting...' : 'Connect'}
                            </Button>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
