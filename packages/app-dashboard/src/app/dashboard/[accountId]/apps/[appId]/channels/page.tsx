'use client'

/**
 * Channels List Page
 *
 * Displays all channels for an app with the ability to create new ones.
 */

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { Plus, Radio } from 'lucide-react'
import { Button } from '@bundlenudge/shared-ui'
import { useChannels } from '@/hooks'
import { ChannelList, CreateChannelDialog } from '@/components/channels'

// =============================================================================
// Page Header
// =============================================================================

interface PageHeaderProps {
    onCreateClick: () => void
}

function PageHeader({ onCreateClick }: PageHeaderProps) {
    return (
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-neutral-100 rounded-lg">
                    <Radio className="w-5 h-5 text-text-light" />
                </div>
                <div>
                    <h1 className="text-xl font-semibold text-text-dark">Channels</h1>
                    <p className="text-sm text-text-light">
                        Manage release channels for different environments
                    </p>
                </div>
            </div>
            <Button
                onClick={onCreateClick}
                className="bg-bright-accent text-white hover:opacity-90"
            >
                <Plus className="w-4 h-4 mr-2" />
                Create Channel
            </Button>
        </div>
    )
}

// =============================================================================
// Page Component
// =============================================================================

export default function ChannelsPage() {
    const params = useParams()
    const appId = params.appId as string
    const accountId = params.accountId as string

    const [createDialogOpen, setCreateDialogOpen] = useState(false)
    const { channels, isLoading, refetch } = useChannels(accountId, appId)

    const handleCreateSuccess = () => {
        setCreateDialogOpen(false)
        void refetch()
    }

    return (
        <div>
            <PageHeader onCreateClick={() => setCreateDialogOpen(true)} />

            <ChannelList
                channels={channels}
                appId={appId}
                accountId={accountId}
                isLoading={isLoading}
                onCreateClick={() => setCreateDialogOpen(true)}
            />

            <CreateChannelDialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
                accountId={accountId}
                appId={appId}
                onSuccess={handleCreateSuccess}
            />
        </div>
    )
}
