-- Add foreign key from collaboration_invites to user_profiles for owner
-- This allows displaying owner info without accessing auth.users

-- Add foreign key constraint for owner
alter table public.collaboration_invites
add constraint collaboration_invites_owner_profile_fkey 
foreign key (owner_id) 
references public.user_profiles(user_id) 
on delete cascade;

-- Add foreign key constraint for invitee (can be null)
alter table public.collaboration_invites
add constraint collaboration_invites_invitee_profile_fkey 
foreign key (invitee_id) 
references public.user_profiles(user_id) 
on delete cascade;
