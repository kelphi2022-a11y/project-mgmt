# WorkAxis — Build Doc Set

This folder is a complete spec package for building WorkAxis, intended to be handed
to an AI build agent (e.g. Antigravity) or a human engineering team.

## Read in this order

1. **`01-PRD.md`** — what we're building and why. Start here. Contains the two
   non-negotiable modeling decisions (contextual roles, unlimited-depth reporting)
   that everything else depends on.
2. **`02-feature-specs.md`** — field-by-field, state-by-state detail for every
   module, including the new Team Calendar (leave + meetings).
3. **`03-database-schema.md`** — the actual SQL. Includes the recursive CTE patterns
   that must be used everywhere "who's in my reporting chain" matters. Runs top to
   bottom with no forward references.
4. **`04-access-control.md`** — Supabase RLS policies, built on helper functions
   defined once and reused. Includes a testing checklist specifically targeting the
   unlimited-depth reporting requirement.

## The two things not to get wrong

- **Reporting depth is unlimited and per-project.** There is no `level` column
  anywhere. Visibility is always computed with a recursive query
  (`03-database-schema.md §3.2`), never a fixed number of joins. If a build agent
  proposes capping this at N levels "for simplicity," that's a regression against
  the spec, not a reasonable simplification.
- **Leave requires approval; meetings don't.** Leave approval routes to a resolved
  approver via the reporting graph (`02-feature-specs.md §6.4`), with a documented
  fallback for people with no reporting line yet. Meetings on the shared calendar
  are self-serve.

## What's intentionally out of scope for this build (see PRD §3)

Time tracking, billing, Gantt/critical-path scheduling, native mobile, document
versioning, multi-tenant support, email/push notifications. These can be raised as
fast-follows but should not be added speculatively during the core build.
