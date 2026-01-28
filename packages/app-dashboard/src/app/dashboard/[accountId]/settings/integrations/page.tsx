'use client'

/**
 * Integrations Page
 *
 * Manage third-party integrations like GitHub, Slack, and crash services.
 */

import { useParams } from 'next/navigation'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@bundlenudge/shared-ui'
import {
    IntegrationCard,
    IntegrationsSettingsSkeleton,
    GitHubIcon,
    SlackIcon,
    DiscordIcon,
    SentryIcon,
} from '@/components/settings'
import { integrations } from '@/lib/api'

export default function IntegrationsPage() {
    const params = useParams()
    const accountId = params.accountId as string
    const queryClient = useQueryClient()

    const [slackConnecting, setSlackConnecting] = useState(false)

    const { data: githubStatus, isLoading: githubLoading } = useQuery({
        queryKey: ['github', 'status', accountId],
        queryFn: () => integrations.getGitHubStatus(),
    })

    const disconnectGithub = useMutation({
        mutationFn: () => integrations.disconnectGitHub(),
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
        window.location.href = `/api/auth/slack?accountId=${accountId}`
    }

    if (githubLoading) {
        return <IntegrationsSettingsSkeleton />
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
