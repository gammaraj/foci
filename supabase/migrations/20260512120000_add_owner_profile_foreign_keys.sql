-- Add foreign keys for owner_id fields to user_profiles
-- This allows queries to join owner profile information

-- Add foreign key from project_collaborators.owner_id to user_profiles
alter table public.project_collaborators
add constraint project_collaborators_owner_profile_fkey 
foreign key (owner_id) 
references public.user_profiles(user_id) 
on delete cascade;

-- Add foreign key from account_collaborators.owner_id to user_profiles  
alter table public.account_collaborators
add constraint account_collaborators_owner_profile_fkey 
foreign key (owner_id) 
references public.user_profiles(user_id) 
on delete cascade;

-- Add index for join performance
create index if not exists idx_project_collaborators_owner
on public.project_collaborators(owner_id);

create index if not exists idx_account_collaborators_owner
on public.account_collaborators(owner_id);
