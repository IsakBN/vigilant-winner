# @bundlenudge/dashboard

## Purpose

Next.js 15 management dashboard for BundleNudge. Provides UI for managing apps, releases, channels, viewing analytics, and team management.

## Reference

```
/Users/isaks_macbook/Desktop/Dev/codepush/packages/dashboard-v2
```

## Tech Stack

- Next.js 15 (App Router)
- React 19
- TanStack Query (data fetching)
- Tailwind CSS (styling)
- shadcn/ui (components)
- TypeScript (strict mode)
- Vitest (testing)

## Directory Structure

```
packages/dashboard/
├── src/
│   ├── app/
│   │   ├── (auth)/           # Auth pages
│   │   │   ├── login/
│   │   │   └── signup/
│   │   ├── (main)/           # Authenticated pages
│   │   │   └── dashboard/
│   │   │       ├── page.tsx
│   │   │       ├── apps/
│   │   │       ├── releases/
│   │   │       └── settings/
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/               # shadcn primitives
│   │   ├── apps/             # App components
│   │   ├── releases/         # Release components
│   │   └── shared/           # Cross-feature
│   ├── hooks/
│   │   ├── useApps.ts
│   │   ├── useReleases.ts
│   │   └── useAuth.ts
│   └── lib/
│       ├── api/              # API client
│       └── utils.ts
├── package.json
└── CLAUDE.md
```

## DO's

### Code Style

- Max 250 lines per file
- Max 50 lines per function
- One component per file
- Named exports only
- Colocated tests

### Patterns

```tsx
// ✅ Page component - thin wrapper
export default function AppsPage() {
  return (
    <PageLayout>
      <PageHeader title="Apps" />
      <AppList />
    </PageLayout>
  );
}

// ✅ Feature component with hook
export function AppList() {
  const { apps, isLoading, error } = useApps();

  if (isLoading) return <AppListSkeleton />;
  if (error) return <ErrorState error={error} />;

  return <AppGrid apps={apps} />;
}

// ✅ Custom hook with TanStack Query
export function useApps() {
  return useQuery({
    queryKey: ['apps'],
    queryFn: () => api.apps.list(),
  });
}

// ✅ API client
export const api = {
  apps: {
    list: () => fetch('/api/apps').then(r => r.json()),
    create: (data) => fetch('/api/apps', { method: 'POST', body: JSON.stringify(data) }),
  },
};
```

## DON'Ts

### Visual Anti-Patterns

```tsx
// ❌ THE FORBIDDEN GRADIENT
className="bg-gradient-to-r from-purple-600 to-blue-500"

// ❌ Floating decorative blobs
<div className="absolute -top-40 bg-purple-500/30 blur-3xl" />

// ❌ Glassmorphism everywhere
className="backdrop-blur-lg bg-white/10"

// ❌ Everything centered
<main className="text-center">

// ❌ Identical card grids everywhere
{items.map(item => (
  <div className="bg-white rounded-2xl p-6 shadow-lg">

// ❌ Generic AI headlines
<h1>Build Amazing Things</h1>

// ❌ Excessive shadows
className="shadow-lg"  // On every element
```

### Code Anti-Patterns

```tsx
// ❌ Monolith page components
export default function AppsPage() {
  const [apps, setApps] = useState([]);
  // ... 300 lines of logic
}

// ❌ Inline fetch in components
useEffect(() => {
  fetch('/api/apps').then(r => r.json()).then(setApps);
}, []);

// ❌ No loading/error states
return <AppGrid apps={apps} />;
```

## Key Files

| File | Purpose |
|------|---------|
| `src/app/(main)/dashboard/page.tsx` | Dashboard home |
| `src/app/(main)/dashboard/apps/page.tsx` | Apps list |
| `src/components/apps/AppCard.tsx` | App card component |
| `src/hooks/useApps.ts` | Apps data hook |
| `src/lib/api/apps.ts` | Apps API client |

## Commands

```bash
# Development
pnpm --filter dashboard dev

# Build
pnpm --filter dashboard build

# Test
pnpm --filter dashboard test
```

## Dependencies

- `@bundlenudge/shared` - Types and schemas
- `next` - Framework
- `@tanstack/react-query` - Data fetching
- `tailwindcss` - Styling

## Testing

- Framework: Vitest + Testing Library
- Test components with mock data
- Test hooks with QueryClient wrapper

## Notes

- Keep pages thin (< 150 lines)
- Extract logic to hooks
- Use TanStack Query for all API calls
- Follow shadcn patterns for UI
