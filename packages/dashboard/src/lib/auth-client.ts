/**
 * Better-Auth Client
 *
 * Provides authentication methods for the dashboard.
 *
 * IMPORTANT: Auth calls go DIRECTLY to the API (not through a proxy)
 * to ensure cookies are set with Domain=.bundlenudge.com consistently.
 *
 * This is critical because:
 * 1. API sets cookies with Domain=.bundlenudge.com for cross-subdomain support
 * 2. A proxy would strip Domain, creating duplicate cookies
 * 3. Duplicate cookies cause session confusion (wrong user on admin routes)
 */

import { createAuthClient } from 'better-auth/react'
import { emailOTPClient } from 'better-auth/client/plugins'

/**
 * Get the API URL for auth calls
 * In production: https://api.bundlenudge.com
 * In development: http://localhost:8787
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787'

/**
 * Better-Auth client instance
 *
 * Uses API URL directly (not proxy) to ensure consistent cookie domain.
 * The API sets cookies with Domain=.bundlenudge.com which works across all subdomains.
 */
export const authClient = createAuthClient({
    baseURL: API_URL,
    basePath: '/api/auth',
    fetchOptions: {
        credentials: 'include', // Required for cross-origin cookies
    },
    plugins: [
        emailOTPClient(),
    ],
})

/**
 * Export auth methods for convenience
 * Note: authClient is already exported above for advanced usage (e.g., disabling cookie cache)
 */
export const {
    signIn,
    signUp,
    signOut,
    useSession,
    getSession,
    emailOtp,
} = authClient

/**
 * Sign in with email and password
 */
export async function signInWithEmail(email: string, password: string) {
    return signIn.email({ email, password })
}

/**
 * Sign up with email and password
 */
export async function signUpWithEmail(name: string, email: string, password: string) {
    return signUp.email({ name, email, password })
}

/**
 * Sign in with GitHub OAuth
 * @param callbackURL - Full absolute URL to redirect to after OAuth completes (e.g., https://app.bundlenudge.com/dashboard)
 */
export async function signInWithGitHub(callbackURL?: string) {
    // The callbackURL should already be an absolute URL from the caller
    // If not provided, build one from the current origin
    const finalCallbackURL = callbackURL || (typeof window !== 'undefined'
        ? `${window.location.origin}/dashboard`
        : 'https://www.bundlenudge.com/dashboard')

    return signIn.social({
        provider: 'github',
        callbackURL: finalCallbackURL,
    })
}

/**
 * Sign out the current user
 */
export async function signOutUser() {
    return signOut()
}

/**
 * Check if the user is an admin (has @bundlenudge.com email)
 */
export function isAdmin(email: string | null | undefined): boolean {
    return email?.endsWith('@bundlenudge.com') ?? false
}
