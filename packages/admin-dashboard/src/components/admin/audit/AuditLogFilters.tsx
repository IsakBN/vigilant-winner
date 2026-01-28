'use client'

/**
 * AuditLogFilters Component
 *
 * Filter controls for audit log search and filtering.
 */

import { useState } from 'react'
import { Search, Download, X } from 'lucide-react'
import {
    Button,
    Input,
    Label,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@bundlenudge/shared-ui'
import type { AuditAction, ListAuditLogsParams } from '@/lib/api'

interface AuditLogFiltersProps {
    filters: ListAuditLogsParams
    onFiltersChange: (filters: ListAuditLogsParams) => void
    onExport?: () => void
    isExporting?: boolean
}

const ACTION_OPTIONS: { value: AuditAction; label: string }[] = [
    { value: 'config.update', label: 'Config Updated' },
    { value: 'user.create', label: 'User Created' },
    { value: 'user.update', label: 'User Updated' },
    { value: 'user.delete', label: 'User Deleted' },
    { value: 'user.suspend', label: 'User Suspended' },
    { value: 'user.unsuspend', label: 'User Unsuspended' },
    { value: 'app.create', label: 'App Created' },
    { value: 'app.delete', label: 'App Deleted' },
    { value: 'release.create', label: 'Release Created' },
    { value: 'release.rollback', label: 'Release Rollback' },
    { value: 'team.create', label: 'Team Created' },
    { value: 'team.delete', label: 'Team Deleted' },
    { value: 'admin.login', label: 'Admin Login' },
    { value: 'admin.logout', label: 'Admin Logout' },
]

const TARGET_TYPE_OPTIONS = [
    { value: 'user', label: 'User' },
    { value: 'app', label: 'App' },
    { value: 'release', label: 'Release' },
    { value: 'team', label: 'Team' },
    { value: 'config', label: 'Config' },
]

export function AuditLogFilters({
    filters,
    onFiltersChange,
    onExport,
    isExporting,
}: AuditLogFiltersProps) {
    const [actorSearch, setActorSearch] = useState(filters.actorId || '')

    const handleActionChange = (value: string) => {
        if (value === 'all') {
            onFiltersChange({ ...filters, action: undefined, page: 1 })
        } else {
            onFiltersChange({ ...filters, action: value as AuditAction, page: 1 })
        }
    }

    const handleTargetTypeChange = (value: string) => {
        if (value === 'all') {
            onFiltersChange({ ...filters, targetType: undefined, page: 1 })
        } else {
            onFiltersChange({
                ...filters,
                targetType: value as ListAuditLogsParams['targetType'],
                page: 1,
            })
        }
    }

    const handleActorSearch = () => {
        onFiltersChange({
            ...filters,
            actorId: actorSearch || undefined,
            page: 1,
        })
    }

    const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
        onFiltersChange({ ...filters, [field]: value || undefined, page: 1 })
    }

    const clearFilters = () => {
        setActorSearch('')
        onFiltersChange({ page: 1, limit: filters.limit })
    }

    const hasFilters =
        filters.action ||
        filters.targetType ||
        filters.actorId ||
        filters.startDate ||
        filters.endDate

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-end gap-4">
                <div className="flex-1 min-w-[200px]">
                    <Label htmlFor="actor-search">Actor ID</Label>
                    <div className="flex gap-2 mt-1">
                        <Input
                            id="actor-search"
                            placeholder="Search by actor ID..."
                            value={actorSearch}
                            onChange={(e) => setActorSearch(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleActorSearch()
                                }
                            }}
                        />
                        <Button
                            variant="secondary"
                            size="icon"
                            onClick={handleActorSearch}
                        >
                            <Search className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div className="w-[180px]">
                    <Label>Action Type</Label>
                    <Select
                        value={filters.action || 'all'}
                        onValueChange={handleActionChange}
                    >
                        <SelectTrigger className="mt-1">
                            <SelectValue placeholder="All actions" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All actions</SelectItem>
                            {ACTION_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="w-[150px]">
                    <Label>Target Type</Label>
                    <Select
                        value={filters.targetType || 'all'}
                        onValueChange={handleTargetTypeChange}
                    >
                        <SelectTrigger className="mt-1">
                            <SelectValue placeholder="All targets" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All targets</SelectItem>
                            {TARGET_TYPE_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="flex flex-wrap items-end gap-4">
                <div className="w-[160px]">
                    <Label htmlFor="start-date">Start Date</Label>
                    <Input
                        id="start-date"
                        type="date"
                        value={filters.startDate || ''}
                        onChange={(e) => handleDateChange('startDate', e.target.value)}
                        className="mt-1"
                    />
                </div>

                <div className="w-[160px]">
                    <Label htmlFor="end-date">End Date</Label>
                    <Input
                        id="end-date"
                        type="date"
                        value={filters.endDate || ''}
                        onChange={(e) => handleDateChange('endDate', e.target.value)}
                        className="mt-1"
                    />
                </div>

                <div className="flex gap-2">
                    {hasFilters && (
                        <Button variant="outline" onClick={clearFilters}>
                            <X className="mr-2 h-4 w-4" />
                            Clear
                        </Button>
                    )}
                    {onExport && (
                        <Button
                            variant="outline"
                            onClick={onExport}
                            disabled={isExporting}
                        >
                            <Download className="mr-2 h-4 w-4" />
                            {isExporting ? 'Exporting...' : 'Export CSV'}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}
