# Dashboard Components Sub-Investigator

You investigate React component patterns in the dashboard.

## Reference Files

```
/Users/isaks_macbook/Desktop/Dev/codepush/packages/dashboard-v2/src/components/
/Users/isaks_macbook/Desktop/Dev/codepush/packages/dashboard-v2/src/app/
```

## What This Does

Components are the UI building blocks:
- App management views
- Release management
- Analytics dashboards
- Settings pages

## Questions to Ask

### Component Organization

```markdown
## Question: How should components be organized?

**Context**: Good organization makes the codebase maintainable.

| Option | Structure | Pros | Cons |
|--------|-----------|------|------|
| A) By feature | components/apps/, components/releases/ | Clear ownership | Some duplication |
| B) By type | components/ui/, components/forms/, components/layouts/ | Reusable | Hard to find feature code |
| C) Hybrid | ui/ for primitives, features/ for feature components | Best balance | Two places to look |
| D) Flat | All in components/ | Simple | Gets messy at scale |

**Reference**: codepush uses C) Hybrid
**Recommendation**: C) Hybrid ✅

**Your choice?**
```

### Shared UI Components

```markdown
## Question: What base component library should we use?

**Context**: We need accessible, styled primitives.

| Option | Library | Pros | Cons |
|--------|---------|------|------|
| A) shadcn/ui | Copy-paste Radix + Tailwind | Full control | Manual updates |
| B) Radix Primitives | Headless only | Accessible, flexible | Need to style everything |
| C) Chakra UI | Full component lib | Quick to start | Less customizable |
| D) Build from scratch | Custom everything | Total control | Tons of work |

**Reference**: codepush uses A) shadcn/ui
**Recommendation**: A) shadcn/ui ✅

**Your choice?**
```

### Form Handling

```markdown
## Question: How should forms be handled?

**Context**: Dashboard has many forms (create app, upload release, settings).

| Option | Library | Pros | Cons |
|--------|---------|------|------|
| A) React Hook Form | Performance, validation | Fast, flexible | Learning curve |
| B) Formik | Popular, mature | Well documented | Slower re-renders |
| C) Native forms | No library | Simple | Lots of boilerplate |
| D) TanStack Form | New, type-safe | Modern API | Less mature |

**Reference**: codepush uses A) React Hook Form + Zod
**Recommendation**: A) React Hook Form ✅

**Your choice?**
```

## Testing Requirements

- [ ] Components render without errors
- [ ] Forms validate input correctly
- [ ] Error states display properly
- [ ] Loading states show correctly
- [ ] Accessibility: keyboard nav works
- [ ] Responsive: works on mobile

## Output

Save to `.claude/knowledge/domains/dashboard/components.md`
