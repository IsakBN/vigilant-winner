'use client'

/**
 * Admin Organizations Page
 *
 * Lists all organizations with search, filtering, and quick actions.
 */

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { OrgTable } from '@/components/admin'

export default function AdminOrganizationsPage() {
    const router = useRouter()

    const handleOrgClick = useCallback(
        (orgId: string) => {
            router.push(`/admin/organizations/${orgId}`)
        },
        [router]
    )

    return (
        <>
            <PageHeader />
            <OrgTable onOrgClick={handleOrgClick} />
        </>
    )
}

function PageHeader() {
    return (
        <div className="mb-8">
            <h1 className="text-2xl font-bold text-text-dark font-heading">
                Organizations
            </h1>
            <p className="text-text-light mt-1">
                Manage organizations, view details, and perform admin actions.
            </p>
        </div>
    )
}
