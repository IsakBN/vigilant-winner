'use client'

/**
 * ProfileForm Component
 *
 * Combined profile and password edit forms.
 * This is a wrapper that composes ProfileInfoForm and PasswordChangeForm.
 */

import { ProfileInfoForm } from './ProfileInfoForm'
import { PasswordChangeForm } from './PasswordChangeForm'

interface ProfileFormProps {
    accountId: string
}

export function ProfileForm({ accountId }: ProfileFormProps) {
    return (
        <div className="space-y-6">
            <ProfileInfoForm accountId={accountId} />
            <PasswordChangeForm />
        </div>
    )
}
