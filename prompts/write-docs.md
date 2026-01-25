# Write Documentation Prompt

## Context

You are writing documentation for BundleNudge.

**Target**: {{TARGET}}
**Type**: {{DOC_TYPE}} (api-reference | guide | readme | llm-context)

## Documentation Standards

### Language

- Clear, concise language
- Active voice
- Present tense
- No marketing fluff
- No jargon without explanation

### Structure

```markdown
# Title

Brief description (1-2 sentences).

## Section

Content with examples.

### Subsection

More specific content.
```

## Type-Specific Guidelines

### API Reference

```markdown
# functionName

Brief description of what it does.

## Signature

\`\`\`typescript
function functionName(param: Type): ReturnType
\`\`\`

## Parameters

| Name | Type | Description |
|------|------|-------------|
| param | Type | What it's for |

## Returns

Type - Description of return value.

## Example

\`\`\`typescript
const result = functionName('input');
// result: 'output'
\`\`\`

## Errors

- `ErrorType` - When this happens
```

### Guide

```markdown
# How to Do X

Learn how to accomplish X with BundleNudge.

## Prerequisites

- Requirement 1
- Requirement 2

## Steps

### 1. First Step

Explanation and code:

\`\`\`typescript
// Code example
\`\`\`

### 2. Second Step

More explanation...

## Complete Example

Full working example.

## Troubleshooting

Common issues and solutions.
```

### README

```markdown
# Package Name

Brief description.

## Installation

\`\`\`bash
pnpm add @bundlenudge/package
\`\`\`

## Quick Start

\`\`\`typescript
import { thing } from '@bundlenudge/package';
// Minimal working example
\`\`\`

## API

Brief overview of main exports.

## Documentation

Link to full docs.
```

### LLM Context (llms.txt)

```markdown
# Package Name

> One-line description.

## Purpose

What this package does (2-3 sentences).

## Key Exports

- `export1` - Description
- `export2` - Description

## Patterns

How to use this package:

\`\`\`typescript
// Common usage pattern
\`\`\`

## Dependencies

- dependency1: Why it's used
- dependency2: Why it's used
```

## Quality Checklist

- [ ] Clear and concise
- [ ] Code examples that actually work
- [ ] No marketing speak
- [ ] Proper formatting
- [ ] Links work
- [ ] Covers common use cases
- [ ] Addresses likely questions

## LLM-Friendly Principles

1. **Structured** - Use consistent headers
2. **Scannable** - Key info visible at a glance
3. **Complete** - Include all necessary context
4. **Accurate** - Code examples must work
5. **Linked** - Reference related docs

## Token Budget

- `llms.txt` (index): ~2000 tokens
- Package `llms.txt`: ~5000 tokens
- `codebase.json`: ~3000 tokens

Keep content dense but readable.

## After Writing

1. Review for clarity
2. Test code examples
3. Update cross-references
4. Update `llms.txt` if adding new concepts
