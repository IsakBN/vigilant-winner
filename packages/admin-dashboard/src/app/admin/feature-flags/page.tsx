'use client'

/**
 * Admin Feature Flags Page
 *
 * Feature flag management interface with:
 * - Search and filtering by status/type
 * - Toggle flags on/off
 * - Create new flags
 * - Edit flag settings and targeting
 * - Delete flags with confirmation
 */

import { useState, useCallback, useEffect, useMemo } from 'react'
import { Flag } from 'lucide-react'
import {
    useFeatureFlags,
    useCreateFeatureFlag,
    useUpdateFeatureFlag,
    useDeleteFeatureFlag,
    useToggleFeatureFlag,
} from '@/hooks/useFeatureFlags'
import {
    FlagFilters,
    FlagTable,
    FlagFormDialog,
    DeleteFlagDialog,
} from '@/components/admin/feature-flags'
import type {
    FeatureFlag,
    FeatureFlagStatus,
    FeatureFlagType,
    CreateFeatureFlagInput,
    UpdateFeatureFlagInput,
} from '@/lib/api/types'

const SEARCH_DEBOUNCE_MS = 300

export default function FeatureFlagsPage() {
    // Filter state
    const [searchInput, setSearchInput] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState<FeatureFlagStatus | 'all'>('all')
    const [typeFilter, setTypeFilter] = useState<FeatureFlagType | 'all'>('all')

    // Dialog state
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [isDeleteOpen, setIsDeleteOpen] = useState(false)
    const [selectedFlag, setSelectedFlag] = useState<FeatureFlag | null>(null)
    const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set())

    // Fetch flags
    const { flags, isLoading, isError, error } = useFeatureFlags()

    // Mutations
    const createMutation = useCreateFeatureFlag()
    const updateMutation = useUpdateFeatureFlag()
    const deleteMutation = useDeleteFeatureFlag()
    const toggleMutation = useToggleFeatureFlag()

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchInput)
        }, SEARCH_DEBOUNCE_MS)

        return () => clearTimeout(timer)
    }, [searchInput])

    // Filter flags client-side
    const filteredFlags = useMemo(() => {
        return flags.filter((flag) => {
            // Search filter
            if (debouncedSearch) {
                const search = debouncedSearch.toLowerCase()
                const matchesName = flag.name.toLowerCase().includes(search)
                const matchesKey = flag.key.toLowerCase().includes(search)
                if (!matchesName && !matchesKey) {
                    return false
                }
            }

            // Status filter
            if (statusFilter !== 'all' && flag.status !== statusFilter) {
                return false
            }

            // Type filter
            if (typeFilter !== 'all' && flag.type !== typeFilter) {
                return false
            }

            return true
        })
    }, [flags, debouncedSearch, statusFilter, typeFilter])

    // Handlers
    const handleSearchChange = useCallback((value: string) => {
        setSearchInput(value)
    }, [])

    const handleStatusChange = useCallback((value: FeatureFlagStatus | 'all') => {
        setStatusFilter(value)
    }, [])

    const handleTypeChange = useCallback((value: FeatureFlagType | 'all') => {
        setTypeFilter(value)
    }, [])

    const handleCreateClick = useCallback(() => {
        setSelectedFlag(null)
        setIsFormOpen(true)
    }, [])

    const handleEditClick = useCallback((flag: FeatureFlag) => {
        setSelectedFlag(flag)
        setIsFormOpen(true)
    }, [])

    const handleDeleteClick = useCallback((flag: FeatureFlag) => {
        setSelectedFlag(flag)
        setIsDeleteOpen(true)
    }, [])

    const handleToggle = useCallback(
        (flagId: string, enabled: boolean) => {
            setTogglingIds((prev) => new Set(prev).add(flagId))
            toggleMutation.mutate(
                { flagId, enabled },
                {
                    onSettled: () => {
                        setTogglingIds((prev) => {
                            const next = new Set(prev)
                            next.delete(flagId)
                            return next
                        })
                    },
                }
            )
        },
        [toggleMutation]
    )

    const handleFormSubmit = useCallback(
        (data: CreateFeatureFlagInput | UpdateFeatureFlagInput, flagId?: string) => {
            if (flagId) {
                updateMutation.mutate(
                    { flagId, data: data as UpdateFeatureFlagInput },
                    { onSuccess: () => setIsFormOpen(false) }
                )
            } else {
                createMutation.mutate(data as CreateFeatureFlagInput, {
                    onSuccess: () => setIsFormOpen(false),
                })
            }
        },
        [createMutation, updateMutation]
    )

    const handleDeleteConfirm = useCallback(() => {
        if (selectedFlag) {
            deleteMutation.mutate(selectedFlag.id, {
                onSuccess: () => {
                    setIsDeleteOpen(false)
                    setSelectedFlag(null)
                },
            })
        }
    }, [deleteMutation, selectedFlag])

    const isSubmitting = createMutation.isPending || updateMutation.isPending

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-pastel-purple/10 rounded-lg">
                        <Flag className="w-5 h-5 text-pastel-purple" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-text-dark">Feature Flags</h1>
                        <p className="text-sm text-text-light">
                            Control feature rollout and targeting
                        </p>
                    </div>
                </div>
                <div className="text-sm text-text-light">
                    Total: {String(flags.length)} flags
                </div>
            </div>

            {/* Filters */}
            <FlagFilters
                search={searchInput}
                onSearchChange={handleSearchChange}
                status={statusFilter}
                onStatusChange={handleStatusChange}
                type={typeFilter}
                onTypeChange={handleTypeChange}
                onCreateClick={handleCreateClick}
            />

            {/* Error state */}
            {isError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error instanceof Error ? error.message : 'Failed to load feature flags'}
                </div>
            )}

            {/* Table */}
            <FlagTable
                flags={filteredFlags}
                isLoading={isLoading}
                onToggle={handleToggle}
                onEdit={handleEditClick}
                onDelete={handleDeleteClick}
                togglingIds={togglingIds}
            />

            {/* Create/Edit Dialog */}
            <FlagFormDialog
                open={isFormOpen}
                onOpenChange={setIsFormOpen}
                flag={selectedFlag}
                onSubmit={handleFormSubmit}
                isSubmitting={isSubmitting}
            />

            {/* Delete Confirmation Dialog */}
            <DeleteFlagDialog
                open={isDeleteOpen}
                onOpenChange={setIsDeleteOpen}
                flag={selectedFlag}
                onConfirm={handleDeleteConfirm}
                isDeleting={deleteMutation.isPending}
            />
        </div>
    )
}

