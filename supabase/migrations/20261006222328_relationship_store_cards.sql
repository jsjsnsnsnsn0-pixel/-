-- Cosmetics extend the existing catalog/ledger; no products or prices are invented.
alter table public.store_catalog drop constraint store_catalog_category_check;
alter table public.store_catalog add constraint store_catalog_category_check check(category in ('frames','cars','bubbles','badges','vip','entrances','cards'));
alter table public.store_catalog add column relationship_type_id text references public.cp_types(id);
alter table public.store_catalog add column presentation jsonb not null default '{}' check(jsonb_typeof(presentation)='object');
alter table public.store_catalog add column preview_url text check(preview_url is null or preview_url like 'https://%' or preview_url like '/%');
alter table public.store_catalog add constraint store_card_type check((category='cards')=(relationship_type_id is not null));
create table private.relationship_card_equipment(
 relationship_id uuid primary key references public.couples(id) on delete cascade,
 item_id text not null references public.store_catalog(id),
 selected_by uuid not null references public.profiles(id) on delete cascade,
 updated_at timestamptz not null default now()
);
alter table private.relationship_card_equipment enable row level security;
revoke all on private.relationship_card_equipment from public,anon,authenticated;
create function private.relationship_card(p_relation_id uuid) returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('id',i.id,'name',i.name,'presentation',i.presentation)
 from private.relationship_card_equipment e join public.couples c on c.id=e.relationship_id
 join public.store_catalog i on i.id=e.item_id and i.category='cards' and i.is_active and i.relationship_type_id=c.type_id
 where c.id=p_relation_id and c.accepted_at is not null and c.ended_at is null and e.selected_by in(c.user_a,c.user_b)
 and exists(select 1 from public.store_purchases p where p.user_id=e.selected_by and p.item_id=i.id and(p.expires_at is null or p.expires_at>clock_timestamp()))
$$;
revoke all on function private.relationship_card(uuid) from public,anon,authenticated;
-- Preserve the validated canonical read and enrich it with one shared cosmetic.
do $$declare def text;begin
 select pg_get_functiondef('private.profile_cp_by_type(bigint,text)'::regprocedure) into def;
 if position('''presentation'',t.presentation' in def)=0 then raise exception 'unexpected profile relation definition';end if;
 def:=replace(def,'''presentation'',t.presentation','''card'',private.relationship_card(c.id),''presentation'',t.presentation || coalesce(private.relationship_card(c.id)->''presentation'',''{}''::jsonb)');execute def;
end$$;
create function private.equip_relationship_card(p_relation_id uuid,p_item_id text)returns void language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid();c public.couples%rowtype;pid bigint;valid jsonb;begin
 if u is null then raise exception 'authentication required';end if;
 select * into c from public.couples where id=p_relation_id;
 if not found or u not in(c.user_a,c.user_b)then raise exception 'not authorized';end if;
 -- Same lock order as CP mutations and purchases; serialize both participants.
 perform 1 from public.profiles where id in(c.user_a,c.user_b)order by id for update;
 select * into c from public.couples where id=p_relation_id for update;
 select public_id into pid from public.profiles where id=u;
 valid:=private.profile_cp_by_type(pid,c.type_id);
 if valid is null or valid->>'relation_id'<>p_relation_id::text then raise exception 'active matching relationship required';end if;
 if p_item_id is null then delete from private.relationship_card_equipment where relationship_id=c.id;return;end if;
 perform 1 from public.store_catalog where id=p_item_id and category='cards' and is_active and relationship_type_id=c.type_id for share;
 if not found then raise exception 'card type mismatch';end if;
 if not exists(select 1 from public.store_purchases where user_id=u and item_id=p_item_id and(expires_at is null or expires_at>clock_timestamp()))then raise exception 'valid ownership required';end if;
 insert into private.relationship_card_equipment(relationship_id,item_id,selected_by)values(c.id,p_item_id,u)
 on conflict(relationship_id)do update set item_id=excluded.item_id,selected_by=excluded.selected_by,updated_at=now();
end$$;
create function public.equip_relationship_card(p_relation_id uuid,p_item_id text)returns void language sql security invoker set search_path='' as $$select private.equip_relationship_card(p_relation_id,p_item_id)$$;
revoke all on function private.equip_relationship_card(uuid,text),public.equip_relationship_card(uuid,text)from public,anon;
grant execute on function private.equip_relationship_card(uuid,text),public.equip_relationship_card(uuid,text)to authenticated;
-- Entrance cosmetics reuse existing equipment and ownership validation.
do $$declare def text;begin
 select pg_get_functiondef('private.equip_store_item(text,text)'::regprocedure) into def;
 def:=replace(def,'''frames'',''cars'',''bubbles'',''badges''','''frames'',''cars'',''bubbles'',''badges'',''entrances''');execute def;
end$$;
notify pgrst,'reload schema';
