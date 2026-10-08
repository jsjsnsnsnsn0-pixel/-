create index if not exists gift_events_monthly_recipient_idx
  on public.gift_events(recipient_id,diamond_source_type,created_at);
create index if not exists gift_events_agency_receive_idx
  on public.gift_events(agency_id_at_receive,created_at)
  where agency_id_at_receive is not null;
create index if not exists gift_events_agency_owner_receive_idx
  on public.gift_events(agency_owner_id_at_receive,created_at)
  where agency_owner_id_at_receive is not null;
create index if not exists monthly_settlements_redemption_idx
  on public.monthly_settlements(diamond_redemption_id)
  where diamond_redemption_id is not null;
create index if not exists monthly_settlement_agencies_agency_idx
  on public.monthly_settlement_agencies(agency_id);
create index if not exists monthly_settlement_agencies_owner_idx
  on public.monthly_settlement_agencies(agency_owner_id);
