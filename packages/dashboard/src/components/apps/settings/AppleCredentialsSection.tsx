'use client'

/**
 * AppleCredentialsSection Component
 *
 * Handles Apple App Store Connect credential management.
 */

import { useState } from 'react'
import { Check, Trash2, Plus, Shield, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
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
import { useToast } from '@/components/ui/toast'
import {
    useCredentials,
    useCreateCredential,
    useDeleteCredential,
    useVerifyCredential,
} from '@/hooks/useCredentials'

// =============================================================================
// Types
// =============================================================================

interface AppleCredentialsSectionProps {
    accountId: string
    appId: string
}

// =============================================================================
// Helpers
// =============================================================================

function formatDate(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    })
}

// =============================================================================
// Component
// =============================================================================

export function AppleCredentialsSection({
    accountId,
    appId,
}: AppleCredentialsSectionProps) {
    const { toast } = useToast()
    const { data, isLoading } = useCredentials(accountId, appId)
    const createCredential = useCreateCredential(accountId, appId)
    const deleteCredential = useDeleteCredential(accountId, appId)
    const verifyCredential = useVerifyCredential(accountId, appId)

    const [dialogOpen, setDialogOpen] = useState(false)
    const [deleteId, setDeleteId] = useState<string | null>(null)
    const [verifyingId, setVerifyingId] = useState<string | null>(null)
    const [form, setForm] = useState({
        name: '',
        issuerId: '',
        keyId: '',
        teamId: '',
        privateKey: '',
    })

    const credentials = data?.credentials ?? []

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = (event) => {
            const content = event.target?.result as string
            setForm({ ...form, privateKey: content })
        }
        reader.readAsText(file)
    }

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.name || !form.issuerId || !form.keyId || !form.teamId || !form.privateKey) {
            return
        }

        try {
            await createCredential.mutateAsync(form)
            setForm({ name: '', issuerId: '', keyId: '', teamId: '', privateKey: '' })
            setDialogOpen(false)
            toast({ title: 'Credential added', variant: 'success' })
        } catch {
            toast({ title: 'Failed to add credential', variant: 'error' })
        }
    }

    const handleDelete = async () => {
        if (!deleteId) return
        try {
            await deleteCredential.mutateAsync(deleteId)
            setDeleteId(null)
            toast({ title: 'Credential deleted', variant: 'success' })
        } catch {
            toast({ title: 'Failed to delete credential', variant: 'error' })
        }
    }

    const handleVerify = async (credentialId: string) => {
        setVerifyingId(credentialId)
        try {
            const result = await verifyCredential.mutateAsync(credentialId)
            if (result.valid) {
                toast({
                    title: 'Credential verified',
                    description: result.teamName
                        ? `Team: ${result.teamName}`
                        : 'Ready for use',
                    variant: 'success',
                })
            } else {
                toast({
                    title: 'Verification failed',
                    description: result.error ?? 'Unknown error',
                    variant: 'error',
                })
            }
        } catch {
            toast({ title: 'Failed to verify', variant: 'error' })
        } finally {
            setVerifyingId(null)
        }
    }

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-40" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-24 w-full" />
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-lg">Apple Credentials</CardTitle>
                        <p className="text-sm text-neutral-500 mt-1">
                            Manage App Store Connect API keys for iOS builds
                        </p>
                    </div>
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm">
                                <Plus className="w-4 h-4 mr-2" />
                                Add Credential
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg">
                            <form onSubmit={handleCreate}>
                                <DialogHeader>
                                    <DialogTitle>Add Apple Credential</DialogTitle>
                                    <DialogDescription>
                                        Add your App Store Connect API key
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="cred-name">Name</Label>
                                        <Input
                                            id="cred-name"
                                            placeholder="Production Key"
                                            value={form.name}
                                            onChange={(e) =>
                                                setForm({ ...form, name: e.target.value })
                                            }
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="issuer-id">Issuer ID</Label>
                                            <Input
                                                id="issuer-id"
                                                placeholder="xxxxxxxx-xxxx-xxxx-xxxx"
                                                value={form.issuerId}
                                                onChange={(e) =>
                                                    setForm({ ...form, issuerId: e.target.value })
                                                }
                                                className="font-mono text-xs"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="key-id">Key ID</Label>
                                            <Input
                                                id="key-id"
                                                placeholder="XXXXXXXXXX"
                                                value={form.keyId}
                                                onChange={(e) =>
                                                    setForm({ ...form, keyId: e.target.value })
                                                }
                                                className="font-mono"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="team-id">Team ID</Label>
                                        <Input
                                            id="team-id"
                                            placeholder="XXXXXXXXXX"
                                            value={form.teamId}
                                            onChange={(e) =>
                                                setForm({ ...form, teamId: e.target.value })
                                            }
                                            className="font-mono"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Private Key (.p8 file)</Label>
                                        <Input
                                            type="file"
                                            accept=".p8"
                                            onChange={handleFileUpload}
                                            className="text-sm"
                                        />
                                        {form.privateKey && (
                                            <div className="text-xs text-green-600 flex items-center gap-1">
                                                <Check className="w-4 h-4" />
                                                Key file loaded
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setDialogOpen(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={
                                            createCredential.isPending ||
                                            !form.name ||
                                            !form.issuerId ||
                                            !form.keyId ||
                                            !form.teamId ||
                                            !form.privateKey
                                        }
                                    >
                                        {createCredential.isPending ? 'Adding...' : 'Add'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardHeader>
            <CardContent>
                {/* Info Box */}
                <div className="bg-neutral-50 border border-neutral-200 p-4 mb-4 rounded-lg">
                    <h4 className="font-medium text-neutral-900 mb-2">
                        Where to find your credentials
                    </h4>
                    <ol className="text-sm text-neutral-600 space-y-1 list-decimal list-inside">
                        <li>
                            Go to{' '}
                            <a
                                href="https://appstoreconnect.apple.com/access/integrations"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-neutral-900 underline"
                            >
                                App Store Connect &rarr; Integrations
                            </a>
                        </li>
                        <li>Click + to create a new API key</li>
                        <li>Download the .p8 file (only available once)</li>
                        <li>Copy the Issuer ID, Key ID, and Team ID</li>
                    </ol>
                </div>

                {credentials.length === 0 ? (
                    <div className="py-8 text-center">
                        <div className="w-12 h-12 mx-auto mb-4 bg-neutral-100 rounded-lg flex items-center justify-center">
                            <Shield className="w-6 h-6 text-neutral-400" />
                        </div>
                        <h4 className="font-semibold text-neutral-900 mb-2">
                            No credentials added
                        </h4>
                        <p className="text-sm text-neutral-500 mb-4">
                            Add Apple credentials to sign builds for distribution.
                        </p>
                        <Button onClick={() => setDialogOpen(true)}>
                            Add First Credential
                        </Button>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Key ID</TableHead>
                                <TableHead>Team</TableHead>
                                <TableHead>Added</TableHead>
                                <TableHead className="w-[100px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {credentials.map((credential) => (
                                <TableRow key={credential.id}>
                                    <TableCell className="font-medium">
                                        {credential.name}
                                    </TableCell>
                                    <TableCell className="font-mono text-sm text-neutral-600">
                                        {credential.keyId}
                                    </TableCell>
                                    <TableCell>
                                        <span className="font-mono text-sm text-neutral-600">
                                            {credential.teamId}
                                        </span>
                                        {credential.teamName && (
                                            <span className="text-xs text-neutral-400 block">
                                                {credential.teamName}
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-sm text-neutral-500">
                                        {formatDate(credential.createdAt)}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleVerify(credential.id)}
                                                disabled={verifyingId === credential.id}
                                                className="text-neutral-400 hover:text-neutral-900 disabled:opacity-50"
                                                title="Verify credential"
                                            >
                                                {verifyingId === credential.id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Check className="w-4 h-4" />
                                                )}
                                            </button>
                                            <button
                                                onClick={() => setDeleteId(credential.id)}
                                                className="text-neutral-400 hover:text-red-600"
                                                title="Delete credential"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>

            <AlertDialog open={Boolean(deleteId)} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Credential?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Any builds using this credential will fail. This action cannot
                            be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {deleteCredential.isPending ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    )
}
