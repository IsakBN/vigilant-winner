# Dashboard Package - DEPRECATED

This package has been split into separate subdomain-based applications:

| Old Route | New Location |
|-----------|--------------|
| `/` (landing) | `packages/landing` -> bundlenudge.com |
| `/dashboard/*` | `packages/app-dashboard` -> app.bundlenudge.com |
| `/admin/*` | `packages/admin-dashboard` -> admin.bundlenudge.com |

## Migration Timeline

This package will be removed after the migration is complete and all traffic has been redirected to the new subdomains.

## Current Status

All routes in this package now redirect to the appropriate subdomain:

- `/` -> `https://bundlenudge.com`
- `/login`, `/sign-up`, `/signup` -> `https://app.bundlenudge.com/...`
- `/forgot-password`, `/reset-password`, `/verify-email` -> `https://app.bundlenudge.com/...`
- `/dashboard/*` -> `https://app.bundlenudge.com/dashboard/*`
- `/admin/*` -> `https://admin.bundlenudge.com/admin/*`

## Why the Split?

1. **Separate auth systems**: App uses OAuth, Admin uses OTP-only
2. **Better security**: Admin on separate subdomain with stricter controls
3. **Independent deployments**: Each app can be deployed separately
4. **Cleaner codebase**: Smaller, focused packages

## For Developers

If you need to work on dashboard features, go to the appropriate package:

- Landing page changes: `packages/landing`
- App dashboard changes: `packages/app-dashboard`
- Admin dashboard changes: `packages/admin-dashboard`

Do not add new features to this package.
