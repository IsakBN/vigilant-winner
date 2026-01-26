'use client'

/**
 * ReleaseActions Component
 *
 * Action buttons for release management with confirmation dialogs.
 */

import { useState } from 'react'
import { Edit, Power, PowerOff, RotateCcw, Trash2, MoreVertical, Loader2 } from 'lucide-react'
import {
    Button, AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
    AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui'
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { ReleaseStatus } from './ReleaseStatusBadge'

interface ReleaseActionsProps {
    releaseId: string
    status: ReleaseStatus
    version: string
    onEdit?: () => void
    onEnable?: () => void
    onDisable?: () => void
    onRollback?: () => void
    onDelete?: () => void
    isLoading?: boolean
    loadingAction?: string
}

export function ReleaseActions({
    status, version, onEdit, onEnable, onDisable, onRollback, onDelete, isLoading = false, loadingAction,
}: ReleaseActionsProps) {
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [rollbackDialogOpen, setRollbackDialogOpen] = useState(false)
    const isActive = status === 'active'
    const isDisabled = status === 'disabled'

    return (
        <div className="flex items-center gap-1">
            {onEdit && (
                <Button variant="ghost" size="icon" onClick={onEdit} disabled={isLoading} title="Edit release">
                    <Edit className="w-4 h-4" />
                </Button>
            )}

            {(onEnable || onDisable) && (
                <Button variant="ghost" size="icon" onClick={isDisabled ? onEnable : onDisable} disabled={isLoading} title={isDisabled ? 'Enable' : 'Disable'}>
                    {isLoading && loadingAction === 'toggle' ? <Loader2 className="w-4 h-4 animate-spin" />
                        : isDisabled ? <Power className="w-4 h-4 text-green-600" />
                        : <PowerOff className="w-4 h-4 text-yellow-600" />}
                </Button>
            )}

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" disabled={isLoading}><MoreVertical className="w-4 h-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    {onEdit && <DropdownMenuItem onClick={onEdit}><Edit className="w-4 h-4 mr-2" />Edit</DropdownMenuItem>}
                    {isDisabled && onEnable && <DropdownMenuItem onClick={onEnable}><Power className="w-4 h-4 mr-2 text-green-600" />Enable</DropdownMenuItem>}
                    {!isDisabled && onDisable && <DropdownMenuItem onClick={onDisable}><PowerOff className="w-4 h-4 mr-2 text-yellow-600" />Disable</DropdownMenuItem>}
                    {onRollback && isActive && (
                        <><DropdownMenuSeparator /><DropdownMenuItem onClick={() => setRollbackDialogOpen(true)}><RotateCcw className="w-4 h-4 mr-2" />Rollback</DropdownMenuItem></>
                    )}
                    {onDelete && (
                        <><DropdownMenuSeparator /><DropdownMenuItem onClick={() => setDeleteDialogOpen(true)} className="text-red-600 focus:text-red-600"><Trash2 className="w-4 h-4 mr-2" />Delete</DropdownMenuItem></>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialog open={rollbackDialogOpen} onOpenChange={setRollbackDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Rollback Release</AlertDialogTitle>
                        <AlertDialogDescription>Are you sure you want to rollback from version {version}? This will revert all devices to the previous release.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => { setRollbackDialogOpen(false); onRollback?.() }}>Rollback</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Release</AlertDialogTitle>
                        <AlertDialogDescription>Are you sure you want to delete version {version}? This action cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => { setDeleteDialogOpen(false); onDelete?.() }} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

interface ReleaseInlineActionsProps {
    onEdit?: () => void
    onToggleStatus?: () => void
    onDelete?: () => void
    isActive: boolean
    isLoading?: boolean
}

export function ReleaseInlineActions({ onEdit, onToggleStatus, onDelete, isActive, isLoading }: ReleaseInlineActionsProps) {
    return (
        <div className="flex items-center gap-2">
            {onEdit && <Button variant="outline" size="sm" onClick={onEdit} disabled={isLoading}><Edit className="w-4 h-4 mr-1" />Edit</Button>}
            {onToggleStatus && (
                <Button variant="outline" size="sm" onClick={onToggleStatus} disabled={isLoading}>
                    {isActive ? <><PowerOff className="w-4 h-4 mr-1" />Disable</> : <><Power className="w-4 h-4 mr-1" />Enable</>}
                </Button>
            )}
            {onDelete && <Button variant="outline" size="sm" onClick={onDelete} disabled={isLoading} className="text-red-600 hover:text-red-700"><Trash2 className="w-4 h-4 mr-1" />Delete</Button>}
        </div>
    )
}
