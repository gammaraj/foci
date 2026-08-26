-- Timer alarm sound/enabled, synced for signed-in users.
alter table public.settings
  add column if not exists alarm_enabled boolean not null default true,
  add column if not exists alarm_sound text not null default 'digital';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'settings_alarm_sound_check'
  ) then
    alter table public.settings
      add constraint settings_alarm_sound_check
      check (alarm_sound in ('chime', 'bell', 'digital', 'wood', 'soft'));
  end if;
end $$;
