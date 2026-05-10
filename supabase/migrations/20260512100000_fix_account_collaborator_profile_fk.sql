-- Add foreign key from account_collaborators to user_profiles
-- This allows the Supabase client to join collaborator profiles

-- Add foreign key constraint
alter table public.account_collaborators
add constraint account_collaborators_collaborator_profile_fkey 
foreign key (collaborator_id) 
references public.user_profiles(user_id) 
on delete cascade;

-- Add index for join performance
create index if not exists idx_account_collaborators_profile
on public.account_collaborators(collaborator_id);
