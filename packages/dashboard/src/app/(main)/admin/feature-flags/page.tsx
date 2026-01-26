'use client'

/**
 * Admin Feature Flags Page
 *
 * Manage feature flags with toggle controls, rollout settings, and targeting.
 */

import { useState, useCallback } from 'react'
import { FeatureFlagList, FeatureFlagEditor } from '@/components/admin'
import type { FeatureFlag } from '@/lib/api'

export default function AdminFeatureFlagsPage() {
    const [isEditorOpen, setIsEditorOpen] = useState(false)
    const [selectedFlag, setSelectedFlag] = useState<FeatureFlag | null>(null)

    const handleCreateFlag = useCallback(() => {
        setSelectedFlag(null)
        setIsEditorOpen(true)
    }, [])

    const handleEditFlag = useCallback((flag: FeatureFlag) => {
        setSelectedFlag(flag)
        setIsEditorOpen(true)
    }, [])

    const handleCloseEditor = useCallback(() => {
        setIsEditorOpen(false)
        setSelectedFlag(null)
    }, [])

    return (
        <>
            <PageHeader />
            <FeatureFlagList
                onCreateFlag={handleCreateFlag}
                onEditFlag={handleEditFlag}
            />
            <FeatureFlagEditor
                flag={selectedFlag}
                open={isEditorOpen}
                onClose={handleCloseEditor}
            />
        </>
    )
}

function PageHeader() {
    return (
        <div className="mb-8">
            <h1 className="text-2xl font-bold text-text-dark font-heading">
                Feature Flags
            </h1>
            <p className="text-text-light mt-1">
                Control feature rollouts with toggles, percentage rollouts, and audience targeting.
            </p>
        </div>
    )
}
