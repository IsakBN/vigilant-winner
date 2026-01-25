/**
 * Auth API Proxy - DEPRECATED
 *
 * This proxy is NO LONGER USED. Auth calls now go directly to api.bundlenudge.com.
 *
 * HISTORY: This proxy was created to make auth requests same-origin by stripping
 * the Domain attribute from Set-Cookie headers. However, this caused a critical bug:
 *
 * BUG: The API sets cookies with Domain=.bundlenudge.com for cross-subdomain support.
 * When this proxy stripped Domain, it created DUPLICATE cookies:
 * 1. Old: __Secure-better-auth.session_token with Domain=.bundlenudge.com
 * 2. New: __Secure-better-auth.session_token with NO Domain (first-party only)
 *
 * When the browser made requests to api.bundlenudge.com (for /admin/* routes),
 * it sent the OLD cookie (with .bundlenudge.com domain) because the new cookie
 * (no domain) was only sent to www.bundlenudge.com. This caused users to appear
 * logged in as the wrong user on admin routes.
 *
 * FIX: Auth client now calls api.bundlenudge.com directly with credentials: 'include'.
 * This ensures all cookies use Domain=.bundlenudge.com consistently.
 *
 * This file returns 410 Gone to catch any stale references to the old proxy.
 */

import { NextResponse } from 'next/server'

const DEPRECATION_MESSAGE = {
    error: 'Auth proxy deprecated',
    message: 'Auth calls now go directly to api.bundlenudge.com. If you see this, clear your cache and refresh.',
}

export async function GET() {
    return NextResponse.json(DEPRECATION_MESSAGE, { status: 410 })
}

export async function POST() {
    return NextResponse.json(DEPRECATION_MESSAGE, { status: 410 })
}

export async function PUT() {
    return NextResponse.json(DEPRECATION_MESSAGE, { status: 410 })
}

export async function DELETE() {
    return NextResponse.json(DEPRECATION_MESSAGE, { status: 410 })
}

export async function PATCH() {
    return NextResponse.json(DEPRECATION_MESSAGE, { status: 410 })
}

export async function OPTIONS() {
    return new NextResponse(null, { status: 204 })
}
