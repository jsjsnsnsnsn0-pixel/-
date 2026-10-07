-- Extend the deployed Lucky Gifts implementation; do not create any second reward trigger.
-- This makes room announcements work through existing authenticated Supabase Realtime.
do $$ begin
 alter publication supabase_realtime add table public.room_lucky_feed;
exception when duplicate_object then null;
end $$;

-- Existing Lucky reward entries allow the same configurable, safe quantities as Gift Box.
alter table public.lucky_results drop constraint if exists lucky_results_quantity_check;
alter table public.lucky_results add constraint lucky_results_quantity_check
 check(quantity between 1 and 777);
notify pgrst,'reload schema';
