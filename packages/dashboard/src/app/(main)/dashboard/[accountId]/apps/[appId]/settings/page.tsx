'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Save, Trash2 } from 'lucide-react'
import { useApp, useUpdateApp, useDeleteApp, useRegenerateApiKey } from '@/hooks/useApp'
import { useHealthConfig } from '@/hooks/useHealthConfig'
import { ApiKeyManager } from '@/components/apps/ApiKeyManager'
import { HealthConfigEditor } from '@/components/apps/HealthConfigEditor'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

// ============================================================================
// Edit Name Section
// ============================================================================

function EditNameSection({
  currentName,
  isLoading,
  onSave,
  isSaving,
}: {
  currentName: string
  isLoading: boolean
  onSave: (name: string) => Promise<void>
  isSaving: boolean
}) {
  const [name, setName] = useState(currentName)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('App name is required')
      return
    }
    if (name.length < 2) {
      setError('App name must be at least 2 characters')
      return
    }
    setError(null)
    await onSave(name.trim())
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">App Name</CardTitle>
        <p className="text-sm text-neutral-500 mt-1">
          Update the display name for your app.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="app-name">Name</Label>
            <Input
              id="app-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My App"
              disabled={isSaving}
            />
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
          </div>
          <Button type="submit" disabled={isSaving || name === currentName}>
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// Danger Zone
// ============================================================================

function DangerZone({
  appName,
  onDelete,
  isDeleting,
}: {
  appName: string
  onDelete: () => Promise<void>
  isDeleting: boolean
}) {
  const [confirmText, setConfirmText] = useState('')
  const [showDialog, setShowDialog] = useState(false)

  const handleDelete = async () => {
    if (confirmText !== appName) return
    await onDelete()
  }

  return (
    <Card className="border-red-200">
      <CardHeader>
        <CardTitle className="text-lg text-red-700">Danger Zone</CardTitle>
        <p className="text-sm text-neutral-500 mt-1">
          Irreversible actions that will permanently affect your app.
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h4 className="font-medium text-neutral-900">Delete this app</h4>
            <p className="text-sm text-neutral-500 mt-1">
              Once deleted, all releases, devices, and data will be permanently removed.
              This action cannot be undone.
            </p>
          </div>
          <Button
            variant="destructive"
            onClick={() => setShowDialog(true)}
            disabled={isDeleting}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete App
          </Button>
        </div>

        <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription className="space-y-3">
                <p>
                  This will permanently delete <strong>{appName}</strong> and all of its data:
                </p>
                <ul className="list-disc list-inside text-sm space-y-1">
                  <li>All releases and their bundles</li>
                  <li>Device registrations and analytics</li>
                  <li>API keys and configurations</li>
                </ul>
                <p>
                  Type <strong>{appName}</strong> to confirm.
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="my-4">
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={appName}
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setConfirmText('')}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={confirmText !== appName || isDeleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {isDeleting ? 'Deleting...' : 'Delete App'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// Main Page
// ============================================================================

export default function AppSettingsPage() {
  const params = useParams()
  const router = useRouter()
  const appId = params.appId as string
  const accountId = params.accountId as string

  const { data: app, isLoading, error } = useApp(appId)
  const updateApp = useUpdateApp(appId)
  const deleteApp = useDeleteApp(appId)
  const regenerateKey = useRegenerateApiKey(appId)
  const healthConfig = useHealthConfig(appId)
  const [generatedApiKey, setGeneratedApiKey] = useState<string | null>(null)

  const handleUpdateName = async (name: string) => {
    await updateApp.mutateAsync({ name })
  }

  const handleDelete = async () => {
    await deleteApp.mutateAsync()
    router.push(`/dashboard/${accountId}`)
  }

  const handleRegenerateKey = async () => {
    const result = await regenerateKey.mutateAsync()
    setGeneratedApiKey(result.apiKey)
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg mb-4">
          Failed to load app settings
        </div>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    )
  }

  // Use generated key or app's existing key (may be masked)
  const displayApiKey = generatedApiKey ?? app?.apiKey ?? null

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Settings</h1>
        <p className="text-neutral-500 mt-1">Manage your app configuration</p>
      </div>

      {/* Edit Name */}
      <EditNameSection
        currentName={app?.name ?? ''}
        isLoading={isLoading}
        onSave={handleUpdateName}
        isSaving={updateApp.isPending}
      />

      {/* API Key Manager */}
      <ApiKeyManager
        apiKey={displayApiKey}
        isLoading={isLoading}
        isRegenerating={regenerateKey.isPending}
        onRegenerate={handleRegenerateKey}
      />

      {/* Health Config Editor */}
      <HealthConfigEditor
        config={healthConfig.config}
        isLoading={healthConfig.isLoading}
        isSaving={healthConfig.isSaving}
        onSave={healthConfig.saveConfig}
      />

      {/* Danger Zone */}
      <DangerZone
        appName={app?.name ?? ''}
        onDelete={handleDelete}
        isDeleting={deleteApp.isPending}
      />
    </div>
  )
}
