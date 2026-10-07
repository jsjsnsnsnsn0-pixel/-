-- Normal gifts are paid atomically at send time. No client can pre-purchase
-- gift stock. Preserve historical entitlements and their safe consumption RPC.
revoke all on function public.buy_gift_stock(text,uuid),private.buy_gift_stock(text,uuid) from public,anon,authenticated;
-- An owner can still identify a delisted possession in their bag; storefront
-- queries continue filtering is_active. Other users see only active products.
alter policy catalog_read on public.store_catalog using(is_active or exists(select 1 from public.store_purchases p where p.item_id=store_catalog.id and p.user_id=(select auth.uid())));
