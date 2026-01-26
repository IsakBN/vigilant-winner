'use client'

/**
 * Admin Organization Detail Page
 *
 * Displays detailed organization information with members, apps, and admin actions.
 */

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui'
import { OrgDetail } from '@/components/admin'

export default function AdminOrganizationDetailPage() {
    const params = useParams<{ orgId: string }>()
    const orgId = params.orgId

    return (
        <>
            <BackLink />
            <OrgDetail orgId={orgId} />
        </>
    )
}

function BackLink() {
    return (
        <div className="mb-6">
            <Link href="/admin/organizations">
                <Button variant="ghost" size="sm">
                    ← Back to Organizations
                </Button>
            </Link>
        </div>
    )
}
