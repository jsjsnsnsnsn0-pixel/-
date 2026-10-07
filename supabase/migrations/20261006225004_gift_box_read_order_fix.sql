create or replace function private.gift_box_state()returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid()is null then raise exception 'authentication required';end if;
 return jsonb_build_object('server_now',clock_timestamp(),
 'categories',coalesce((select jsonb_agg(to_jsonb(c)order by sort_order,id)from public.gift_categories c where enabled),'[]'::jsonb),
 'gifts',coalesce((select jsonb_agg(to_jsonb(g)order by g.price,g.id)from public.gift_catalog g join public.gift_categories c on c.id=g.category_id and c.enabled where g.is_active),'[]'::jsonb),
 'inventory',coalesce((select jsonb_agg(to_jsonb(l)order by created_at,id)from public.gift_inventory_lots l where l.user_id=auth.uid()and remaining>0 and(expires_at is null or expires_at>clock_timestamp())),'[]'::jsonb),
 'banner',(select jsonb_build_object('title',title,'subtitle',subtitle,'image_url',image_url)from public.gift_box_banners where is_active and starts_at<=now()and(ends_at is null or ends_at>now())order by starts_at desc,id limit 1));
end$$;
