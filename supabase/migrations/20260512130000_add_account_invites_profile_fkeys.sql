-- Add foreign keys from account_invites to user_profiles
-- This allows queries to join owner and invitee profile information

-- Add foreign key from account_invites.owner_id to user_profiles
alter table public.account_invites
add constraint account_invites_owner_profile_fkey 
foreign key (owner_id) 
references public.user_profiles(user_id) 
on delete cascade;

-- Add foreign key from account_invites.invitee_id to user_profiles
alter table public.account_invites
add constraint account_invites_invitee_profile_fkey 
foreign key (invitee_id) 
references public.user_profiles(user_id) 
on delete cascade;

-- Add indexes for join performance
create index if not exists idx_account_invites_owner
on public.account_invites(owner_id);

create index if not exists idx_account_invites_invitee
on public.account_invites(invitee_id);
