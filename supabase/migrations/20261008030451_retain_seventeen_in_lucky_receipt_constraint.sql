alter table public.lucky_results drop constraint lucky_results_quantity_check;
alter table public.lucky_results add constraint lucky_results_quantity_check check(quantity in(1,7,17,77,777));
