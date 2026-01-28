'use client'

import { useState, useEffect } from 'react'
import { apps } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

interface FolderBrowserProps {
    installationId: number
    owner: string
    repo: string
    initialPath?: string
    onSelect: (path: string) => void
    onCancel: () => void
}

interface BreadcrumbItem {
    name: string
    path: string
}

interface ContentItem {
    name: string
    path: string
    type: 'dir' | 'file'
}

export function FolderBrowser({
    installationId,
    owner,
    repo,
    initialPath = '',
    onSelect,
    onCancel
}: FolderBrowserProps) {
    const [currentPath, setCurrentPath] = useState(initialPath)
    const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([])
    const [items, setItems] = useState<ContentItem[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Fetch directory contents
    useEffect(() => {
        async function fetchContents() {
            setLoading(true)
            setError(null)
            try {
                const data = await apps.listContents(installationId, owner, repo, currentPath || undefined)
                setBreadcrumbs(data.breadcrumbs)
                setItems(data.items)
            } catch {
                setError('Failed to load folder contents')
            } finally {
                setLoading(false)
            }
        }
        void fetchContents()
    }, [installationId, owner, repo, currentPath])

    // Navigate to folder
    const handleNavigate = (path: string) => {
        setCurrentPath(path)
    }

    // Select current folder
    const handleSelect = () => {
        onSelect(currentPath)
    }

    // Folder icon
    const FolderIcon = () => (
        <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
        </svg>
    )

    // File icon
    const FileIcon = () => (
        <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
    )

    // Chevron icon for folders
    const ChevronIcon = () => (
        <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
    )

    return (
        <div className="border rounded-lg bg-white overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b bg-neutral-50">
                <h3 className="font-medium text-sm">Browse Repository</h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                    Click folders to navigate, then click &quot;Select This Folder&quot; when ready
                </p>
            </div>

            {/* Breadcrumbs */}
            <div className="px-4 py-2 border-b bg-neutral-50 flex items-center gap-1 text-sm overflow-x-auto">
                {breadcrumbs.map((crumb, index) => (
                    <span key={crumb.path} className="flex items-center gap-1 whitespace-nowrap">
                        {index > 0 && <span className="text-neutral-400">/</span>}
                        <button
                            type="button"
                            onClick={() => handleNavigate(crumb.path)}
                            className={`hover:text-blue-600 hover:underline ${
                                index === breadcrumbs.length - 1 ? 'font-medium text-neutral-900' : 'text-neutral-600'
                            }`}
                        >
                            {crumb.name}
                        </button>
                    </span>
                ))}
            </div>

            {/* Content */}
            <div className="max-h-64 overflow-y-auto">
                {loading ? (
                    <div className="p-4 space-y-2">
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                    </div>
                ) : error ? (
                    <div className="p-4 text-sm text-red-600">{error}</div>
                ) : items.length === 0 ? (
                    <div className="p-4 text-sm text-neutral-500 text-center">
                        This folder is empty
                    </div>
                ) : (
                    <div className="divide-y">
                        {items.map((item) => (
                            <div key={item.path}>
                                {item.type === 'dir' ? (
                                    <button
                                        type="button"
                                        onClick={() => handleNavigate(item.path)}
                                        className="w-full px-4 py-2 flex items-center justify-between hover:bg-neutral-50 text-left"
                                    >
                                        <span className="flex items-center gap-3">
                                            <FolderIcon />
                                            <span className="text-sm font-medium">{item.name}</span>
                                        </span>
                                        <ChevronIcon />
                                    </button>
                                ) : (
                                    <div className="px-4 py-2 flex items-center gap-3 text-neutral-400">
                                        <FileIcon />
                                        <span className="text-sm">{item.name}</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t bg-neutral-50 flex items-center justify-between gap-3">
                <div className="text-xs text-neutral-500 truncate">
                    {currentPath ? (
                        <span>Current folder: <code className="bg-neutral-100 px-1 rounded">{currentPath}</code></span>
                    ) : (
                        <span>Viewing repository root</span>
                    )}
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button size="sm" onClick={handleSelect}>
                        {currentPath ? 'Select This Folder' : 'Use Repository Root'}
                    </Button>
                </div>
            </div>
        </div>
    )
}
