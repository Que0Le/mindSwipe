-- Let a user delete their OWN attempts (powers the "Clear all" action in the
-- PWA). Reaction already has a delete policy; attempts did not. RLS still scopes
-- every delete to auth.uid()'s rows.

create policy attempt_delete on public.attempt
    for delete to authenticated using (user_id = auth.uid());

grant delete on public.attempt to authenticated;

notify pgrst, 'reload schema';
