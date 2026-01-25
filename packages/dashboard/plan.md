# Dashboard Package Plan

## Overview

Next.js 15 management dashboard with React 19, TanStack Query, and Tailwind CSS. Provides UI for managing apps, releases, channels, and settings.

## Phase 1: Foundation

- [ ] package.json
- [ ] next.config.js
- [ ] tsconfig.json
- [ ] tailwind.config.js
- [ ] src/app/layout.tsx
- [ ] src/app/page.tsx (redirect to dashboard)

## Phase 2: UI Components (shadcn)

- [ ] src/components/ui/button.tsx
- [ ] src/components/ui/card.tsx
- [ ] src/components/ui/input.tsx
- [ ] src/components/ui/form.tsx
- [ ] src/components/ui/table.tsx
- [ ] src/components/ui/dialog.tsx
- [ ] src/components/ui/dropdown-menu.tsx
- [ ] src/components/ui/skeleton.tsx

## Phase 3: Shared Components

- [ ] src/components/shared/PageLayout.tsx
- [ ] src/components/shared/PageHeader.tsx
- [ ] src/components/shared/ErrorState.tsx
- [ ] src/components/shared/EmptyState.tsx
- [ ] src/components/shared/LoadingState.tsx

## Phase 4: API Layer

- [ ] src/lib/api/client.ts (base client)
- [ ] src/lib/api/apps.ts
- [ ] src/lib/api/releases.ts
- [ ] src/lib/api/channels.ts
- [ ] src/lib/api/auth.ts

## Phase 5: Hooks

- [ ] src/hooks/useApps.ts
- [ ] src/hooks/useReleases.ts
- [ ] src/hooks/useChannels.ts
- [ ] src/hooks/useAuth.ts
- [ ] src/lib/query-client.ts

## Phase 6: Auth Pages

- [ ] src/app/(auth)/layout.tsx
- [ ] src/app/(auth)/login/page.tsx
- [ ] src/app/(auth)/signup/page.tsx
- [ ] src/components/auth/LoginForm.tsx
- [ ] src/components/auth/SignupForm.tsx

## Phase 7: Dashboard Layout

- [ ] src/app/(main)/layout.tsx
- [ ] src/components/layout/Sidebar.tsx
- [ ] src/components/layout/Header.tsx
- [ ] src/components/layout/UserMenu.tsx

## Phase 8: Apps Feature

- [ ] src/app/(main)/dashboard/apps/page.tsx
- [ ] src/app/(main)/dashboard/apps/[id]/page.tsx
- [ ] src/components/apps/AppList.tsx
- [ ] src/components/apps/AppCard.tsx
- [ ] src/components/apps/AppForm.tsx
- [ ] src/components/apps/AppDetails.tsx

## Phase 9: Releases Feature

- [ ] src/app/(main)/dashboard/apps/[id]/releases/page.tsx
- [ ] src/components/releases/ReleaseList.tsx
- [ ] src/components/releases/ReleaseCard.tsx
- [ ] src/components/releases/ReleaseForm.tsx
- [ ] src/components/releases/UploadDialog.tsx

## Phase 10: Channels Feature

- [ ] src/app/(main)/dashboard/apps/[id]/channels/page.tsx
- [ ] src/components/channels/ChannelList.tsx
- [ ] src/components/channels/ChannelCard.tsx
- [ ] src/components/channels/ChannelForm.tsx

## Phase 11: Settings

- [ ] src/app/(main)/dashboard/settings/page.tsx
- [ ] src/components/settings/ApiKeys.tsx
- [ ] src/components/settings/Profile.tsx

## Completion Criteria

- [ ] All files under 250 lines
- [ ] No `any` types
- [ ] All tests passing
- [ ] TypeScript compiles
- [ ] Lint passes
- [ ] Build succeeds
- [ ] Quality audit passes

## Dependencies

This package depends on:
- @bundlenudge/shared

This package is depended on by:
- (none - standalone)

## Notes

- Use shadcn/ui for all primitives
- TanStack Query for data fetching
- Keep pages thin, extract to components
- Avoid purple-blue gradients!
