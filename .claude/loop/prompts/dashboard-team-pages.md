# Feature: dashboard/team-pages

Implement team management pages.

## Knowledge Docs to Read First

- `.claude/knowledge/IMPLEMENTATION_DETAILS.md` → Team invite flow
- `.claude/knowledge/CODEBASE_DEEP_DIVE.md` → Dashboard components

## Dependencies

- `dashboard/scaffold` (must complete first)
- `dashboard/api-client` (must complete first)
- `api/teams-crud` (must complete first)
- `api/teams-invitations` (must complete first)

## What to Implement

### 1. Teams Page

```tsx
// app/(dashboard)/dashboard/[accountId]/teams/page.tsx
'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { PlusIcon } from 'lucide-react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { CreateTeamDialog } from '@/components/teams/CreateTeamDialog'
import Link from 'next/link'

export default function TeamsPage({ params }: { params: { accountId: string } }) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['teams'],
    queryFn: () => api.teams.list(),
  })

  if (isLoading) {
    return <TeamsPageSkeleton />
  }

  const teams = data?.teams || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Teams</h1>
          <p className="text-gray-500">Collaborate with your team</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <PlusIcon className="mr-2 h-4 w-4" />
          New Team
        </Button>
      </div>

      {teams.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <h3 className="text-lg font-medium">No teams yet</h3>
            <p className="text-gray-500 mt-1">Create a team to collaborate with others</p>
            <Button className="mt-4" onClick={() => setCreateDialogOpen(true)}>
              <PlusIcon className="mr-2 h-4 w-4" />
              Create Team
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {teams.map(team => (
            <Link key={team.id} href={`/dashboard/${params.accountId}/teams/${team.id}`}>
              <Card className="hover:border-blue-500 hover:shadow-md transition-all cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {team.name}
                    <Badge variant={team.role === 'owner' ? 'default' : 'secondary'}>
                      {team.role}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    {team.memberCount} member{team.memberCount !== 1 ? 's' : ''}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <CreateTeamDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </div>
  )
}
```

### 2. Team Detail Page

```tsx
// app/(dashboard)/dashboard/[accountId]/teams/[teamId]/page.tsx
'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { InviteMemberDialog } from '@/components/teams/InviteMemberDialog'
import { formatDistanceToNow } from 'date-fns'
import { PlusIcon, TrashIcon } from 'lucide-react'

export default function TeamDetailPage({ params }: { params: { accountId: string; teamId: string } }) {
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const queryClient = useQueryClient()

  const { data: teamData } = useQuery({
    queryKey: ['teams', params.teamId],
    queryFn: () => api.teams.get(params.teamId),
  })

  const { data: membersData } = useQuery({
    queryKey: ['team-members', params.teamId],
    queryFn: () => api.teams.listMembers(params.teamId),
  })

  const { data: invitationsData } = useQuery({
    queryKey: ['team-invitations', params.teamId],
    queryFn: () => api.teams.listInvitations(params.teamId),
  })

  const updateRoleMutation = useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: string }) =>
      api.teams.updateMemberRole(params.teamId, memberId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members', params.teamId] })
    },
  })

  const removeMemberMutation = useMutation({
    mutationFn: (memberId: string) =>
      api.teams.removeMember(params.teamId, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members', params.teamId] })
    },
  })

  const cancelInvitationMutation = useMutation({
    mutationFn: (invitationId: string) =>
      api.teams.cancelInvitation(params.teamId, invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-invitations', params.teamId] })
    },
  })

  const team = teamData?.team
  const members = membersData?.members || []
  const invitations = invitationsData?.invitations.filter(i => i.status === 'pending') || []
  const canManage = team?.role === 'owner' || team?.role === 'admin'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{team?.name}</h1>
          <p className="text-gray-500">
            You are {team?.role === 'owner' ? 'the owner' : `a ${team?.role}`}
          </p>
        </div>
        {canManage && (
          <Button onClick={() => setInviteDialogOpen(true)}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Invite Member
          </Button>
        )}
      </div>

      <Tabs defaultValue="members">
        <TabsList>
          <TabsTrigger value="members">Members ({members.length})</TabsTrigger>
          {invitations.length > 0 && (
            <TabsTrigger value="pending">Pending ({invitations.length})</TabsTrigger>
          )}
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="mt-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  {canManage && <TableHead className="w-20"></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map(member => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-gray-500">{member.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {canManage && member.role !== 'owner' ? (
                        <Select
                          value={member.role}
                          onValueChange={(role) => updateRoleMutation.mutate({ memberId: member.id, role })}
                        >
                          <SelectTrigger className="w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="member">Member</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant={member.role === 'owner' ? 'default' : 'secondary'}>
                          {member.role}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-gray-500">
                      {formatDistanceToNow(new Date(member.createdAt), { addSuffix: true })}
                    </TableCell>
                    {canManage && (
                      <TableCell>
                        {member.role !== 'owner' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeMemberMutation.mutate(member.id)}
                          >
                            <TrashIcon className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {invitations.length > 0 && (
          <TabsContent value="pending" className="mt-4">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Sent</TableHead>
                    <TableHead>Expires</TableHead>
                    {canManage && <TableHead className="w-20"></TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invitations.map(invitation => (
                    <TableRow key={invitation.id}>
                      <TableCell>{invitation.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{invitation.role}</Badge>
                      </TableCell>
                      <TableCell className="text-gray-500">
                        {formatDistanceToNow(new Date(invitation.createdAt), { addSuffix: true })}
                      </TableCell>
                      <TableCell className="text-gray-500">
                        {formatDistanceToNow(new Date(invitation.expiresAt), { addSuffix: true })}
                      </TableCell>
                      {canManage && (
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => cancelInvitationMutation.mutate(invitation.id)}
                          >
                            Cancel
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="settings" className="mt-4">
          <TeamSettings team={team} canManage={canManage} />
        </TabsContent>
      </Tabs>

      <InviteMemberDialog
        teamId={params.teamId}
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
      />
    </div>
  )
}
```

### 3. Invite Member Dialog

```tsx
// components/teams/InviteMemberDialog.tsx
'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { api } from '@/lib/api'

const inviteSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'member']),
})

type InviteData = z.infer<typeof inviteSchema>

interface InviteMemberDialogProps {
  teamId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function InviteMemberDialog({ teamId, open, onOpenChange }: InviteMemberDialogProps) {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const queryClient = useQueryClient()

  const { register, handleSubmit, setValue, watch, formState: { errors }, reset } = useForm<InviteData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { role: 'member' },
  })

  const inviteMutation = useMutation({
    mutationFn: (data: InviteData) => api.teams.inviteMember(teamId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-invitations', teamId] })
      setSuccess(true)
      reset()
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Failed to send invitation')
    },
  })

  const onSubmit = (data: InviteData) => {
    setError(null)
    setSuccess(false)
    inviteMutation.mutate(data)
  }

  const handleClose = () => {
    onOpenChange(false)
    setError(null)
    setSuccess(false)
    reset()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Team Member</DialogTitle>
          <DialogDescription>
            Send an invitation to join your team
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 text-green-700 rounded-lg">
              Invitation sent! They'll receive an email with instructions to join.
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose}>Close</Button>
              <Button onClick={() => setSuccess(false)}>Invite Another</Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="colleague@example.com"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={watch('role')}
                onValueChange={(value) => setValue('role', value as 'admin' | 'member')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">
                    <div>
                      <p className="font-medium">Member</p>
                      <p className="text-xs text-gray-500">Can view and work on projects</p>
                    </div>
                  </SelectItem>
                  <SelectItem value="admin">
                    <div>
                      <p className="font-medium">Admin</p>
                      <p className="text-xs text-gray-500">Can manage team members and settings</p>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={inviteMutation.isPending}>
                {inviteMutation.isPending ? 'Sending...' : 'Send Invitation'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
```

## Files to Create

1. `app/(dashboard)/dashboard/[accountId]/teams/page.tsx`
2. `app/(dashboard)/dashboard/[accountId]/teams/[teamId]/page.tsx`
3. `components/teams/CreateTeamDialog.tsx`
4. `components/teams/InviteMemberDialog.tsx`
5. `components/teams/TeamSettings.tsx`

## Acceptance Criteria

- [ ] Teams list with role badges
- [ ] Create team dialog
- [ ] Team detail with tabs
- [ ] Members table with role management
- [ ] Pending invitations list
- [ ] Invite member dialog
- [ ] Role select dropdown
- [ ] Remove member with confirmation
- [ ] Cancel invitation
