-- TotiChat Beta: safe catalog administration without deleting existing gifts or store inventory.
create function public.dashboard_gift_catalog() returns jsonb
language plpgsql stable security definer set search_path='' as $$
begin
 perform private.dashboard_require('gifts.manage');
 return coalesce((select jsonb_agg(to_jsonb(g) order by g.id) from(
  select id,name,price,is_active,category_id,diamond_source_type,
   preview_url,animation_type,rarity,icon from public.gift_catalog
  order by id limit 500
 ) g),'[]'::jsonb);
end $$;
create function public.dashboard_store_catalog() returns jsonb
language plpgsql stable security definer set search_path='' as $$
begin
 perform private.dashboard_require('store.manage');
 return coalesce((select jsonb_agg(to_jsonb(c) order by c.category,c.id) from(
  select id,name,price,is_active,category,currency,is_reward,duration_days,
   vip_level,relationship_type_id,preview_url,icon from public.store_catalog
  order by category,id limit 500
 ) c),'[]'::jsonb);
end $$;
create function public.dashboard_update_gift(
 p_id text,p_price bigint,p_enabled boolean,p_reason text
) returns jsonb language plpgsql security definer set search_path='' as $$
declare previous public.gift_catalog%rowtype;next public.gift_catalog%rowtype;
begin
 perform private.dashboard_require('gifts.manage');
 if coalesce(p_id,'')='' or p_price is null or p_price<=0 or p_price>10000000000
  or p_enabled is null or length(btrim(coalesce(p_reason,''))) not between 10 and 500
 then raise exception 'invalid gift admin edit';end if;
 select * into previous from public.gift_catalog where id=p_id for update;
 if not found then raise exception 'gift not found';end if;
 if previous.price=p_price and previous.is_active=p_enabled then
  return jsonb_build_object('changed',false,'gift',to_jsonb(previous));end if;
 update public.gift_catalog set price=p_price,is_active=p_enabled
  where id=p_id returning * into next;
 insert into public.dashboard_audit(actor_id,action,metadata)
 values(auth.uid(),'gifts.manage',jsonb_build_object(
 'gift_id',p_id,'old_price',previous.price,'new_price',next.price,
 'old_active',previous.is_active,'new_active',next.is_active,'reason',btrim(p_reason)));
 return jsonb_build_object('changed',true,'gift',to_jsonb(next));
end $$;
create function public.dashboard_update_store(
 p_id text,p_price bigint,p_enabled boolean,p_reason text
) returns jsonb language plpgsql security definer set search_path='' as $$
declare previous public.store_catalog%rowtype;next public.store_catalog%rowtype;
begin
 perform private.dashboard_require('store.manage');
 if coalesce(p_id,'')='' or p_price is null or p_price<=0 or p_price>10000000000
  or p_enabled is null or length(btrim(coalesce(p_reason,''))) not between 10 and 500
 then raise exception 'invalid store admin edit';end if;
 select * into previous from public.store_catalog where id=p_id for update;
 if not found then raise exception 'store item not found';end if;
 if previous.is_reward then raise exception 'reward item is not a sale product';end if;
 if previous.price=p_price and previous.is_active=p_enabled then
  return jsonb_build_object('changed',false,'product',to_jsonb(previous));end if;
 update public.store_catalog set price=p_price,is_active=p_enabled
  where id=p_id returning * into next;
 insert into public.dashboard_audit(actor_id,action,metadata)
 values(auth.uid(),'store.manage',jsonb_build_object(
 'product_id',p_id,'old_price',previous.price,'new_price',next.price,
 'old_active',previous.is_active,'new_active',next.is_active,'reason',btrim(p_reason)));
 return jsonb_build_object('changed',true,'product',to_jsonb(next));
end $$;
do $$declare signature text;begin
 foreach signature in array array[
  'dashboard_gift_catalog()','dashboard_store_catalog()',
  'dashboard_update_gift(text,bigint,boolean,text)',
  'dashboard_update_store(text,bigint,boolean,text)'
 ] loop
  execute format('revoke all on function public.%s from public,anon',signature);
  execute format('grant execute on function public.%s to authenticated',signature);
 end loop;
end $$;
notify pgrst,'reload schema';
