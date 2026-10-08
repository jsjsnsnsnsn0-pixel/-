do $audit$
declare f record; changed integer:=0;
begin
 for f in select p.oid, p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where n.nspname='private' and p.proname in('send_box_gift_batch','send_self_box_gift_batch','resolve_lucky_reward')
 and p.prosrc like '%not in(1,7,77,777)%'
 loop
 execute replace(pg_get_functiondef(f.oid),'not in(1,7,77,777)','not in(1,7,17,77,777)');
 changed:=changed+1;
 end loop;
 if changed<>3 then raise exception 'Unexpected quantity guard count: %',changed;end if;
end
$audit$;
