# @bundlenudge/docs

## Purpose

Documentation site for BundleNudge. Serves docs.bundlenudge.com with LLM-friendly features.

## Tech Stack

- Next.js 15 (App Router)
- MDX for content
- Tailwind CSS for styling
- Shiki for code highlighting

## Directory Structure

```
packages/docs/
├── src/
│   ├── app/                    # Next.js pages
│   │   ├── api/               # API routes
│   │   │   ├── docs/          # JSON export
│   │   │   └── skills/        # Skills download
│   │   ├── getting-started/   # Dynamic routes
│   │   ├── sdk/
│   │   ├── dashboard/
│   │   ├── api/
│   │   └── self-hosting/
│   ├── components/            # React components
│   └── lib/                   # Utilities
├── content/                   # MDX documentation
│   ├── getting-started/
│   ├── sdk/
│   ├── dashboard/
│   ├── api/
│   └── self-hosting/
├── skills/                    # LLM knowledge pack
└── CLAUDE.md
```

## Key Features

### LLM-Friendly

- Every page has "Copy as JSON" and "Copy as Markdown" buttons
- `/api/docs` returns all docs as JSON
- `skills/` folder can be dropped into any repo

### Content Format

MDX files with frontmatter:
```yaml
---
title: "Page Title"
description: "Short description"
order: 1
---
```

## Commands

```bash
# Development
pnpm --filter @bundlenudge/docs dev

# Build
pnpm --filter @bundlenudge/docs build
```

## Writing Style

- Conversational, personable tone
- Use "you" and "we"
- Story-driven explanations
- Practical code examples
- No gradients, no blur, no glassmorphism
