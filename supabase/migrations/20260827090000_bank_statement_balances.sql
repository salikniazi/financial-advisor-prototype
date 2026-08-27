-- Lime: bank statement pipeline, Stage B addition
--
-- Stage A's bank_statement_imports didn't have anywhere to record a
-- statement's stated opening/closing balance -- Stage B's metadata
-- extraction pass captures these when a statement prints them explicitly.
-- Nothing computes or reconstructs these values; that's Stage C.

alter table bank_statement_imports
  add column if not exists opening_balance numeric,
  add column if not exists closing_balance numeric;
