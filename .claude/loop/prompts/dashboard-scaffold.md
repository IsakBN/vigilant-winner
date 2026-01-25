# Feature: dashboard/scaffold

Scaffold the Next.js 15 dashboard with App Router.

## Knowledge Docs to Read First

- `.claude/knowledge/API_FEATURES.md` → Full API reference
- `.claude/knowledge/IMPLEMENTATION_DETAILS.md` → Auth flows

## Dependencies

- None (first dashboard feature)

## What to Implement

### 1. Initialize Next.js Project

```bash
# In packages/dashboard/
pnpm create next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*"
```

### 2. Package.json

```json
{
  "name": "dashboard",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@tanstack/react-query": "^5.0.0",
    "react-hook-form": "^7.0.0",
    "@hookform/resolvers": "^3.0.0",
    "zod": "^3.0.0"
  }
}
```

### 3. Directory Structure

```
packages/dashboard/
├── app/
│   ├── (auth)/
│   │   ├── sign-in/
│   │   │   └── page.tsx
│   │   ├── sign-up/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   │   └── [accountId]/
│   │   │       ├── page.tsx
│   │   │       ├── apps/
│   │   │       ├── billing/
│   │   │       ├── teams/
│   │   │       └── settings/
│   │   └── layout.tsx
│   ├── admin/
│   │   ├── page.tsx
│   │   └── layout.tsx
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/           # shadcn/ui
│   ├── layout/       # Nav, Sidebar, Header
│   └── forms/        # Form components
├── lib/
│   ├── api/          # API client
│   ├── auth.ts       # Auth helpers
│   └── utils.ts
├── hooks/
│   └── use-*.ts
├── next.config.js
├── tailwind.config.ts
└── tsconfig.json
```

### 4. Root Layout

```tsx
// app/layout.tsx
import { Inter } from 'next/font/google'
import { QueryProvider } from '@/lib/query-provider'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'BundleNudge',
  description: 'OTA updates for React Native',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  )
}
```

### 5. TanStack Query Provider

```tsx
// lib/query-provider.tsx
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,  // 1 minute
        refetchOnWindowFocus: false,
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
```

### 6. Environment Variables

```
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8787
```

### 7. API Client Base

```typescript
// lib/api/client.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.bundlenudge.com'

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',  // Include cookies for auth
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || `API error: ${response.status}`)
  }

  return response.json()
}
```

### 8. Auth Placeholder Layout

```tsx
// app/(auth)/layout.tsx
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8">
        {children}
      </div>
    </div>
  )
}
```

### 9. Dashboard Placeholder Layout

```tsx
// app/(dashboard)/layout.tsx
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
```

### 10. Install shadcn/ui

```bash
pnpm dlx shadcn@latest init
pnpm dlx shadcn@latest add button card input label form
```

## Files to Create

1. `app/layout.tsx` - Root layout
2. `app/page.tsx` - Landing/redirect
3. `app/(auth)/layout.tsx` - Auth layout
4. `app/(auth)/sign-in/page.tsx` - Placeholder
5. `app/(auth)/sign-up/page.tsx` - Placeholder
6. `app/(dashboard)/layout.tsx` - Dashboard layout
7. `app/(dashboard)/dashboard/[accountId]/page.tsx` - Placeholder
8. `lib/query-provider.tsx` - TanStack Query
9. `lib/api/client.ts` - API client
10. `lib/utils.ts` - Utilities (cn function)
11. `components/layout/sidebar.tsx` - Placeholder
12. `components/layout/header.tsx` - Placeholder

## Tests Required

1. Build succeeds
2. TypeScript compiles
3. Root layout renders
4. Route groups work

## Acceptance Criteria

- [ ] Next.js 15 with App Router
- [ ] React 19 configured
- [ ] TanStack Query provider
- [ ] Tailwind CSS working
- [ ] shadcn/ui installed
- [ ] Route groups: (auth), (dashboard), admin
- [ ] API client base created
- [ ] Build passes
- [ ] TypeScript passes
