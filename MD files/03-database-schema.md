# WorkAxis — Database Schema

PostgreSQL (Supabase). All tables use `uuid` primary keys (`default gen_random_uuid()`)
unless noted. All `created_at`/`updated_at` are `timestamptz default now()`.

---

## 1. Core / Org

```sql
create table departments (
  id uuid primary key default gen_random_uuid(),
  name text not null
);

create table users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  role text not null check (role in ('admin','manager','employee')) default 'employee',
  department_id uuid references departments(id),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table app_settings (
  key text primary key,
  value jsonb not null
);
-- seed: ('default_leave_approver_id', '"<uuid>"')
```

## 2. Project Hierarchy

```sql
create table portfolios (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_by uuid references users(id),
  created_at timestamptz not null default now()
);

create table portfolio_owners (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references portfolios(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  unique (portfolio_id, user_id)
);

create table projects (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid references portfolios(id),
  name text not null,
  client_tag text,
  rag_status text not null default 'Green' check (rag_status in ('Red','Amber','Green')),
  status text not null default 'Planning'
    check (status in ('Planning','Active','On Hold','Completed','Cancelled')),
  start_date date,
  end_date date,
  created_by uuid references users(id),
  created_at timestamptz not null default now()
);

create table project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  role text not null check (role in ('lead','member')),
  created_at timestamptz not null default now(),
  unique (project_id, user_id)
);

create table sub_projects (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  name text not null,
  status text not null default 'Planning'
    check (status in ('Planning','Active','On Hold','Completed','Cancelled')),
  start_date date,
  end_date date,
  created_by uuid references users(id),
  created_at timestamptz not null default now()
);

create table sub_project_members (
  id uuid primary key default gen_random_uuid(),
  sub_project_id uuid not null references sub_projects(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  role text not null check (role in ('lead','member')),
  created_at timestamptz not null default now(),
  unique (sub_project_id, user_id)
);

create table tasks (
  id uuid primary key default gen_random_uuid(),
  sub_project_id uuid not null references sub_projects(id) on delete cascade,
  title text not null,
  description text,
  priority text not null default 'Medium' check (priority in ('Low','Medium','High','Urgent')),
  due_date date,
  status text not null default 'To Do' check (status in ('To Do','In Progress','Blocked','Done')),
  completion_pct int not null default 0 check (completion_pct between 0 and 100),
  auto_calc_completion boolean not null default false,
  created_by uuid references users(id),
  created_at timestamptz not null default now()
);

create table task_assignees (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  unique (task_id, user_id)
);

create table sub_tasks (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks(id) on delete cascade,
  title text not null,
  status text not null default 'To Do' check (status in ('To Do','In Progress','Done')),
  created_by uuid references users(id),
  created_at timestamptz not null default now()
);

create table sub_task_assignees (
  id uuid primary key default gen_random_uuid(),
  sub_task_id uuid not null references sub_tasks(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  unique (sub_task_id, user_id)
);
```

## 3. Reporting Lines — Unlimited Depth Graph

**This is the most important table in the schema.** It is a self-referencing edge
list, scoped per project. There is intentionally no `level`, `depth`, or `tier`
column — depth is a query-time property, not a stored one.

```sql
create table project_reporting_lines (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  reports_to_user_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (project_id, user_id),  -- one direct manager per user per project
  check (user_id <> reports_to_user_id)
);

create index idx_reporting_lines_project_user on project_reporting_lines(project_id, user_id);
create index idx_reporting_lines_reports_to on project_reporting_lines(project_id, reports_to_user_id);
```

> `unique (project_id, user_id)` means each person has exactly one direct manager
> *on a given project* — that's correct and matches "no fixed one-manager constraint
> at the org level" from the brief: the constraint is per-project, not global, and a
> person can still have entirely different direct managers on different projects.

### 3.1 Cycle prevention (application-level, enforced before insert/update)

Before inserting/updating a `project_reporting_lines` row, walk up from the proposed
`reports_to_user_id` and confirm `user_id` does not appear in that chain. Reject the
write if it does. Implement as a Postgres function so it's enforced regardless of
client:

```sql
create or replace function would_create_reporting_cycle(
  p_project_id uuid, p_user_id uuid, p_reports_to_user_id uuid
) returns boolean as $$
declare
  cycle_found boolean;
begin
  with recursive chain as (
    select reports_to_user_id as uid
    from project_reporting_lines
    where project_id = p_project_id and user_id = p_reports_to_user_id
    union all
    select prl.reports_to_user_id
    from project_reporting_lines prl
    join chain c on prl.user_id = c.uid
    where prl.project_id = p_project_id
  )
  select exists(select 1 from chain where uid = p_user_id) into cycle_found;
  return cycle_found;
end;
$$ language plpgsql stable;
```

Call this in a `before insert or update` trigger on `project_reporting_lines`, or from
the API layer before writing — either is acceptable, but it must be enforced
server-side, not just in the UI.

### 3.2 Reporting-line queries (use these patterns everywhere "chain" visibility matters)

**Everyone who reports up to me, at any depth, on a project** (this is the query
that powers Manager View, escalation visibility, and "My Team" calendar filter):

```sql
with recursive downline as (
  select user_id, reports_to_user_id, 1 as depth
  from project_reporting_lines
  where project_id = :project_id and reports_to_user_id = :manager_id

  union all

  select prl.user_id, prl.reports_to_user_id, d.depth + 1
  from project_reporting_lines prl
  join downline d on prl.reports_to_user_id = d.user_id
  where prl.project_id = :project_id
)
select user_id, depth from downline;
```

**Everyone who reports up to me across ALL projects** (drop the `project_id` filter,
group by project, or run the above per project the manager has any reports on — for
the manager-view dashboard, run it per project and union the results, tagging each row
with its `project_id`).

**My full reporting chain upward (who do I ultimately report to)** — same shape,
reversed:

```sql
with recursive upline as (
  select user_id, reports_to_user_id, 1 as depth
  from project_reporting_lines
  where project_id = :project_id and user_id = :employee_id

  union all

  select prl.user_id, prl.reports_to_user_id, u.depth + 1
  from project_reporting_lines prl
  join upline u on prl.user_id = u.reports_to_user_id
  where prl.project_id = :project_id
)
select reports_to_user_id, depth from upline;
```

These two recursive CTEs are the canonical pattern for this entire app's visibility
model. **Do not write a fixed-depth join (e.g. three `LEFT JOIN`s for three levels)
anywhere in this codebase** — it will silently break the moment an org chain goes one
level deeper than whatever was hardcoded, which is the exact failure mode this
table exists to avoid.

---

## 4. Notes

```sql
create table notes (
  id uuid primary key default gen_random_uuid(),
  body text not null,
  author_id uuid not null references users(id),
  project_id uuid references projects(id),
  sub_project_id uuid references sub_projects(id),
  task_id uuid references tasks(id),
  created_at timestamptz not null default now(),
  check (
    (project_id is not null)::int +
    (sub_project_id is not null)::int +
    (task_id is not null)::int <= 1
  )
);

create table note_attachments (
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null references notes(id) on delete cascade,
  storage_path text not null,
  file_name text not null
);
```

## 5. Minutes of Meetings

```sql
create table meetings (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  sub_project_id uuid references sub_projects(id),
  title text not null,
  date date not null,
  venue text,
  created_by uuid references users(id),
  created_at timestamptz not null default now()
);

create table meeting_attendees (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references meetings(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  unique (meeting_id, user_id)
);

create table meeting_agenda_items (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references meetings(id) on delete cascade,
  topic text not null,
  discussion text,
  decision text,
  sort_order int not null default 0
);

create table meeting_action_items (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references meetings(id) on delete cascade,
  meeting_agenda_item_id uuid references meeting_agenda_items(id),
  description text not null,
  owner_id uuid not null references users(id),
  due_date date not null,
  promoted_follow_up_id uuid -- fk added below in §6, once follow_ups exists
);
```

> Note: `meeting_action_items` is a new explicit table not in the original outline
> (which described action items as fields on the MoM only). Adding it as its own
> table is necessary to support "promote with one click" cleanly and to allow
> multiple action items per meeting. Add this table even though it wasn't named in
> the original schema list.

## 6. Follow-Up Tracker

```sql
create table follow_ups (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  meeting_id uuid references meetings(id),
  meeting_agenda_item_id uuid references meeting_agenda_items(id),
  description text not null,
  owner_id uuid not null references users(id),
  due_date date not null,
  priority text not null default 'Medium' check (priority in ('Low','Medium','High')),
  status text not null default 'Open'
    check (status in ('Open','In Progress','Closed','Escalated')),
  escalation_reason text,
  created_by uuid references users(id),
  created_at timestamptz not null default now()
);

-- now that follow_ups exists, attach the deferred fk from meeting_action_items
alter table meeting_action_items
  add constraint fk_meeting_action_items_follow_up
  foreign key (promoted_follow_up_id) references follow_ups(id);
```

(`escalated` is not a stored column — derive it as `status = 'Escalated'` in queries/
views, per `02-feature-specs.md §4`.)

## 7. Team Calendar

```sql
create table leave_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique  -- e.g. Vacation, Sick, Other -- admin-editable
);

create table leave_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references users(id),
  leave_type_id uuid not null references leave_types(id),
  start_date date not null,
  end_date date not null,
  half_day boolean not null default false,
  note text,
  status text not null default 'Pending'
    check (status in ('Pending','Approved','Rejected','Cancelled')),
  approver_id uuid references users(id),
  decision_comment text,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  check (end_date >= start_date)
);

create index idx_leave_requests_requester on leave_requests(requester_id);
create index idx_leave_requests_approver_status on leave_requests(approver_id, status);

create table calendar_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  event_date date not null,
  start_time time not null,
  end_time time not null,
  project_id uuid references projects(id),
  sub_project_id uuid references sub_projects(id),
  location_or_link text,
  created_by uuid not null references users(id),
  created_at timestamptz not null default now(),
  check (end_time > start_time)
);

create table calendar_event_attendees (
  id uuid primary key default gen_random_uuid(),
  calendar_event_id uuid not null references calendar_events(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  unique (calendar_event_id, user_id)
);
```

### 7.1 Approver resolution helper (used at leave-request submission)

```sql
-- Pseudocode shape of the resolution logic (§ see feature spec 6.4 for full rule):
-- 1. distinct reports_to_user_id for requester across all project_reporting_lines
-- 2. if exactly one distinct value -> use it
-- 3. if multiple -> pick the one tied to the project where requester has the
--    earliest project_members.created_at
-- 4. if zero rows -> use app_settings['default_leave_approver_id']
```

Implement as a Postgres function `resolve_leave_approver(p_user_id uuid) returns uuid`
so it's reusable from RLS policies and from the submission API route alike.

---

## 8. Entity Relationship Summary

```
departments ──┐
              ▼
            users ──┬─→ project_members ──→ projects ──→ portfolios
                     ├─→ sub_project_members ──→ sub_projects ──→ projects
                     ├─→ task_assignees ──→ tasks ──→ sub_projects
                     ├─→ sub_task_assignees ──→ sub_tasks ──→ tasks
                     ├─→ project_reporting_lines (self-ref via reports_to_user_id) ──→ projects
                     ├─→ notes (author) ──→ [project | sub_project | task]
                     ├─→ meeting_attendees ──→ meetings ──→ projects
                     ├─→ follow_ups (owner) ──→ projects, meetings (optional)
                     ├─→ leave_requests (requester, approver)
                     └─→ calendar_event_attendees ──→ calendar_events ──→ projects (optional)
```
