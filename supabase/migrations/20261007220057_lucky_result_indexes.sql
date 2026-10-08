create index if not exists lucky_results_sender_created_idx
  on public.lucky_results(sender_id,created_at desc);
create index if not exists lucky_results_gift_created_idx
  on public.lucky_results(gift_id,created_at desc);
