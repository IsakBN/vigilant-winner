'use client'

/**
 * ApiKeySection Component
 *
 * Displays API key with reveal/copy functionality and regeneration option.
 */

import { useState } from 'react'
import { Eye, EyeOff, Copy, RefreshCw, Check } from 'lucide-react'
import {
    Button,
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    cn,
} from '@bundlenudge/shared-ui'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface ApiKeySectionProps {
    apiKey: string | null
    isRegenerating: boolean
    onRegenerate: () => Promise<void>
}

function maskApiKey(key: string): string {
    if (key.length <= 8) return key
    const prefix = key.slice(0, 4)
    const suffix = key.slice(-4)
    return `${prefix}${'*'.repeat(24)}${suffix}`
}

export function ApiKeySection({
    apiKey,
    isRegenerating,
    onRegenerate,
}: ApiKeySectionProps) {
    const [isRevealed, setIsRevealed] = useState(false)
    const [copied, setCopied] = useState(false)

    const handleCopy = async () => {
        if (!apiKey) return
        try {
            await navigator.clipboard.writeText(apiKey)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch {
            // Silently fail - browser may not support clipboard API
        }
    }

    const handleRegenerate = async () => {
        await onRegenerate()
        setIsRevealed(true)
    }

    const displayKey = apiKey ? (isRevealed ? apiKey : maskApiKey(apiKey)) : null

    if (!displayKey) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>API Key</CardTitle>
                    <CardDescription>
                        Generate an API key to authenticate SDK requests from your app.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 dark:bg-amber-950/20 dark:border-amber-800">
                            <p className="text-sm text-amber-800 dark:text-amber-200">
                                No API key has been generated yet. Click below to create one.
                            </p>
                        </div>
                        <Button onClick={handleRegenerate} disabled={isRegenerating}>
                            <RefreshCw
                                className={cn(
                                    'w-4 h-4 mr-2',
                                    isRegenerating && 'animate-spin'
                                )}
                            />
                            {isRegenerating ? 'Generating...' : 'Generate API Key'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>API Key</CardTitle>
                <CardDescription>
                    Use this key to authenticate SDK requests from your app.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <div
                            className={cn(
                                'flex-1 px-4 py-2.5 rounded-lg font-mono text-sm',
                                'bg-muted border',
                                'select-all overflow-x-auto whitespace-nowrap'
                            )}
                        >
                            {displayKey}
                        </div>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setIsRevealed(!isRevealed)}
                            aria-label={isRevealed ? 'Hide API key' : 'Show API key'}
                        >
                            {isRevealed ? (
                                <EyeOff className="w-4 h-4" />
                            ) : (
                                <Eye className="w-4 h-4" />
                            )}
                        </Button>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCopy}
                            disabled={!apiKey}
                        >
                            {copied ? (
                                <>
                                    <Check className="w-4 h-4 mr-2 text-green-600" />
                                    Copied
                                </>
                            ) : (
                                <>
                                    <Copy className="w-4 h-4 mr-2" />
                                    Copy
                                </>
                            )}
                        </Button>

                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={isRegenerating}
                                >
                                    <RefreshCw
                                        className={cn(
                                            'w-4 h-4 mr-2',
                                            isRegenerating && 'animate-spin'
                                        )}
                                    />
                                    {isRegenerating ? 'Regenerating...' : 'Regenerate'}
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Regenerate API Key?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will invalidate your current API key immediately.
                                        Any apps using the old key will stop working until you
                                        update them with the new key.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleRegenerate}>
                                        Regenerate Key
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 dark:bg-amber-950/20 dark:border-amber-800">
                        <p className="text-xs text-amber-800 dark:text-amber-200">
                            <strong>Keep this key secret.</strong> Do not commit it to
                            version control or share it publicly. Use environment variables
                            in your app.
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
