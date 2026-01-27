'use client'

/**
 * Campaign Editor Page
 *
 * Edit and send newsletter campaigns with preview and test email.
 *
 * @agent newsletter-system
 * @created 2026-01-27
 */

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    useCampaign,
    useCampaignPreview,
    useCampaignStats,
    useCampaignActions,
} from '@/hooks/useNewsletter'
import {
    Button,
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    Input,
    Textarea,
    Badge,
    Label,
} from '@/components/ui'
import {
    ArrowLeft,
    Send,
    Eye,
    Mail,
    Clock,
    CheckCircle,
    FileText,
    AlertCircle,
} from 'lucide-react'
import type { CampaignStatus } from '@/lib/api'

interface PageProps {
    params: Promise<{ id: string }>
}

export default function CampaignEditorPage({ params }: PageProps) {
    const { id } = use(params)
    const router = useRouter()
    const { campaign, isLoading, isError } = useCampaign(id)
    const { preview, refetch: refetchPreview } = useCampaignPreview(id)
    const { stats } = useCampaignStats(id)
    const actions = useCampaignActions(id)

    const [subject, setSubject] = useState('')
    const [content, setContent] = useState('')
    const [previewText, setPreviewText] = useState('')
    const [testEmail, setTestEmail] = useState('')
    const [showPreview, setShowPreview] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    // Initialize form with campaign data
    useEffect(() => {
        if (campaign) {
            setSubject(campaign.subject)
            setContent(campaign.content)
            setPreviewText(campaign.previewText ?? '')
        }
    }, [campaign])

    const isDraft = campaign?.status === 'draft'
    const hasChanges = campaign && (
        subject !== campaign.subject ||
        content !== campaign.content ||
        previewText !== (campaign.previewText ?? '')
    )

    const handleSave = async () => {
        if (!hasChanges) return
        setIsSaving(true)
        try {
            await actions.update.mutateAsync({
                subject,
                content,
                previewText: previewText || undefined,
            })
            await refetchPreview()
        } finally {
            setIsSaving(false)
        }
    }

    const handleSendTest = async () => {
        if (!testEmail) return
        // Save first if there are changes
        if (hasChanges) await handleSave()
        await actions.sendTest.mutateAsync(testEmail)
        alert('Test email sent!')
    }

    const handleSend = async () => {
        if (!confirm('Are you sure you want to send this campaign to all subscribers?')) return
        // Save first if there are changes
        if (hasChanges) await handleSave()
        await actions.send.mutateAsync({})
        router.push('/admin/newsletter')
    }

    if (isLoading) {
        return <LoadingSkeleton />
    }

    if (isError || !campaign) {
        return (
            <div className="space-y-4">
                <BackLink />
                <Card>
                    <CardContent className="py-12 text-center">
                        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
                        <p className="text-destructive">Campaign not found</p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <BackLink />
                <div className="flex items-center gap-2">
                    <StatusBadge status={campaign.status} />
                    {isDraft && (
                        <>
                            <Button
                                variant="outline"
                                onClick={handleSave}
                                disabled={!hasChanges || isSaving}
                            >
                                {isSaving ? 'Saving...' : 'Save'}
                            </Button>
                            <Button
                                onClick={handleSend}
                                disabled={actions.send.isPending}
                            >
                                <Send className="w-4 h-4 mr-2" />
                                Send Now
                            </Button>
                        </>
                    )}
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Editor Panel */}
                <div className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Campaign Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="subject">Subject Line</Label>
                                <Input
                                    id="subject"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    disabled={!isDraft}
                                    placeholder="Enter email subject..."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="previewText">Preview Text (optional)</Label>
                                <Input
                                    id="previewText"
                                    value={previewText}
                                    onChange={(e) => setPreviewText(e.target.value)}
                                    disabled={!isDraft}
                                    placeholder="Text shown in email preview..."
                                />
                                <p className="text-xs text-text-light">
                                    This text appears in inbox previews after the subject line
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Content (HTML)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                disabled={!isDraft}
                                placeholder="<h1>Hello!</h1><p>Your newsletter content...</p>"
                                rows={15}
                                className="font-mono text-sm"
                            />
                            <p className="text-xs text-text-light mt-2">
                                Use HTML tags for formatting. Supported: h1, h2, p, a, ul, ol, li, strong, em
                            </p>
                        </CardContent>
                    </Card>

                    {isDraft && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Send Test Email</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex gap-2">
                                    <Input
                                        type="email"
                                        value={testEmail}
                                        onChange={(e) => setTestEmail(e.target.value)}
                                        placeholder="test@example.com"
                                        className="flex-1"
                                    />
                                    <Button
                                        variant="outline"
                                        onClick={handleSendTest}
                                        disabled={!testEmail || actions.sendTest.isPending}
                                    >
                                        <Mail className="w-4 h-4 mr-2" />
                                        Send Test
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Preview Panel */}
                <div className="space-y-4">
                    <Card>
                        <CardHeader className="flex-row items-center justify-between">
                            <CardTitle>Preview</CardTitle>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowPreview(!showPreview)}
                            >
                                <Eye className="w-4 h-4 mr-2" />
                                {showPreview ? 'Hide' : 'Show'} Preview
                            </Button>
                        </CardHeader>
                        {showPreview && preview && (
                            <CardContent>
                                <div className="border rounded-lg overflow-hidden">
                                    <div className="bg-muted p-3 border-b">
                                        <p className="text-sm font-medium">{preview.subject}</p>
                                    </div>
                                    <iframe
                                        srcDoc={preview.html}
                                        className="w-full h-96 bg-white"
                                        title="Email Preview"
                                        sandbox=""
                                    />
                                </div>
                            </CardContent>
                        )}
                    </Card>

                    {campaign.status === 'sent' && stats && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Campaign Statistics</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-4">
                                    <StatItem
                                        label="Recipients"
                                        value={String(stats.recipientCount)}
                                    />
                                    <StatItem
                                        label="Opens"
                                        value={`${stats.openCount} (${stats.openRate}%)`}
                                    />
                                    <StatItem
                                        label="Clicks"
                                        value={`${stats.clickCount} (${stats.clickRate}%)`}
                                    />
                                    <StatItem
                                        label="Sent"
                                        value={stats.sentAt ? formatDate(stats.sentAt) : '-'}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <Card>
                        <CardHeader>
                            <CardTitle>Campaign Info</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-text-light">Created</span>
                                <span>{formatDate(campaign.createdAt)}</span>
                            </div>
                            {campaign.updatedAt && (
                                <div className="flex justify-between">
                                    <span className="text-text-light">Updated</span>
                                    <span>{formatDate(campaign.updatedAt)}</span>
                                </div>
                            )}
                            {campaign.sentAt && (
                                <div className="flex justify-between">
                                    <span className="text-text-light">Sent</span>
                                    <span>{formatDate(campaign.sentAt)}</span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="text-text-light">Created by</span>
                                <span className="truncate ml-4">{campaign.createdBy}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

// =============================================================================
// Components
// =============================================================================

function BackLink() {
    return (
        <Link
            href="/admin/newsletter"
            className="flex items-center gap-2 text-sm text-text-light hover:text-text-dark transition-colors"
        >
            <ArrowLeft className="w-4 h-4" />
            Back to Newsletter
        </Link>
    )
}

function StatusBadge({ status }: { status: CampaignStatus }) {
    const config: Record<CampaignStatus, { icon: typeof CheckCircle; color: string; label: string }> = {
        draft: { icon: FileText, color: 'bg-gray-100 text-gray-700', label: 'Draft' },
        scheduled: { icon: Clock, color: 'bg-pastel-blue/20 text-pastel-blue', label: 'Scheduled' },
        sending: { icon: Send, color: 'bg-pastel-yellow/20 text-pastel-yellow', label: 'Sending' },
        sent: { icon: CheckCircle, color: 'bg-pastel-green/20 text-pastel-green', label: 'Sent' },
    }

    const { icon: Icon, color, label } = config[status]

    return (
        <Badge variant="outline" className={color}>
            <Icon className="w-3 h-3 mr-1" />
            {label}
        </Badge>
    )
}

function StatItem({ label, value }: { label: string; value: string }) {
    return (
        <div className="p-3 bg-muted rounded-lg">
            <p className="text-xs text-text-light mb-1">{label}</p>
            <p className="text-lg font-semibold text-text-dark">{value}</p>
        </div>
    )
}

function LoadingSkeleton() {
    return (
        <div className="space-y-6">
            <div className="h-6 w-32 bg-muted rounded animate-pulse" />
            <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-4">
                    <Card>
                        <CardContent className="p-6">
                            <div className="space-y-4 animate-pulse">
                                <div className="h-10 bg-muted rounded" />
                                <div className="h-10 bg-muted rounded" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6">
                            <div className="h-64 bg-muted rounded animate-pulse" />
                        </CardContent>
                    </Card>
                </div>
                <Card>
                    <CardContent className="p-6">
                        <div className="h-96 bg-muted rounded animate-pulse" />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

function formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    })
}
