# WorkAxis — Product Requirements Document

**Version:** 1.0
**Status:** Ready for build
**Audience:** AI build agent (Antigravity) + engineering review

---

## 1. Product Summary

WorkAxis is an internal project & engagement management tool for organizations that run
work as nested projects (Portfolio → Project → Sub-Project → Task → Sub-Task) with
**fluid team structures** rather than a fixed org chart.

Two properties define this product and must not be compromised by simplification:

1. **Roles are contextual, not global.** A person can be a Lead on one project and a
   plain Member on another. There is no single "manager" field on a user.
2. **Reporting lines are per-project and have no depth limit.** Worker → Lead → Senior
   Lead → Manager → Director → ... can go as deep as the org needs, and a person's
   reporting chain can differ from project to project. This must be modeled as a
   **self-referencing graph**, never as a fixed number of hierarchy levels.

Everything else in the product (dashboards, visibility rules, escalation, calendar
conflict views) is built on top of these two primitives.

---

## 2. Goals

- Let teams track nested work (portfolios down to sub-tasks) without forcing a rigid
  org hierarchy onto the data model.
- Let reporting/visibility scale to any depth of management without code changes.
- Give every project a lightweight meeting record (MoM) that can spin off trackable
  follow-ups.
- Give the whole team a shared calendar for leave and meetings, with leave requiring
  approval from the right person in the reporting chain.
- Ship as a single Next.js + Supabase app with no other backend dependencies.

## 3. Non-Goals (Core Build)

- Time tracking / timesheets
- Billing or invoicing
- Gantt charts or critical-path scheduling
- Mobile native app (responsive web only)
- Document versioning on notes/MoMs
- Multi-tenant / multi-org support (single organization per deployment)

---

## 4. User Roles

### 4.1 System-level roles (on `users.role`)
- **Admin** — full access, manages users/departments, sees everything
- **Manager** — elevated visibility via reporting lines (see §7)
- **Employee** — default role, visibility scoped to project membership

> Note: system role is *not* the same as project role. A system "Employee" can still be
> a Lead on five projects. System role mainly governs admin-panel access and is a
> fallback visibility floor — it does not replace the per-project lead/member role or
> the reporting-line graph.

### 4.2 Project-level roles (on membership tables)
- **Lead** — at Project, Sub-Project level. Can manage membership, create
  tasks/sub-tasks, publish MoMs, manage follow-ups, approve leave for people who
  report to them on that project.
- **Member** — assigned/contributing participant, no management rights.

A user's project role is independent at every level: Lead on the Project but only
Member on a Sub-Project beneath it, or the reverse.

---

## 5. Core Concepts

### 5.1 Project Hierarchy
```
Portfolio → Project → Sub-Project → Task → Sub-Task
```
- All levels support **multiple** leads/owners and **multiple** members. No caps anywhere.
- Sub-Project inherits Project members by default at creation time, but membership
  then diverges — adding/removing at one level does not affect the other.
- Task completion % is set manually OR rolled up from Sub-Task completion if
  Sub-Tasks exist (see §5.3).

### 5.2 Reporting Lines — Unlimited Depth (critical requirement)

This is the most important modeling decision in the product. Read this section fully
before implementing.

**Requirement:** A user's reporting chain on a project must support **any number of
levels**, e.g.:

```
Employee → Team Lead → Senior Lead → Project Manager → Program Manager → Director
```

and even deeper, without any schema or query change. The same employee may have a
*completely different and differently-shaped* chain on another project.

**Why this matters for visibility:** "a manager sees everything under their reporting
chain" must mean *transitively* under them — not just their direct reports. If a
Director has a Program Manager under them, who has a Project Manager under them, who
has Leads under them, who have Employees under them — the Director sees all of it on
that project, not just one level down.

**Data model implication:** `project_reporting_lines` is a self-referencing edge list
(`user_id → reports_to_user_id`, scoped by `project_id`). It is **not** a tree with a
fixed number of columns, and there is **no `level` or `depth` field** anywhere in the
schema. Depth is computed at query time via a recursive CTE (see
`03-database-schema.md §reporting-line-queries` for the exact SQL pattern). Anyone
implementing this must use the recursive query — a naive "join up to 3 levels" approach
is explicitly wrong and must be rejected in code review.

**Cycle protection:** Since this is a user-editable graph, the app must prevent a user
from being set as their own (in)direct report on the same project (A reports to B, B
reports to A). Validate on write, not just on read.

### 5.3 Completion Roll-up
- Sub-Task has a status (not a %).
- Task completion % is **manually set** by default.
- If a Task has Sub-Tasks, the UI should offer "calculate from sub-tasks" — % = (closed
  sub-tasks / total sub-tasks) × 100 — but this is a recalculation the user can also
  override. It is not a hard real-time-locked formula.

### 5.4 RAG Status
- Manual, set by Leads at the Project level. Red / Amber / Green. No auto-derivation
  in core (could be added later from overdue task counts, but that's a stretch goal,
  not core).

---

## 6. Feature Modules

### 6.1 Projects & Tasks
- Full CRUD across all five hierarchy levels.
- Filtering by status, assignee, due date, priority at task/sub-task level.
- See `02-feature-specs.md §1` for field-level detail and UI behavior.

### 6.2 Notes
- Attach to Project, Sub-Project, Task, or stand-alone (no parent).
- Visible to: author + all members of the project/sub-project the note is attached to.
- Simple rich text. No versioning, no edit history in core.

### 6.3 Minutes of Meetings (MoM)
- Linked to a Project or Sub-Project.
- Attendees are selected from existing project members only (no ad-hoc attendees in
  core — out of scope, see §3).
- Action Items can be promoted to Follow-Ups with a single action (copies description/
  owner/due date forward, links back to source MoM + agenda item).

### 6.4 Follow-Up Tracker
- Sourced from MoM action items or created directly.
- Status: Open / In Progress / Closed / Escalated.
- Escalated is a flag any Lead can set — once set, it's visible to **all Leads on that
  project**, not just the owner.
- Overdue = due date passed AND status not Closed. Computed, not stored — recompute on
  read (or via a scheduled job that updates a derived flag, see `02-feature-specs.md`).

### 6.5 Progress & Dashboards
- **Personal dashboard** — my tasks (across all projects), my open follow-ups, my
  upcoming due dates, my pending leave requests, my team's calendar for today/this week.
- **Project dashboard** — sub-project progress, task completion breakdown, RAG, open
  follow-up count.
- **Manager view** — every project where the manager has *anyone* beneath them in the
  reporting chain (any depth), RAG per project, overdue task count, escalated
  follow-ups, **and pending leave approvals waiting on them**.

### 6.6 Team Calendar (NEW)

Two event types share one calendar surface:

**A. Leave**
- A user submits a leave request: type (e.g. Vacation / Sick / Other — keep it a free
  lookup table, not a hardcoded enum, so it's editable by Admin), start date, end date,
  optional half-day flag, note.
- Goes to **Pending**. Requires approval before it shows as confirmed leave on the
  team calendar.
- **Approver resolution:** the request is approved by whoever the requester reports to
  — resolved via `project_reporting_lines` for projects they're on, falling back to a
  general/default approver if the user has no project reporting line configured (e.g.
  bench employees not yet on a project). See `02-feature-specs.md §6` for the exact
  fallback rule.
- If a user reports to different people on different projects, leave approval is not
  project-scoped — it is resolved against the user's *primary* reporting line (see
  detail in feature spec) to avoid asking five managers to approve one leave request.
- Approver can Approve / Reject with an optional comment. Requester is notified
  in-app (no email in core).
- Once approved, leave shows on the team calendar as a block for that user, visible to
  anyone who shares a project with them (so colleagues know who's out).

**B. Meetings**
- Self-serve, no approval. A user (or a project Lead, on behalf of the project) creates
  a calendar meeting entry: title, date, start/end time, project/sub-project link
  (optional), attendees (from project members or any org user), location/link.
- Distinct from MoM — a Meeting calendar entry can later have an MoM written against
  it, but doesn't require one (some meetings are just meetings).

**C. Team Calendar View**
- Month/week view, filterable by Project, Department, or "my team" (people who report
  to me, any depth, across all my projects).
- Shows leave blocks and meeting markers together.
- Conflict surfacing: when scheduling a meeting, show whose invited attendees are on
  approved leave that day.

Full field list and approval-routing rules: `02-feature-specs.md §6`.
Schema: `03-database-schema.md §leave_requests, §calendar_events`.

---

## 7. Access Control — Behavioral Summary

(Full RLS policies in `04-access-control.md`. This section states intent.)

- **Admin** — sees and edits everything, including all calendars and all leave
  approvals (can act as a fallback approver).
- **Manager** (or anyone who is a Lead/upstream node in a reporting chain) — sees all
  projects, tasks, follow-ups, notes, MoMs, and leave requests for anyone in their
  reporting chain **at any depth**, on any project where that chain exists. This is the
  single most security-relevant query in the app — it must be computed by walking the
  reporting graph downward from the manager, not by a hardcoded level check.
- **Employee** — sees only projects/sub-projects/tasks they are a member of, lead of,
  or assigned to. Sees their own leave requests and calendar. Sees the team calendar
  filtered to shared projects.
- **Leads** — additionally can manage membership, approve leave for people who report
  to them on that project, escalate/manage follow-ups, and publish MoMs at their level.

---

## 8. Architecture (unchanged from existing technical plan)

- **Frontend:** Next.js (App Router)
- **Auth:** Supabase Auth, email/password, invite-based onboarding
- **Database:** Supabase PostgreSQL + Row Level Security
- **Storage:** Supabase Storage (attachments on notes/MoMs)
- **Realtime:** Supabase Realtime (task/follow-up/leave-status live updates — optional
  for v1, additive later)
- **Hosting:** Vercel

---

## 9. Build Sequencing (suggested for Antigravity)

This order keeps every module shippable/testable on its own, per the original plan's
philosophy, while front-loading the two hard primitives (reporting graph + dynamic
membership) so nothing later has to be retrofitted:

1. Auth + Users + Departments + Admin panel
2. Project hierarchy (Portfolio → Sub-Task) + dynamic membership tables
3. Reporting lines (recursive query layer) + RLS built on it — **validate depth >3
   manually before moving on**
4. Tasks/Sub-Tasks CRUD + completion roll-up
5. Notes
6. MoM + Follow-Up Tracker (+ promote-to-follow-up action)
7. Team Calendar — meetings (no approval) first, then leave requests + approval routing
8. Dashboards (personal, project, manager) — these read from everything above, build last
9. Reports cross-project view

---

## 10. Open Questions / Assumptions Logged

- Leave approval routing uses a "primary reporting line" concept when a user has
  multiple project reporting lines — defined precisely in `02-feature-specs.md §6.4`.
  If this assumption doesn't match the real org process, that section is the one to
  revise.
- Department is still optional/flat per the original plan — not used for approval
  routing, only for filtering.
- No email notifications in core (in-app only) — flagged as a fast-follow, not blocking.
