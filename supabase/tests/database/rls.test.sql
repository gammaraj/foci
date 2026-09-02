-- Live RLS checks against a running local Supabase (supabase test db).
-- Impersonation uses request.jwt.claims + SET LOCAL ROLE authenticated.

begin;
select plan(17);

create or replace function rls_make_user(p_id uuid, p_email text)
returns void
language plpgsql
security definer
set search_path = auth, public, extensions
as $$
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token, email_change,
    email_change_token_new, recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000',
    p_id,
    'authenticated',
    'authenticated',
    p_email,
    crypt('test-password', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  );
exception
  when unique_violation then
    null;
end;
$$;

select rls_make_user('11111111-1111-1111-1111-111111111111', 'rls-owner@example.com');
select rls_make_user('22222222-2222-2222-2222-222222222222', 'rls-editor@example.com');
select rls_make_user('33333333-3333-3333-3333-333333333333', 'rls-viewer@example.com');
select rls_make_user('44444444-4444-4444-4444-444444444444', 'rls-stranger@example.com');
select rls_make_user('55555555-5555-5555-5555-555555555555', 'rls-acct-editor@example.com');
select rls_make_user('66666666-6666-6666-6666-666666666666', 'rls-acct-viewer@example.com');

insert into public.projects (id, user_id, name, created_at)
values ('proj-shared', '11111111-1111-1111-1111-111111111111', 'Shared', 1);

insert into public.tasks (id, user_id, title, created_at, project_id)
values ('task-existing', '11111111-1111-1111-1111-111111111111', 'Existing', 1, 'proj-shared');

insert into public.project_collaborators (project_id, owner_id, collaborator_id, role)
values
  ('proj-shared', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'editor'),
  ('proj-shared', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'viewer');

insert into public.account_collaborators (owner_id, collaborator_id, role)
values
  ('11111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555555', 'editor'),
  ('11111111-1111-1111-1111-111111111111', '66666666-6666-6666-6666-666666666666', 'viewer');

create or replace function rls_login(p_uid uuid)
returns void
language plpgsql
as $$
begin
  perform set_config('request.jwt.claim.sub', p_uid::text, true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);
  perform set_config('request.jwt.claim.email', (select email from auth.users where id = p_uid), true);
  perform set_config(
    'request.jwt.claims',
    json_build_object(
      'sub', p_uid::text,
      'role', 'authenticated',
      'email', (select email from auth.users where id = p_uid)
    )::text,
    true
  );
end;
$$;

-- Editor can read shared tasks
select rls_login('22222222-2222-2222-2222-222222222222');
set local role authenticated;
select is(
  (select count(*)::int from public.tasks where id = 'task-existing'),
  1,
  'project editor can select shared tasks'
);
reset role;

-- Viewer can read
select rls_login('33333333-3333-3333-3333-333333333333');
set local role authenticated;
select is(
  (select count(*)::int from public.tasks where id = 'task-existing'),
  1,
  'project viewer can select shared tasks'
);
reset role;

-- Stranger cannot read
select rls_login('44444444-4444-4444-4444-444444444444');
set local role authenticated;
select is(
  (select count(*)::int from public.tasks where id = 'task-existing'),
  0,
  'stranger cannot select owner tasks'
);
reset role;

-- Editor can update
select rls_login('22222222-2222-2222-2222-222222222222');
set local role authenticated;
select lives_ok(
  $$update public.tasks set title = 'Edited' where id = 'task-existing' and user_id = '11111111-1111-1111-1111-111111111111'$$,
  'project editor can update shared tasks'
);
reset role;

-- Viewer cannot update
select rls_login('33333333-3333-3333-3333-333333333333');
set local role authenticated;
select is(
  (select title from public.tasks where id = 'task-existing'),
  'Edited',
  'setup: editor update persisted'
);
update public.tasks set title = 'Viewer should fail' where id = 'task-existing';
select is(
  (select title from public.tasks where id = 'task-existing'),
  'Edited',
  'project viewer cannot update shared tasks'
);
reset role;

-- Editor can insert as owner
select rls_login('22222222-2222-2222-2222-222222222222');
set local role authenticated;
select lives_ok(
  $$insert into public.tasks (id, user_id, title, created_at, project_id)
    values ('task-from-editor', '11111111-1111-1111-1111-111111111111', 'From editor', 2, 'proj-shared')$$,
  'project editor can insert tasks owned by the project owner'
);
reset role;

select is(
  (select count(*)::int from public.tasks where id = 'task-from-editor'),
  1,
  'editor-inserted task exists'
);

-- Editor cannot insert as themselves
select rls_login('22222222-2222-2222-2222-222222222222');
set local role authenticated;
select throws_ok(
  $$insert into public.tasks (id, user_id, title, created_at, project_id)
    values ('task-stolen', '22222222-2222-2222-2222-222222222222', 'Stolen', 3, 'proj-shared')$$,
  '42501',
  'project editor cannot insert tasks under their own user_id'
);
reset role;

-- Viewer cannot insert
select rls_login('33333333-3333-3333-3333-333333333333');
set local role authenticated;
select throws_ok(
  $$insert into public.tasks (id, user_id, title, created_at, project_id)
    values ('task-from-viewer', '11111111-1111-1111-1111-111111111111', 'From viewer', 4, 'proj-shared')$$,
  '42501',
  'project viewer cannot insert tasks'
);
reset role;

-- Editor cannot delete
select rls_login('22222222-2222-2222-2222-222222222222');
set local role authenticated;
delete from public.tasks where id = 'task-existing';
select is(
  (select count(*)::int from public.tasks where id = 'task-existing'),
  1,
  'project editor cannot delete tasks'
);
reset role;

-- Owner can delete
select rls_login('11111111-1111-1111-1111-111111111111');
set local role authenticated;
delete from public.tasks where id = 'task-existing';
select is(
  (select count(*)::int from public.tasks where id = 'task-existing'),
  0,
  'owner can delete their tasks'
);
reset role;

-- Account editor can insert
select rls_login('55555555-5555-5555-5555-555555555555');
set local role authenticated;
select lives_ok(
  $$insert into public.tasks (id, user_id, title, created_at, project_id)
    values ('task-from-acct-editor', '11111111-1111-1111-1111-111111111111', 'From account editor', 5, 'proj-shared')$$,
  'account editor can insert tasks for the owner'
);
reset role;

-- Account viewer cannot insert
select rls_login('66666666-6666-6666-6666-666666666666');
set local role authenticated;
select throws_ok(
  $$insert into public.tasks (id, user_id, title, created_at, project_id)
    values ('task-from-acct-viewer', '11111111-1111-1111-1111-111111111111', 'From account viewer', 6, 'proj-shared')$$,
  '42501',
  'account viewer cannot insert tasks'
);
reset role;

-- Account editor can update
select rls_login('55555555-5555-5555-5555-555555555555');
set local role authenticated;
select lives_ok(
  $$update public.tasks set title = 'Account edited' where id = 'task-from-editor'$$,
  'account editor can update owner tasks'
);
reset role;

-- Editor cannot change owner or project
select rls_login('22222222-2222-2222-2222-222222222222');
set local role authenticated;
select throws_ok(
  $$update public.tasks set user_id = '22222222-2222-2222-2222-222222222222' where id = 'task-from-editor'$$,
  'Editors cannot change task owner or project',
  'editor cannot reassign task owner'
);
reset role;

-- Settings stay owner-only
insert into public.settings (user_id) values ('11111111-1111-1111-1111-111111111111');
select rls_login('22222222-2222-2222-2222-222222222222');
set local role authenticated;
select is(
  (select count(*)::int from public.settings where user_id = '11111111-1111-1111-1111-111111111111'),
  0,
  'collaborators cannot read owner settings'
);
reset role;

select * from finish();
rollback;
