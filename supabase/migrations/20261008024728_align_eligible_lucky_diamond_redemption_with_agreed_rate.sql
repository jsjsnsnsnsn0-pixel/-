-- Align manual eligible Lucky-source diamond conversion with the agreed 30% rate.
-- Existing diamond lots and conversion history are untouched.
create or replace function private.preview_diamond_redemption(p_diamonds bigint) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); state jsonb; f bigint; l bigint; coins bigint;
begin
 if u is null then raise exception 'authentication required'; end if;
 if p_diamonds is null or p_diamonds<=0 or p_diamonds>9007199254740991 then raise exception 'invalid diamond amount'; end if;
 state:=private.wallet_diamond_state();
 if (state->>'diamonds_balance')::bigint<p_diamonds then raise exception 'insufficient diamonds'; end if;
 f:=least(p_diamonds,(state->>'fixed_diamonds')::bigint); l:=p_diamonds-f;
 if l>(state->>'lucky_diamonds')::bigint then raise exception 'insufficient redeemable diamonds'; end if;
 coins:=(f/10)*3+((f%10)*3)/10+(l/10)*3+((l%10)*3)/10;
 if coins<=0 then raise exception 'diamond amount is too small'; end if;
 return jsonb_build_object('diamonds_amount',p_diamonds,'fixed_diamonds',f,'lucky_diamonds',l,'coins_amount',coins);
end $$;

notify pgrst,'reload schema';
