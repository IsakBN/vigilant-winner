# Contributing to BundleNudge

Thanks for your interest in contributing! This document explains how to get started.

## Quick Start

1. Fork the repo
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/bundlenudge`
3. Install dependencies: `pnpm install`
4. Create a branch: `git checkout -b my-feature`
5. Make your changes
6. Run tests: `pnpm test`
7. Submit a PR

## Development Setup

### Prerequisites

- Node.js >= 20.0.0
- pnpm >= 8.15.0
- Git

### Installing Dependencies

```bash
pnpm install
```

### Running Tests

```bash
# All tests
pnpm test

# Specific package
pnpm --filter @bundlenudge/api test

# Watch mode
pnpm --filter @bundlenudge/api test -- --watch
```

### Type Checking

```bash
pnpm typecheck
```

### Linting

```bash
pnpm lint
```

## Code Style

We enforce strict code quality. Your code must pass all checks before merging.

### File Limits

| Rule | Limit |
|------|-------|
| Max lines per file | 250 |
| Max lines per function | 50 |
| Max nesting depth | 3 |
| Max parameters | 4 |

### TypeScript Rules

- **No `any` types** - Use `unknown` and type guards instead
- **No `@ts-ignore`** - Fix the type error properly
- **Named exports only** - No default exports
- **Strict mode** - All strict checks enabled

### Testing

- Tests colocated with source: `myFile.ts` + `myFile.test.ts`
- Aim for 80%+ coverage on new code
- Test behavior, not implementation

### Commits

Use conventional commits:

```
feat: add new feature
fix: fix a bug
docs: update documentation
test: add tests
refactor: refactor code
chore: maintenance tasks
```

## Pull Request Checklist

Before submitting:

- [ ] Tests pass: `pnpm test`
- [ ] Types check: `pnpm typecheck`
- [ ] Lint passes: `pnpm lint`
- [ ] Documentation updated (if applicable)
- [ ] Changelog entry added (if user-facing)

## Pull Request Process

1. Create PR with clear description
2. Link any related issues
3. Wait for CI to pass
4. Request review from maintainers
5. Address feedback
6. Merge when approved

## Getting Help

- **Bugs**: Open an issue with reproduction steps
- **Questions**: Use GitHub Discussions
- **Security**: See [SECURITY.md](SECURITY.md)

## Code of Conduct

See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)
