'use client'

/**
 * Apps List Page
 *
 * Main page displaying all apps for an account with search and filtering.
 */

import { useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { AppList } from '@/components/apps'
import { CreateAppModal } from './CreateAppModal'
import { Button } from '@/components/ui'

export default function AppsPage() {
    const params = useParams<{ accountId: string }>()
    const accountId = params.accountId

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

    const handleOpenCreateModal = useCallback(() => {
        setIsCreateModalOpen(true)
    }, [])

    const handleCloseCreateModal = useCallback(() => {
        setIsCreateModalOpen(false)
    }, [])

    return (
        <>
            {/* Page Header */}
            <PageHeader onCreateApp={handleOpenCreateModal} />

            {/* Apps List */}
            <AppList accountId={accountId} onCreateApp={handleOpenCreateModal} />

            {/* Create App Modal */}
            <CreateAppModal
                accountId={accountId}
                open={isCreateModalOpen}
                onClose={handleCloseCreateModal}
            />
        </>
    )
}

interface PageHeaderProps {
    onCreateApp: () => void
}

function PageHeader({ onCreateApp }: PageHeaderProps) {
    return (
        <div className="flex items-center justify-between mb-8">
            <div>
                <h1 className="text-2xl font-bold text-text-dark font-heading">
                    Apps
                </h1>
                <p className="text-text-light mt-1">
                    Manage your React Native applications and push OTA updates.
                </p>
            </div>

            <Button onClick={onCreateApp}>Create App</Button>
        </div>
    )
}
