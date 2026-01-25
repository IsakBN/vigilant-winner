/**
 * Server-Side Authentication Utilities
 *
 * Provides session validation on the server for Next.js Server Components.
 * This prevents any "flash" of protected content before redirect.
 */

import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'

interface AuthUser {
    id: string
    email: string
    name: string | null
    image: string | null
}

interface SessionResponse {
    user?: {
        id: string
        email: string
        name?: string | null
        image?: string | null
    } | null
}

/**
 * Get the base URL for API requests from server-side code.
 *
 * In production, auth is proxied through Next.js at /api/auth/*,
 * so we need to use the current host to build an absolute URL.
 *
 * Falls back to NEXT_PUBLIC_API_URL if set, otherwise uses the request host.
 */
async function getAuthBaseUrl(): Promise<string> {
    // If API URL is explicitly set, use it
    const apiUrl = process.env.NEXT_PUBLIC_API_URL
    if (apiUrl) {
        return apiUrl
    }

    // Otherwise, build URL from the request headers (for same-origin proxy)
    const headersList = await headers()
    const host = headersList.get('host')
    const protocol = headersList.get('x-forwarded-proto') || 'https'

    if (host) {
        return `${protocol}://${host}`
    }

    // Last resort fallback for local development
    return 'http://localhost:3000'
}

/**
 * Require authentication on the server side.
 * Call this in Server Components or layouts to validate session before rendering.
 *
 * @returns The authenticated user object
 * @throws Redirects to /login if not authenticated
 */
export async function requireServerAuth(): Promise<AuthUser> {
    const cookieStore = await cookies()

    // Check for Better-Auth session cookie
    // In production with secure cookies, the prefix is __Secure-
    // In development, it's just better-auth
    const sessionCookie =
        cookieStore.get('__Secure-better-auth.session_token') ||
        cookieStore.get('better-auth.session_token')

    if (!sessionCookie?.value) {
        redirect('/login')
    }

    // Validate session with API
    // We need to forward the cookie to the API for validation
    const baseUrl = await getAuthBaseUrl()
    const response = await fetch(`${baseUrl}/api/auth/get-session`, {
        headers: {
            'Cookie': `${sessionCookie.name}=${sessionCookie.value}`,
        },
        cache: 'no-store', // Always validate fresh
    })

    if (!response.ok) {
        redirect('/login')
    }

    const data = await response.json() as SessionResponse

    if (!data.user) {
        redirect('/login')
    }

    return {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name ?? null,
        image: data.user.image ?? null,
    }
}

/**
 * Get the current user if authenticated, or null if not.
 * Use this when you want to check auth without redirecting.
 *
 * @returns The authenticated user object or null
 */
export async function getServerUser(): Promise<AuthUser | null> {
    const cookieStore = await cookies()

    const sessionCookie =
        cookieStore.get('__Secure-better-auth.session_token') ||
        cookieStore.get('better-auth.session_token')

    if (!sessionCookie?.value) {
        return null
    }

    const baseUrl = await getAuthBaseUrl()
    const response = await fetch(`${baseUrl}/api/auth/get-session`, {
        headers: {
            'Cookie': `${sessionCookie.name}=${sessionCookie.value}`,
        },
        cache: 'no-store',
    })

    if (!response.ok) {
        return null
    }

    const data = await response.json() as SessionResponse

    if (!data.user) {
        return null
    }

    return {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name ?? null,
        image: data.user.image ?? null,
    }
}

/**
 * Check if user is admin (has @bundlenudge.com email)
 */
export function isServerAdmin(user: AuthUser | null): boolean {
    return user?.email?.endsWith('@bundlenudge.com') ?? false
}
