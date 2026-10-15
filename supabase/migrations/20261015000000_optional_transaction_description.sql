-- A missing note is an empty string, preserving the existing RPC and row types.
alter table public.transactions
  drop constraint transactions_description_check,
  add constraint transactions_description_check
    check (char_length(btrim(description)) between 0 and 160);
