# BundleNudge

**OTA updates for React Native. Push JavaScript changes directly to users without App Store review.**

[![License: BSL 1.1](https://img.shields.io/badge/License-BSL%201.1-blue.svg)](LICENSE)

## What is BundleNudge?

BundleNudge lets you update your React Native app's JavaScript bundle over-the-air. Ship bug fixes, new features, and UI changes instantly - no app store submission required.

## Quick Start

```bash
# Install the SDK
npm install @bundlenudge/sdk

# In your App.tsx
import { BundleNudge } from '@bundlenudge/sdk';

BundleNudge.configure({ appKey: 'your-app-key' });
BundleNudge.checkForUpdate();
```

## Features

- **Instant Updates** - Push changes in seconds, not days
- **Automatic Rollback** - Crashes detected? Auto-revert to stable version
- **Gradual Rollouts** - Release to 1%, 10%, 50%, then 100%
- **A/B Testing** - Test different versions with real users
- **Delta Updates** - Only download what changed
- **Offline Support** - Updates cached for offline use

## Packages

| Package | Description |
|---------|-------------|
| [@bundlenudge/sdk](packages/sdk) | React Native SDK |
| [@bundlenudge/api](packages/api) | Cloudflare Workers API |
| [dashboard](packages/dashboard) | Next.js management UI |
| [@bundlenudge/shared](packages/shared) | Shared TypeScript types |

## Documentation

- [Installation Guide](docs/getting-started/installation.md)
- [Quick Start](docs/getting-started/quickstart.md)
- [SDK Reference](docs/api-reference/sdk/)
- [REST API](docs/api-reference/rest-api/)
- [Self-Hosting](docs/self-hosting/)

## Development

```bash
# Install dependencies
pnpm install

# Start development
pnpm dev

# Run tests
pnpm test

# Type check
pnpm typecheck

# Lint
pnpm lint
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

[BSL 1.1](LICENSE) - Free for self-hosting. Cannot offer competing service.

Converts to Apache 2.0 on January 23, 2030.
