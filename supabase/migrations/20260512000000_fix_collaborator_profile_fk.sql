-- Add foreign key from project_collaborators to user_profiles
-- This allows the Supabase client to join collaborator profiles

-- Add foreign key constraint
alter table public.project_collaborators
add constraint project_collaborators_collaborator_profile_fkey 
foreign key (collaborator_id) 
references public.user_profiles(user_id) 
on delete cascade;

-- Also add index for the join performance
create index if not exists idx_project_collaborators_profile
on public.project_collaborators(collaborator_id);
