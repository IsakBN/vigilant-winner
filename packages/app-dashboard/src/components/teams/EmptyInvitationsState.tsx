'use client'

/**
 * EmptyInvitationsState Component
 *
 * Empty state displayed when there are no pending invitations.
 */

import { Mail } from 'lucide-react'

export function EmptyInvitationsState() {
    return (
        <div className="text-center py-12 border rounded-lg bg-neutral-50/50">
            <div className="mx-auto w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
                <Mail className="w-6 h-6 text-neutral-400" />
            </div>
            <p className="text-neutral-600 font-medium">No pending invitations</p>
            <p className="text-sm text-neutral-500 mt-1">
                Use the form to invite team members by email.
            </p>
        </div>
    )
}
