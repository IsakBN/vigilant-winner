# Implement Feature Prompt

## Context

You are implementing a feature for BundleNudge, an OTA update system for React Native.

**Current Package**: {{PACKAGE}}
**Current Task**: {{TASK}}
**Current File**: {{FILE_PATH}}

## Reference Implementation

Consult the production reference at:
```
/Users/isaks_macbook/Desktop/Dev/codepush/{{REFERENCE_PATH}}
```

Study the patterns, structure, and implementation details before writing code.

## Requirements

### Code Quality (NON-NEGOTIABLE)

1. **Max 250 lines per file** - Split into multiple files if needed
2. **Max 50 lines per function** - Extract helper functions
3. **No `any` types** - Use `unknown` or proper types
4. **No default exports** - Only named exports
5. **No `console.log`** - Use proper logger
6. **No silent catches** - Always handle errors explicitly
7. **No `@ts-ignore`** - Fix the type issue instead

### Implementation Standards

1. **Follow existing patterns** - Match the reference implementation style
2. **Write tests alongside code** - Every file needs a `.test.ts`
3. **Use Zod for validation** - All external input must be validated
4. **Handle errors properly** - Explicit error handling with context
5. **Keep functions focused** - Single responsibility principle

### File Organization

```
src/
├── index.ts          # Public exports only
├── types.ts          # Type definitions
├── feature.ts        # Implementation
└── feature.test.ts   # Colocated tests
```

## Output Checklist

Before completing this task:

- [ ] File is under 250 lines
- [ ] All functions under 50 lines
- [ ] No `any` types
- [ ] Tests written and passing
- [ ] Follows reference patterns
- [ ] Error handling is explicit
- [ ] Types are exported if needed

## Verification

After implementation:

```bash
./scripts/verify.sh {{PACKAGE}}
```

All checks must pass before marking this task complete.

## State Update

When done:
1. Mark task as complete in `packages/{{PACKAGE}}/plan.md`
2. Update `packages/{{PACKAGE}}/checkin.md` with progress
3. Update `.claude/loop-state.json` iteration count
