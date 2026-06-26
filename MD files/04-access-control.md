# WorkAxis — Access Control (Supabase RLS)

Companion to `03-database-schema.md`. Every policy below assumes
`auth.uid()` resolves to the current `users.id` (standard Supabase Auth setup —
`users.id` should equal the Supabase `auth.users.id`, not a separate mapped id).

---

## 1. Principles

1. **Admin bypasses everything.** Implement as a single short-circuit check
   (`is_admin(auth.uid())`) at the top of every policy rather than repeating admin
   logic per table.
2. **Manager/Lead visibility is reporting-chain-based, not role-based.** A
   `users.role = 'manager'` person does **not** automatically see everything — they
   see what their position in the `project_reporting_lines` graph entitles them to,
   on whichever specific projects that graph applies to. `role = 'manager'` mainly
   gates admin-adjacent UI, not row visibility, except where explicitly noted.
3. **Every chain check uses the recursive downline query from
   `03-database-schema.md §3.2`**, wrapped in a `SECURITY DEFINER` SQL function so it
   can be called cheaply from inside RLS policies without re-deriving it per table.

---

## 2. Helper Functions (create these first)

```sql
create or replace function is_admin(p_user_id uuid) returns boolean as $$
  select exists(select 1 from users where id = p_user_id and role = 'admin' and is_active);
$$ language sql stable security definer;

-- Is target_user anywhere in viewer's downline on this project (any depth)?
create or replace function is_in_downline(
  p_project_id uuid, p_viewer_id uuid, p_target_id uuid
) returns boolean as $$
  with recursive downline as (
    select user_id from project_reporting_lines
    where project_id = p_project_id and reports_to_user_id = p_viewer_id
    union all
    select prl.user_id
    from project_reporting_lines prl
    join downline d on prl.reports_to_user_id = d.user_id
    where prl.project_id = p_project_id
  )
  select exists(select 1 from downline where user_id = p_target_id);
$$ language sql stable security definer;

-- Does viewer have ANYONE in their downline on this project? (i.e. are they
-- "a manager of someone" on this project at all — used to gate project-level
-- chain visibility rather than per-user checks where that's cheaper)
create or replace function has_any_downline_on_project(
  p_project_id uuid, p_viewer_id uuid
) returns boolean as $$
  with recursive downline as (
    select user_id from project_reporting_lines
    where project_id = p_project_id and reports_to_user_id = p_viewer_id
    union all
    select prl.user_id
    from project_reporting_lines prl
    join downline d on prl.reports_to_user_id = d.user_id
    where prl.project_id = p_project_id
  )
  select exists(select 1 from downline);
$$ language sql stable security definer;

create or replace function is_project_member(p_project_id uuid, p_user_id uuid) returns boolean as $$
  select exists(select 1 from project_members where project_id = p_project_id and user_id = p_user_id)
$$ language sql stable security definer;

create or replace function is_project_lead(p_project_id uuid, p_user_id uuid) returns boolean as $$
  select exists(
    select 1 from project_members
    where project_id = p_project_id and user_id = p_user_id and role = 'lead'
  )
$$ language sql stable security definer;

create or replace function is_sub_project_lead(p_sub_project_id uuid, p_user_id uuid) returns boolean as $$
  select exists(
    select 1 from sub_project_members
    where sub_project_id = p_sub_project_id and user_id = p_user_id and role = 'lead'
  )
$$ language sql stable security definer;
```

---

## 3. Projects

```sql
alter table projects enable row level security;

-- SELECT: admin, any member (any role), or any viewer who has at least one
-- person in their downline on this project (so a manager 3+ levels up can see
-- the project even if they were never directly added as a project_member).
create policy projects_select on projects for select using (
  is_admin(auth.uid())
  or is_project_member(id, auth.uid())
  or has_any_downline_on_project(id, auth.uid())
);

-- INSERT: any authenticated active user can create a project (becomes a lead by
-- a follow-up insert into project_members in the same transaction at app layer).
create policy projects_insert on projects for insert with check (auth.uid() is not null);

-- UPDATE: admin or project leads only.
create policy projects_update on projects for update using (
  is_admin(auth.uid()) or is_project_lead(id, auth.uid())
);

-- DELETE: admin only (project archival, not hard delete, is the recommended UX —
-- but if hard delete is implemented, gate it this tightly).
create policy projects_delete on projects for delete using (is_admin(auth.uid()));
```

## 4. Project Members

```sql
alter table project_members enable row level security;

create policy project_members_select on project_members for select using (
  is_admin(auth.uid())
  or is_project_member(project_id, auth.uid())
  or has_any_downline_on_project(project_id, auth.uid())
);

-- Only leads (or admin) can add/remove members.
create policy project_members_insert on project_members for insert with check (
  is_admin(auth.uid()) or is_project_lead(project_id, auth.uid())
);

create policy project_members_delete on project_members for delete using (
  is_admin(auth.uid()) or is_project_lead(project_id, auth.uid())
);
```

## 5. Sub-Projects / Sub-Project Members

Same shape as Projects/Project Members, but scoped one level down — a viewer who
can see the parent Project (per §3) should also be able to see its Sub-Projects;
additionally, direct Sub-Project members and Sub-Project-level downline should see
it even if (edge case) they were somehow not a Project-level member.

```sql
alter table sub_projects enable row level security;

create policy sub_projects_select on sub_projects for select using (
  is_admin(auth.uid())
  or is_project_member(project_id, auth.uid())
  or has_any_downline_on_project(project_id, auth.uid())
  or exists (select 1 from sub_project_members spm
             where spm.sub_project_id = id and spm.user_id = auth.uid())
);

create policy sub_projects_update on sub_projects for update using (
  is_admin(auth.uid())
  or is_project_lead(project_id, auth.uid())
  or is_sub_project_lead(id, auth.uid())
);
```

(`sub_project_members` policies mirror `project_members` above, scoped to
`sub_project_id` and gated by `is_sub_project_lead` instead of `is_project_lead`.)

## 6. Tasks / Sub-Tasks

Visibility inherits from the parent sub-project's visibility (join up to get
`project_id`, reuse the same checks). Employees additionally always see tasks/sub-
tasks they are personally assigned to, even in the rare case their broader project
visibility is ambiguous (defensive — shouldn't be reachable if §3–5 are correct, but
cheap to include):

```sql
alter table tasks enable row level security;

create policy tasks_select on tasks for select using (
  is_admin(auth.uid())
  or exists (
    select 1 from sub_projects sp
    where sp.id = sub_project_id
      and (
        is_project_member(sp.project_id, auth.uid())
        or has_any_downline_on_project(sp.project_id, auth.uid())
      )
  )
  or exists (select 1 from task_assignees ta where ta.task_id = id and ta.user_id = auth.uid())
);

create policy tasks_update on tasks for update using (
  is_admin(auth.uid())
  or exists (
    select 1 from sub_projects sp
    where sp.id = sub_project_id and is_project_lead(sp.project_id, auth.uid())
  )
  or is_sub_project_lead(sub_project_id, auth.uid())
  or exists (select 1 from task_assignees ta where ta.task_id = id and ta.user_id = auth.uid())
  -- assignees can update their own task's status/completion, not reassign it
);
```

(`sub_tasks` mirrors this, joined up through `tasks → sub_projects`.)

## 7. Notes

```sql
alter table notes enable row level security;

create policy notes_select on notes for select using (
  is_admin(auth.uid())
  or author_id = auth.uid()
  or (project_id is not null and (
        is_project_member(project_id, auth.uid())
        or has_any_downline_on_project(project_id, auth.uid())
      ))
  or (sub_project_id is not null and exists (
        select 1 from sub_project_members spm
        where spm.sub_project_id = notes.sub_project_id and spm.user_id = auth.uid()
      ))
  or (task_id is not null and exists (
        select 1 from sub_projects sp join tasks t on t.sub_project_id = sp.id
        where t.id = notes.task_id and is_project_member(sp.project_id, auth.uid())
      ))
);

create policy notes_insert on notes for insert with check (author_id = auth.uid());
create policy notes_delete on notes for delete using (author_id = auth.uid() or is_admin(auth.uid()));
```

## 8. Meetings / MoM / Action Items

Visibility = project membership or downline, same pattern as Tasks. **Only Leads
publish** (insert/update) MoMs:

```sql
alter table meetings enable row level security;

create policy meetings_select on meetings for select using (
  is_admin(auth.uid())
  or is_project_member(project_id, auth.uid())
  or has_any_downline_on_project(project_id, auth.uid())
);

create policy meetings_insert on meetings for insert with check (
  is_admin(auth.uid()) or is_project_lead(project_id, auth.uid())
);

create policy meetings_update on meetings for update using (
  is_admin(auth.uid()) or is_project_lead(project_id, auth.uid())
);
```

(`meeting_attendees`, `meeting_agenda_items`, `meeting_action_items` inherit via
join to `meetings.project_id`, same select policy shape.)

## 9. Follow-Ups

Members see follow-ups on their projects; owners always see their own; **escalated
ones are visible to all leads on the project** regardless of any other check —
this needs its own explicit clause, not an accidental side effect of the member
check:

```sql
alter table follow_ups enable row level security;

create policy follow_ups_select on follow_ups for select using (
  is_admin(auth.uid())
  or owner_id = auth.uid()
  or is_project_member(project_id, auth.uid())
  or has_any_downline_on_project(project_id, auth.uid())
  or (status = 'Escalated' and is_project_lead(project_id, auth.uid()))
);

create policy follow_ups_update on follow_ups for update using (
  is_admin(auth.uid())
  or owner_id = auth.uid()
  or is_project_lead(project_id, auth.uid())
);
```

## 10. Leave Requests

A requester always sees their own. The resolved approver sees what's routed to
them. Anyone in the requester's upward chain (their manager's manager, etc.) can
also see it — implemented as "viewer is an ancestor of requester on some project,"
reusing the downline function with arguments swapped conceptually (viewer asks "is
requester in MY downline on ANY project," not scoped to one project_id since leave
isn't itself project-scoped):

```sql
alter table leave_requests enable row level security;

create or replace function is_in_downline_any_project(p_viewer_id uuid, p_target_id uuid) returns boolean as $$
  select exists (
    select 1 from project_reporting_lines prl
    where prl.reports_to_user_id = p_viewer_id
      and is_in_downline(prl.project_id, p_viewer_id, p_target_id)
  )
  or exists (
    -- direct report check across any project, cheap pre-check before recursing
    select 1 from project_reporting_lines
    where reports_to_user_id = p_viewer_id and user_id = p_target_id
  );
$$ language sql stable security definer;

create policy leave_requests_select on leave_requests for select using (
  is_admin(auth.uid())
  or requester_id = auth.uid()
  or approver_id = auth.uid()
  or is_in_downline_any_project(auth.uid(), requester_id)
);

create policy leave_requests_insert on leave_requests for insert with check (
  requester_id = auth.uid()
);

-- Only the resolved approver (or admin) can change status/decision fields.
create policy leave_requests_update on leave_requests for update using (
  is_admin(auth.uid()) or approver_id = auth.uid() or requester_id = auth.uid()
  -- requester included so they can Cancel their own request; app-layer logic
  -- (not RLS) should restrict requesters to only changing status to 'Cancelled'
  -- and only when current status is 'Pending' or 'Approved'.
);
```

> Note the comment on `leave_requests_update` — RLS controls *row* access, not
> *column* access. The rule "requester can cancel but not approve their own
> request" must be enforced in the API/server action layer by only allowing a
> `status: 'Cancelled'` transition from that code path, not by RLS alone. Document
> this clearly in the API layer code so it isn't missed.

## 11. Calendar Events (Meetings)

No approval gate, so visibility is simpler — same membership pattern as other
project-linked content, plus always visible to invited attendees regardless of
project membership (you can be invited to a meeting on a project you're not
formally a member of, per the feature spec):

```sql
alter table calendar_events enable row level security;

create policy calendar_events_select on calendar_events for select using (
  is_admin(auth.uid())
  or created_by = auth.uid()
  or exists (select 1 from calendar_event_attendees a where a.calendar_event_id = id and a.user_id = auth.uid())
  or (project_id is not null and (
        is_project_member(project_id, auth.uid())
        or has_any_downline_on_project(project_id, auth.uid())
      ))
);

create policy calendar_events_insert on calendar_events for insert with check (
  created_by = auth.uid()
);

create policy calendar_events_update on calendar_events for update using (
  created_by = auth.uid() or is_admin(auth.uid())
);
```

## 12. Users / Departments / App Settings

```sql
alter table users enable row level security;

-- Everyone can see basic directory info (name/email/role) of all active users —
-- needed for assigning tasks, picking attendees, etc. This is an internal tool,
-- not a multi-tenant system, so org-wide directory visibility is intended.
create policy users_select on users for select using (true);

create policy users_update_self on users for update using (id = auth.uid() or is_admin(auth.uid()));

alter table departments enable row level security;
create policy departments_select on departments for select using (true);
create policy departments_write on departments for all using (is_admin(auth.uid()));

alter table app_settings enable row level security;
create policy app_settings_select on app_settings for select using (true);
create policy app_settings_write on app_settings for all using (is_admin(auth.uid()));
```

---

## 13. Testing Checklist (run before considering RLS done)

- [ ] A 5-level-deep reporting chain (Employee→Lead→SeniorLead→PM→Director) —
      confirm the Director sees the Employee's tasks/follow-ups/leave without any
      hardcoded depth limit breaking it.
- [ ] A user with reporting lines on two different projects pointing to two
      different managers — confirm each manager sees only what their own chain
      entitles them to, not the other manager's chain.
- [ ] Attempting to create a reporting-line cycle (A→B, then try B→A) is rejected.
- [ ] An Employee with zero `project_reporting_lines` rows anywhere can still
      submit a leave request and it routes to the `default_leave_approver_id`.
- [ ] A non-member invited as a calendar attendee can see that one event but
      nothing else on that project.
- [ ] Escalating a follow-up makes it visible to a Lead who is not its owner and
      was not previously a "downline" viewer of that specific owner.
