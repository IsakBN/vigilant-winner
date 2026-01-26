'use client'

/**
 * Integrations Page
 *
 * Manage third-party integrations like GitHub and Slack.
 */

import { useParams } from 'next/navigation'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { IntegrationCard } from '@/components/settings'
import { Skeleton } from '@/components/ui/skeleton'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { github } from '@/lib/api'

export default function IntegrationsPage() {
    const params = useParams()
    const accountId = params.accountId as string
    const queryClient = useQueryClient()

    const [slackConnecting, setSlackConnecting] = useState(false)

    const { data: githubStatus, isLoading: githubLoading } = useQuery({
        queryKey: ['github', 'status', accountId],
        queryFn: () => github.getStatus(),
    })

    const disconnectGithub = useMutation({
        mutationFn: () => github.disconnect(),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: ['github', 'status', accountId],
            })
        },
    })

    const handleGithubConnect = () => {
        window.location.href = `/api/auth/github?accountId=${accountId}`
    }

    const handleSlackConnect = () => {
        setSlackConnecting(true)
        // Redirect to Slack OAuth
        window.location.href = `/api/auth/slack?accountId=${accountId}`
    }

    if (githubLoading) {
        return <IntegrationsSkeleton />
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Connected Services</CardTitle>
                    <CardDescription>
                        Connect third-party services to enhance your workflow
                    </CardDescription>
                </CardHeader>
            </Card>

            <div className="space-y-4">
                <IntegrationCard
                    name="GitHub"
                    description="Link repositories for automatic releases"
                    icon={<GitHubIcon />}
                    connected={githubStatus?.connected ?? false}
                    connectedAccount={githubStatus?.username}
                    onConnect={handleGithubConnect}
                    onDisconnect={() => disconnectGithub.mutate()}
                    isLoading={disconnectGithub.isPending}
                    docsUrl="https://docs.bundlenudge.com/integrations/github"
                />

                <IntegrationCard
                    name="Slack"
                    description="Receive notifications in your Slack channels"
                    icon={<SlackIcon />}
                    connected={false}
                    onConnect={handleSlackConnect}
                    onDisconnect={() => undefined}
                    isLoading={slackConnecting}
                    docsUrl="https://docs.bundlenudge.com/integrations/slack"
                />

                <IntegrationCard
                    name="Discord"
                    description="Send release notifications to Discord"
                    icon={<DiscordIcon />}
                    connected={false}
                    onConnect={() => undefined}
                    onDisconnect={() => undefined}
                    docsUrl="https://docs.bundlenudge.com/integrations/discord"
                />

                <IntegrationCard
                    name="Sentry"
                    description="Link crash reports with releases"
                    icon={<SentryIcon />}
                    connected={false}
                    onConnect={() => undefined}
                    onDisconnect={() => undefined}
                    docsUrl="https://docs.bundlenudge.com/integrations/sentry"
                />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>API Access</CardTitle>
                    <CardDescription>
                        Use the BundleNudge API for custom integrations
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        Build custom integrations using our REST API. View the{' '}
                        <a
                            href="https://docs.bundlenudge.com/api"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary underline"
                        >
                            API documentation
                        </a>{' '}
                        to get started.
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}

function IntegrationsSkeleton() {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-4 w-60" />
                </CardHeader>
            </Card>
            {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-10 w-10 rounded-lg" />
                            <div>
                                <Skeleton className="h-5 w-24" />
                                <Skeleton className="mt-1 h-4 w-40" />
                            </div>
                        </div>
                    </CardHeader>
                </Card>
            ))}
        </div>
    )
}

function GitHubIcon() {
    return (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"
            />
        </svg>
    )
}

function SlackIcon() {
    return (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
        </svg>
    )
}

function DiscordIcon() {
    return (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
        </svg>
    )
}

function SentryIcon() {
    return (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M13.91 2.505c-.873-1.448-2.972-1.448-3.845 0L6.572 8.17a2.248 2.248 0 0 0-.263.467h3.914c.089-.17.197-.329.326-.467l2.77-4.33a.25.25 0 0 1 .427 0l6.895 10.786a.25.25 0 0 1-.213.374H15.82a1.125 1.125 0 0 0-1.125 1.125v1.125h6.732c1.873 0 3.028-2.022 2.077-3.635L13.91 2.505z" />
            <path d="M8.536 15.125H2.428a.25.25 0 0 1-.214-.374L4.38 11.4a1.125 1.125 0 0 0-1.923-1.168L.289 13.58c-.951 1.614.204 3.635 2.077 3.635h7.295v-1.125a1.125 1.125 0 0 0-1.125-.965z" />
            <path d="M11.143 15.125H7.411a1.125 1.125 0 1 0 0 2.09h4.857v-1.125a1.125 1.125 0 0 0-1.125-.965z" />
        </svg>
    )
}
