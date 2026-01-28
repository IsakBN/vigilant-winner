'use client'

/**
 * TestersTab Component
 *
 * Tab content for managing testers.
 */

import { Button } from '@bundlenudge/shared-ui'
import {
    useTesters,
    useCreateTester,
    useDeleteTester,
    useImportTesters,
    useExportTesters,
} from '@/hooks/useTesters'
import { AudienceStats } from './AudienceStats'
import { TesterTable } from './TesterTable'
import { AddTesterDialog } from './AddTesterDialog'
import { BulkImportDialog } from './BulkImportDialog'
import { EmptyTesterState } from './EmptyTesterState'
import { AudienceSkeleton } from './AudienceSkeleton'
import { AudienceErrorState } from './AudienceErrorState'

interface TestersTabProps {
    accountId: string
    appId: string
}

export function TestersTab({ accountId, appId }: TestersTabProps) {
    const { testers, isLoading, isError } = useTesters(accountId, appId)
    const createTester = useCreateTester(accountId, appId)
    const deleteTester = useDeleteTester(accountId, appId)
    const importTesters = useImportTesters(accountId, appId)
    const exportTesters = useExportTesters(accountId, appId)

    const isSubmitting = createTester.isPending || importTesters.isPending

    async function handleAddTester(email: string, name?: string) {
        await createTester.mutateAsync({ email, name })
    }

    async function handleImport(csv: string) {
        await importTesters.mutateAsync(csv)
    }

    async function handleExport() {
        const result = await exportTesters.mutateAsync()
        const blob = new Blob([result.csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `testers-${appId}.csv`
        a.click()
        URL.revokeObjectURL(url)
    }

    function handleDeleteTester(testerId: string) {
        deleteTester.mutate(testerId)
    }

    if (isLoading) {
        return <AudienceSkeleton />
    }

    if (isError) {
        return <AudienceErrorState message="Failed to load testers" />
    }

    if (testers.length === 0) {
        return (
            <EmptyTesterState
                onAdd={handleAddTester}
                isSubmitting={isSubmitting}
            />
        )
    }

    return (
        <div className="space-y-6">
            {/* Actions */}
            <div className="flex items-center justify-end gap-2">
                <Button
                    variant="outline"
                    onClick={() => void handleExport()}
                    disabled={exportTesters.isPending}
                >
                    {exportTesters.isPending ? 'Exporting...' : 'Export CSV'}
                </Button>
                <BulkImportDialog onImport={handleImport} isSubmitting={isSubmitting} />
                <AddTesterDialog onAdd={handleAddTester} isSubmitting={isSubmitting} />
            </div>

            {/* Testers Table */}
            <TesterTable
                testers={testers}
                onDelete={handleDeleteTester}
                isDeleting={deleteTester.isPending}
            />

            {/* Stats */}
            <AudienceStats testers={testers} />
        </div>
    )
}
