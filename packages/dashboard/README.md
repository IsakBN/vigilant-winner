# @bundlenudge/dashboard

The BundleNudge management dashboard - a Next.js 15 application for managing OTA updates, releases, and teams.

## Tech Stack

| Technology | Purpose |
|------------|---------|
| Next.js 15 | React framework with App Router |
| React 19 | UI library |
| TanStack Query | Server state management |
| Tailwind CSS | Utility-first styling |
| shadcn/ui | Component primitives |
| Better Auth | Authentication |
| TypeScript | Type safety |
| Vitest | Testing |

## Directory Structure

```
packages/dashboard/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (main)/               # Main routes (authenticated + public)
│   │   │   ├── login/            # Email + OAuth login
│   │   │   ├── sign-up/          # Registration with OTP
│   │   │   ├── forgot-password/  # Password reset request
│   │   │   ├── reset-password/   # Password reset form
│   │   │   ├── verify-email/     # Email verification
│   │   │   ├── dashboard/        # Authenticated dashboard
│   │   │   │   └── [accountId]/  # Account-scoped pages
│   │   │   │       ├── apps/     # App management
│   │   │   │       ├── teams/    # Team management
│   │   │   │       └── settings/ # Account settings
│   │   │   └── admin/            # Admin panel
│   │   ├── api/                  # API routes
│   │   └── layout.tsx            # Root layout
│   ├── components/
│   │   ├── ui/                   # shadcn primitives
│   │   ├── apps/                 # App-related components
│   │   ├── releases/             # Release management
│   │   ├── channels/             # Channel management
│   │   ├── dashboard/            # Dashboard layout
│   │   ├── landing/              # Marketing pages
│   │   └── auth/                 # Auth components
│   ├── hooks/                    # Custom React hooks
│   │   ├── useApps.ts            # App data fetching
│   │   ├── useReleases.ts        # Release data
│   │   └── useChannels.ts        # Channel data
│   ├── lib/
│   │   ├── api/                  # API client
│   │   │   ├── client.ts         # Base fetch wrapper
│   │   │   ├── apps.ts           # Apps endpoints
│   │   │   ├── auth.ts           # Auth endpoints
│   │   │   └── channels.ts       # Channels endpoints
│   │   ├── auth-client.ts        # Better Auth client
│   │   └── utils.ts              # Utility functions
│   └── providers/
│       └── AuthProvider.tsx      # Auth context
├── public/                       # Static assets
├── package.json
├── tailwind.config.js
├── next.config.js
└── tsconfig.json
```

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 8+

### Installation

```bash
# From monorepo root
pnpm install

# Or from this package
cd packages/dashboard
pnpm install
```

### Development

```bash
# Start development server (port 3000)
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Run linter
pnpm lint

# Type check
pnpm typecheck

# Run tests
pnpm test
```

## Environment Variables

Create a `.env.local` file:

```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8787  # BundleNudge API URL

# Better Auth Configuration
BETTER_AUTH_SECRET=your-secret-key         # Session encryption key
BETTER_AUTH_URL=http://localhost:3000      # Dashboard URL

# GitHub OAuth (optional)
GITHUB_CLIENT_ID=your-client-id
GITHUB_CLIENT_SECRET=your-client-secret
```

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | URL of the BundleNudge API |
| `BETTER_AUTH_SECRET` | Yes | Secret key for session encryption |
| `BETTER_AUTH_URL` | Yes | Dashboard base URL |
| `GITHUB_CLIENT_ID` | No | GitHub OAuth app client ID |
| `GITHUB_CLIENT_SECRET` | No | GitHub OAuth app secret |

## Authentication Flows

### GitHub OAuth

1. User clicks "Continue with GitHub"
2. Redirect to GitHub authorization
3. Callback creates/updates user record
4. Session cookie set, redirect to dashboard

### Email/Password

1. **Sign Up**: Email + password + name
2. **Verify Email**: OTP code sent to email
3. **Login**: Email + password
4. **Password Reset**: Request link, set new password

### Auth API Client

```typescript
import { auth } from '@/lib/api/auth'

// Login with email
const result = await auth.login(email, password)

// Sign up
const result = await auth.signup(email, password, name)

// Verify email with OTP
await auth.verifyEmail(email, code)

// Request password reset
await auth.forgotPassword(email)

// Reset password with token
await auth.resetPassword(token, newPassword)
```

## Key Features

- **App Management**: Create, configure, and delete apps
- **Release Management**: Upload bundles, set rollout percentages
- **Channel Management**: Configure production, staging, beta channels
- **Device Tracking**: View registered devices and update status
- **Team Management**: Invite members, manage permissions
- **Build Management**: View build status, logs, artifacts
- **Billing**: Subscription management, usage tracking

## Component Architecture

### Page Components

Pages are thin wrappers that compose feature components:

```tsx
// src/app/(main)/dashboard/[accountId]/apps/page.tsx
export default function AppsPage() {
  return (
    <PageLayout>
      <PageHeader title="Apps" action={<CreateAppButton />} />
      <AppList />
    </PageLayout>
  )
}
```

### Feature Components

Feature components use hooks for data and compose UI components:

```tsx
// src/components/apps/AppList.tsx
export function AppList() {
  const { apps, isLoading, error } = useApps()

  if (isLoading) return <AppListSkeleton />
  if (error) return <ErrorState error={error} />
  if (apps.length === 0) return <EmptyAppState />

  return <AppGrid apps={apps} />
}
```

### Custom Hooks

Hooks wrap TanStack Query for data fetching:

```typescript
// src/hooks/useApps.ts
export function useApps() {
  return useQuery({
    queryKey: ['apps'],
    queryFn: () => api.apps.list(),
  })
}

export function useCreateApp() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateAppInput) => api.apps.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apps'] })
    },
  })
}
```

## API Integration

### Base Client

```typescript
// src/lib/api/client.ts
export async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!response.ok) {
    throw new ApiError(response.status, await response.text())
  }

  return response.json()
}
```

### Typed Endpoints

```typescript
// src/lib/api/apps.ts
export const apps = {
  list: () => apiFetch<App[]>('/apps'),
  get: (id: string) => apiFetch<App>(`/apps/${id}`),
  create: (data: CreateAppInput) =>
    apiFetch<App>('/apps', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: UpdateAppInput) =>
    apiFetch<App>(`/apps/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) =>
    apiFetch<void>(`/apps/${id}`, { method: 'DELETE' }),
}
```

## Deployment

### Vercel (Recommended)

1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy

```bash
# Manual deploy
npx vercel --prod
```

### Docker

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @bundlenudge/dashboard build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/packages/dashboard/.next/standalone ./
COPY --from=builder /app/packages/dashboard/.next/static ./.next/static
COPY --from=builder /app/packages/dashboard/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
```

### Self-Hosted

```bash
# Build
pnpm --filter @bundlenudge/dashboard build

# Start (requires Node.js)
pnpm --filter @bundlenudge/dashboard start
```

## Contributing

### Code Style

- Max 250 lines per file
- Max 50 lines per function
- One component per file
- Named exports only
- Colocate tests with source files

### Visual Guidelines

Avoid:
- Purple/blue gradients
- Floating decorative blobs
- Excessive shadows
- Glassmorphism effects
- Generic AI-style headlines

### Testing

```bash
# Run tests
pnpm test

# Watch mode
pnpm test --watch

# Coverage
pnpm test --coverage
```

## Dependencies

| Package | Purpose |
|---------|---------|
| `@bundlenudge/shared` | Shared types and schemas |
| `@tanstack/react-query` | Data fetching and caching |
| `better-auth` | Authentication |
| `lucide-react` | Icons |
| `tailwindcss` | Styling |
| `zod` | Runtime validation |

## License

BSL 1.1 - See LICENSE in repository root.
