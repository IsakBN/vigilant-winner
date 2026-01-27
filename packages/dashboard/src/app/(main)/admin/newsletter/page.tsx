'use client'

/**
 * Newsletter Admin Page
 *
 * Manages newsletter campaigns and subscribers with tabbed interface.
 *
 * @agent newsletter-system
 * @created 2026-01-27
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    useCampaigns,
    useSubscribers,
    useCreateCampaign,
    useDeleteCampaign,
    useExportSubscribers,
    useImportSubscribers,
} from '@/hooks/useNewsletter'
import {
    Button,
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    Input,
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
    Badge,
    Textarea,
} from '@/components/ui'
import {
    Plus,
    Download,
    Upload,
    Search,
    Mail,
    Send,
    Clock,
    CheckCircle,
    FileText,
    Trash2,
    Eye,
} from 'lucide-react'
import type { CampaignStatus, NewsletterCampaign } from '@/lib/api'

export default function NewsletterAdminPage() {
    const [activeTab, setActiveTab] = useState<'campaigns' | 'subscribers'>('campaigns')

    return (
        <div className="space-y-6">
            <PageHeader />

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'campaigns' | 'subscribers')}>
                <TabsList>
                    <TabsTrigger value="campaigns">
                        <Mail className="w-4 h-4 mr-2" />
                        Campaigns
                    </TabsTrigger>
                    <TabsTrigger value="subscribers">
                        <FileText className="w-4 h-4 mr-2" />
                        Subscribers
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="campaigns" className="mt-6">
                    <CampaignsTab />
                </TabsContent>

                <TabsContent value="subscribers" className="mt-6">
                    <SubscribersTab />
                </TabsContent>
            </Tabs>
        </div>
    )
}

function PageHeader() {
    return (
        <div>
            <h1 className="text-2xl font-bold text-text-dark font-heading">Newsletter</h1>
            <p className="text-text-light mt-1">
                Manage email campaigns and subscribers
            </p>
        </div>
    )
}

// =============================================================================
// Campaigns Tab
// =============================================================================

function CampaignsTab() {
    const router = useRouter()
    const [statusFilter, setStatusFilter] = useState<CampaignStatus | 'all'>('all')
    const { campaigns, pagination, isLoading } = useCampaigns({
        status: statusFilter === 'all' ? undefined : statusFilter,
    })
    const createCampaign = useCreateCampaign()
    const deleteCampaign = useDeleteCampaign()

    const handleCreateCampaign = async () => {
        const result = await createCampaign.mutateAsync({
            subject: 'New Campaign',
            content: '<h1>Hello!</h1><p>Write your newsletter content here...</p>',
        })
        if (result.campaignId) {
            router.push(`/admin/newsletter/${result.campaignId}`)
        }
    }

    const handleDeleteCampaign = async (campaignId: string) => {
        if (confirm('Are you sure you want to delete this campaign?')) {
            await deleteCampaign.mutateAsync(campaignId)
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {(['all', 'draft', 'scheduled', 'sent'] as const).map((status) => (
                        <Button
                            key={status}
                            variant={statusFilter === status ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setStatusFilter(status)}
                        >
                            {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                        </Button>
                    ))}
                </div>
                <Button onClick={handleCreateCampaign} disabled={createCampaign.isPending}>
                    <Plus className="w-4 h-4 mr-2" />
                    New Campaign
                </Button>
            </div>

            {isLoading ? (
                <CampaignsSkeleton />
            ) : campaigns.length === 0 ? (
                <EmptyState message="No campaigns yet" />
            ) : (
                <div className="grid gap-4">
                    {campaigns.map((campaign) => (
                        <CampaignCard
                            key={campaign.id}
                            campaign={campaign}
                            onEdit={() => router.push(`/admin/newsletter/${campaign.id}`)}
                            onDelete={() => handleDeleteCampaign(campaign.id)}
                            isDeleting={deleteCampaign.isPending}
                        />
                    ))}
                </div>
            )}

            {pagination.total > 0 && (
                <p className="text-sm text-text-light text-center">
                    Showing {campaigns.length} of {pagination.total} campaigns
                </p>
            )}
        </div>
    )
}

interface CampaignCardProps {
    campaign: NewsletterCampaign
    onEdit: () => void
    onDelete: () => void
    isDeleting: boolean
}

function CampaignCard({ campaign, onEdit, onDelete, isDeleting }: CampaignCardProps) {
    const statusConfig: Record<CampaignStatus, { icon: typeof CheckCircle; color: string; label: string }> = {
        draft: { icon: FileText, color: 'bg-gray-100 text-gray-700', label: 'Draft' },
        scheduled: { icon: Clock, color: 'bg-pastel-blue/20 text-pastel-blue', label: 'Scheduled' },
        sending: { icon: Send, color: 'bg-pastel-yellow/20 text-pastel-yellow', label: 'Sending' },
        sent: { icon: CheckCircle, color: 'bg-pastel-green/20 text-pastel-green', label: 'Sent' },
    }

    const config = statusConfig[campaign.status]
    const StatusIcon = config.icon

    return (
        <Card className="hover:border-primary/50 transition-colors">
            <CardContent className="p-4">
                <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-text-dark truncate">
                                {campaign.subject}
                            </h3>
                            <Badge variant="outline" className={config.color}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {config.label}
                            </Badge>
                        </div>
                        {campaign.previewText && (
                            <p className="text-sm text-text-light truncate mb-2">
                                {campaign.previewText}
                            </p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-text-light">
                            <span>Created {formatDate(campaign.createdAt)}</span>
                            {campaign.sentAt && (
                                <span>Sent {formatDate(campaign.sentAt)}</span>
                            )}
                            {campaign.recipientCount !== null && (
                                <span>{campaign.recipientCount} recipients</span>
                            )}
                            {campaign.status === 'sent' && campaign.recipientCount && (
                                <>
                                    <span>
                                        {Math.round((campaign.openCount / campaign.recipientCount) * 100)}% opens
                                    </span>
                                    <span>
                                        {Math.round((campaign.clickCount / campaign.recipientCount) * 100)}% clicks
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                        <Button variant="outline" size="sm" onClick={onEdit}>
                            <Eye className="w-4 h-4 mr-1" />
                            {campaign.status === 'draft' ? 'Edit' : 'View'}
                        </Button>
                        {campaign.status === 'draft' && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onDelete}
                                disabled={isDeleting}
                                className="text-destructive hover:text-destructive"
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

// =============================================================================
// Subscribers Tab
// =============================================================================

function SubscribersTab() {
    const [search, setSearch] = useState('')
    const [showActive, setShowActive] = useState<boolean | undefined>(true)
    const [importCsv, setImportCsv] = useState('')
    const [showImport, setShowImport] = useState(false)

    const { subscribers, pagination, isLoading } = useSubscribers({
        search: search || undefined,
        active: showActive,
    })
    const exportSubscribers = useExportSubscribers()
    const importSubscribers = useImportSubscribers()

    const handleImport = async () => {
        if (!importCsv.trim()) return
        await importSubscribers.mutateAsync({ csv: importCsv, source: 'import' })
        setImportCsv('')
        setShowImport(false)
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light" />
                        <Input
                            placeholder="Search by email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 w-64"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant={showActive === true ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setShowActive(true)}
                        >
                            Active
                        </Button>
                        <Button
                            variant={showActive === false ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setShowActive(false)}
                        >
                            Unsubscribed
                        </Button>
                        <Button
                            variant={showActive === undefined ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setShowActive(undefined)}
                        >
                            All
                        </Button>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setShowImport(!showImport)}
                    >
                        <Upload className="w-4 h-4 mr-2" />
                        Import
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => exportSubscribers.mutate()}
                        disabled={exportSubscribers.isPending}
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </Button>
                </div>
            </div>

            {showImport && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Import Subscribers</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-text-light">
                            Paste CSV content with email and optional name columns.
                            First row can be headers (email,name).
                        </p>
                        <Textarea
                            placeholder="email,name&#10;user@example.com,John Doe&#10;another@example.com,Jane Smith"
                            value={importCsv}
                            onChange={(e) => setImportCsv(e.target.value)}
                            rows={5}
                        />
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setShowImport(false)}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleImport}
                                disabled={!importCsv.trim() || importSubscribers.isPending}
                            >
                                {importSubscribers.isPending ? 'Importing...' : 'Import'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {isLoading ? (
                <SubscribersSkeleton />
            ) : subscribers.length === 0 ? (
                <EmptyState message="No subscribers found" />
            ) : (
                <Card>
                    <CardContent className="p-0">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-border">
                                    <th className="text-left p-4 text-sm font-medium text-text-light">Email</th>
                                    <th className="text-left p-4 text-sm font-medium text-text-light">Name</th>
                                    <th className="text-left p-4 text-sm font-medium text-text-light">Source</th>
                                    <th className="text-left p-4 text-sm font-medium text-text-light">Subscribed</th>
                                    <th className="text-left p-4 text-sm font-medium text-text-light">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {subscribers.map((sub) => (
                                    <tr key={sub.id} className="border-b border-border last:border-0">
                                        <td className="p-4 text-sm text-text-dark">{sub.email}</td>
                                        <td className="p-4 text-sm text-text-light">{sub.name ?? '-'}</td>
                                        <td className="p-4 text-sm text-text-light">{sub.source ?? '-'}</td>
                                        <td className="p-4 text-sm text-text-light">{formatDate(sub.subscribedAt)}</td>
                                        <td className="p-4">
                                            <Badge variant="outline" className={sub.isActive ? 'bg-pastel-green/20 text-pastel-green' : 'bg-gray-100 text-gray-700'}>
                                                {sub.isActive ? 'Active' : 'Unsubscribed'}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            )}

            <p className="text-sm text-text-light text-center">
                {pagination.total} total subscribers
            </p>
        </div>
    )
}

// =============================================================================
// Helpers
// =============================================================================

function formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    })
}

function EmptyState({ message }: { message: string }) {
    return (
        <Card>
            <CardContent className="py-12 text-center">
                <Mail className="w-12 h-12 mx-auto mb-4 text-text-light opacity-50" />
                <p className="text-text-light">{message}</p>
            </CardContent>
        </Card>
    )
}

function CampaignsSkeleton() {
    return (
        <div className="space-y-4">
            {[1, 2, 3].map((i) => (
                <Card key={i}>
                    <CardContent className="p-4">
                        <div className="animate-pulse space-y-2">
                            <div className="h-5 bg-muted rounded w-1/3" />
                            <div className="h-4 bg-muted rounded w-2/3" />
                            <div className="h-3 bg-muted rounded w-1/4" />
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}

function SubscribersSkeleton() {
    return (
        <Card>
            <CardContent className="p-4">
                <div className="animate-pulse space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="h-10 bg-muted rounded" />
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
