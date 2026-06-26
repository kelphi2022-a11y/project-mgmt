# WorkAxis — Feature Specifications

Companion to `01-PRD.md`. This file gives field-level and behavioral detail for every
module so the build agent doesn't have to guess at form fields, states, or edge cases.

---

## 1. Projects & Tasks

### 1.1 Portfolio
| Field | Type | Notes |
|---|---|---|
| name | text | required |
| description | text | optional |
| owners | multi-user | at least 1 |
| created_by, created_at | system | |

### 1.2 Project
| Field | Type | Notes |
|---|---|---|
| name | text | required |
| portfolio_id | fk, nullable | a project can exist with no portfolio |
| client_tag | text | free text, used for filtering |
| rag_status | enum | Red / Amber / Green, manual, default Green |
| status | enum | Planning / Active / On Hold / Completed / Cancelled |
| start_date, end_date | date | end_date optional (open-ended ok) |
| leads | multi-user | at least 1, no max |
| members | multi-user | no max |

### 1.3 Sub-Project
- Same shape as Project minus portfolio_id/client_tag, plus `project_id` (required parent).
- On creation: pre-populate member list from parent Project members, but this is a
  one-time copy — editable independently afterward.

### 1.4 Task
| Field | Type | Notes |
|---|---|---|
| sub_project_id | fk | required |
| title | text | required |
| description | text | optional |
| priority | enum | Low / Medium / High / Urgent |
| due_date | date | optional |
| status | enum | To Do / In Progress / Blocked / Done |
| completion_pct | int 0–100 | manual by default |
| assignees | multi-user | no max, can be empty (unassigned) |

**Completion behavior:** if the task has ≥1 sub-task, show a toggle "auto-calculate
from sub-tasks." When on, completion_pct = round(closed_subtasks / total_subtasks ×
100) and the manual field is disabled. When off (default for tasks with no
sub-tasks, and switchable any time), the field is freely editable. Toggling does not
destroy the manual value — switching back restores the last manually-entered number.

### 1.5 Sub-Task
| Field | Type | Notes |
|---|---|---|
| task_id | fk | required |
| title | text | required |
| status | enum | To Do / In Progress / Done |
| assignees | multi-user | one or more |

---

## 2. Notes

| Field | Type | Notes |
|---|---|---|
| body | richtext | required |
| author_id | fk | system-set |
| attached_to | one of: project_id / sub_project_id / task_id / none | exactly one or none — a note is never attached to more than one parent |
| attachments | file[] | optional, via Supabase Storage |

**Visibility:** anyone who is a member (any role) of the project/sub-project the note
is attached to, plus the author. Stand-alone notes (no parent) are visible only to the
author — there's no "broadcast to org" note type in core.

---

## 3. Minutes of Meetings (MoM)

| Field | Type | Notes |
|---|---|---|
| project_id | fk | required |
| sub_project_id | fk, nullable | optional narrower scope |
| title | text | required |
| date | date | required |
| venue | text | optional, free text (physical or a meeting link) |
| attendees | multi-user | **must be drawn from existing project/sub-project members** — no ad-hoc external attendees in core |

### Agenda Items (repeating, ordered)
| Field | Notes |
|---|---|
| topic | required |
| discussion | free text, optional |
| decision | free text, optional |
| sort_order | for drag-reordering |

### Action Items (repeating, can hang off an agenda item or stand alone in the MoM)
| Field | Notes |
|---|---|
| description | required |
| owner | single user, from attendees |
| due_date | required |

**Promote-to-Follow-Up:** a button on each Action Item. On click, creates a
`follow_ups` row copying description/owner/due_date, sets `meeting_id` and
`meeting_agenda_item_id` to link back, status defaults to Open. The action item stays
on the MoM as a record (not deleted) — it just gains a "Promoted ✓ → view follow-up"
indicator. Idempotent: promoting twice should not create duplicates — disable the
button once promoted, or detect existing linked follow-up.

---

## 4. Follow-Up Tracker

| Field | Type | Notes |
|---|---|---|
| project_id | fk | required |
| meeting_id, meeting_agenda_item_id | fk, nullable | set only if sourced from a MoM |
| description | text | required |
| owner_id | fk | required |
| due_date | date | required |
| priority | enum | Low / Medium / High |
| status | enum | Open / In Progress / Closed / Escalated |
| escalated | boolean | derived convenience flag — true whenever status = Escalated |
| created_by, created_at | system | |

**Status transitions:** any status → any status is allowed (no rigid workflow), but
moving *to* Escalated should prompt for an optional comment/reason, stored as the note
body of an auto-created Note attached to nothing but tagged to the follow-up context —
or simpler for core: just a `escalation_reason` text column on `follow_ups`. (Use the
simpler column — avoid inventing a side table for this.)

**Overdue:** computed as `due_date < today AND status NOT IN ('Closed')`. Don't store
this as a column that needs a cron job to update in core — compute it in the query/
view layer. If a background job framework already exists for other reasons, a nightly
refresh of a denormalized flag is acceptable, but it's not required to ship v1.

**Escalation visibility:** when `status = 'Escalated'`, **all Leads on the project**
(not just the follow-up owner or the person who escalated it) must see it surfaced —
e.g., a badge/count on the project dashboard.

---

## 5. Progress & Dashboards

### 5.1 Personal Dashboard (`/dashboard`)
- My Tasks — across all projects, grouped by project, sortable by due date/priority.
- My Open Follow-Ups — same pattern.
- Upcoming Due Dates — next 7 days, tasks + follow-ups merged into one timeline.
- My Leave — pending requests + approved upcoming leave.
- My Team Today — if I have direct/indirect reports on any project, a compact "who's
  out, who has a meeting today" strip.

### 5.2 Project Dashboard (`/projects/[id]`)
- Sub-project progress bars (% complete, derived from task completion_pct average per
  sub-project — simple mean is fine for core, no weighting).
- Task completion breakdown (counts by status).
- RAG status, editable inline by a Lead.
- Open follow-up count, with an Escalated sub-count called out distinctly.

### 5.3 Manager View (`/reports`)
- Every project where the viewer has **at least one person beneath them in the
  reporting chain, at any depth** (see `03-database-schema.md` recursive query).
- Per project: RAG, overdue task count, escalated follow-up count, pending-leave-
  approval count where the viewer is the resolved approver.
- This view must NOT be a flat "all managers see all projects" — it is specifically
  chain-scoped. An Admin sees everything via a separate, simpler "see all" rule, not by
  inheriting Manager logic.

---

## 6. Team Calendar

### 6.1 Calendar Event Types
A single calendar surface renders two underlying record types:
1. **Leave** (from `leave_requests`, only when status = Approved)
2. **Meeting** (from `calendar_events`)

### 6.2 Leave Request — Fields
| Field | Type | Notes |
|---|---|---|
| requester_id | fk | system-set to current user |
| leave_type | fk → leave_types lookup | e.g. Vacation, Sick, Other — admin-editable list, not a hardcoded enum |
| start_date, end_date | date | required, end ≥ start |
| half_day | boolean | optional, only meaningful when start_date = end_date |
| note | text | optional |
| status | enum | Pending / Approved / Rejected / Cancelled |
| approver_id | fk, nullable | resolved at submission time (see §6.4), can be reassigned by Admin if needed |
| decision_comment | text | optional, set by approver |
| decided_at | timestamp | nullable |

**Cancellation:** a requester can cancel a Pending request freely. Cancelling an
Approved request (e.g., plans changed) should still be allowed up until the start
date, and removes the calendar block.

### 6.3 Meeting — Fields (`calendar_events`)
| Field | Type | Notes |
|---|---|---|
| title | text | required |
| event_date | date | required |
| start_time, end_time | time | required |
| project_id, sub_project_id | fk, nullable | optional link |
| attendees | multi-user | drawn from project members if linked to a project, otherwise any org user |
| location_or_link | text | optional |
| created_by | fk | system-set |

No approval step — any user (or Lead acting for the project) can create one. Anyone
listed as an attendee, or any member of the linked project, can see it.

### 6.4 Leave Approval Routing — Resolution Rule

This is the one genuinely tricky rule in the calendar module, because reporting lines
are per-project and a person can have several. The rule, in order:

1. Look up all of the requester's `project_reporting_lines` rows across all projects
   they're a member of.
2. If all of them point to the **same** `reports_to_user_id`, that person is the
   approver. (Common case — most people have one boss across their projects even if
   the project graph technically allows otherwise.)
3. If they point to **different** people, use the reporting line from the project
   the requester spends the most "primary" time on — for core, take the project
   where the requester has the **earliest `project_members.created_at`** (their
   longest-standing project) as the tiebreaker. This is a deliberately simple,
   deterministic rule — flagged in the PRD as an assumption to revisit, not a deep
   algorithm to build out further.
4. If the requester has **no** reporting line on any project (e.g., new hire, bench,
   or an Admin/top-of-chain person with nobody above them), route to a configurable
   org-wide fallback approver (a single setting in the Admin panel, e.g. "default
   leave approver" — store as a key in a simple `app_settings` table, not hardcoded).
5. Admin can always reassign `approver_id` manually on any pending request, overriding
   1–4.

This resolution happens **once, at submission time** — it does not re-resolve if the
reporting graph changes later, so an approval already routed doesn't silently jump to
a new approver mid-flight. Resolve again only if the request is still Pending and the
original `approver_id` user is deactivated.

### 6.5 Team Calendar View

- **Filters:** by Project, by Department, by "My Team" (= everyone at any depth below
  me on any project I'm in the reporting chain for — same recursive logic as §5.3).
- **Display:** month and week view. Leave renders as a colored block spanning its date
  range per user-row or as a compact avatar-stack per day, builder's choice for
  v1 — functionally what matters is that overlapping leave for multiple people on the
  same day is visible at a glance. Meetings render as time-slotted entries.
- **Conflict check:** when creating/editing a Meeting and adding attendees, check
  each attendee against Approved leave overlapping `event_date` and show an inline
  warning (non-blocking — organizer can still schedule it; this is a heads-up, not a
  hard rule).

### 6.6 Notifications (in-app only, core scope)
- Requester notified on Approve/Reject.
- Approver notified on new Pending request routed to them.
- No email/push in core — see PRD §10 open questions.
