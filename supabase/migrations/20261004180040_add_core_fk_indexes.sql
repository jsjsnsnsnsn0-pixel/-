create index if not exists recharge_requests_agent_id_idx on public.recharge_requests(agent_id);
create index if not exists recharge_requests_package_id_idx on public.recharge_requests(package_id);
create index if not exists recharge_requests_user_id_idx on public.recharge_requests(user_id);
create index if not exists room_members_user_id_idx on public.room_members(user_id);
create index if not exists rooms_owner_id_idx on public.rooms(owner_id);
create index if not exists wallet_transactions_recharge_request_id_idx on public.wallet_transactions(recharge_request_id);
create index if not exists wallet_transactions_user_id_idx on public.wallet_transactions(user_id);
