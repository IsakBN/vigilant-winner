'use client'

/**
 * Profile Settings Page
 *
 * User profile management including name, email, and password.
 */

import { useParams } from 'next/navigation'
import { useSession } from '@/lib/auth-client'
import {
    ProfileForm,
    ProfileSettingsSkeleton,
    DangerZone,
} from '@/components/settings'

export default function ProfileSettingsPage() {
    const params = useParams()
    const accountId = params.accountId as string
    const { isPending } = useSession()

    if (isPending) {
        return <ProfileSettingsSkeleton />
    }

    return (
        <div className="space-y-6">
            <ProfileForm accountId={accountId} />
            <DangerZone accountId={accountId} />
        </div>
    )
}
