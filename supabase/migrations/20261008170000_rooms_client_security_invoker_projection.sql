-- Additive, RLS-preserving projection for mobile clients.
-- SECURITY INVOKER is critical: RLS on public.rooms remains active for the
-- authenticated caller; this view has no privileged bypass.
-- No table grant is revoked while Beta.8 and other legacy APKs are installed.
create or replace view public.rooms_client
with (security_invoker = true)
as
select
  id,owner_id,name,description,image_url,is_active,max_seats,
  created_at,updated_at,category,is_private,is_vip,tags,
  owner_public_id,owner_display_name,owner_avatar_url,
  chat_enabled,welcome_message,external_image_url,
  gift_effects_enabled,vehicle_effects_enabled,entrance_effects_enabled,
  internal_background_url
from public.rooms;

-- Allow signed-in clients to read their RLS-permitted rooms via PostgREST.
revoke all on public.rooms_client from public, anon;
grant select on public.rooms_client to authenticated;
comment on view public.rooms_client is 'RLS-invoker mobile projection of visible rooms; intentionally excludes password_hash. Do not grant access to anonymous visitors.';
