-- Lime: bank statement pipeline, vision-extraction revision
--
-- Adds three columns to bank_statement_imports so the review UI can
-- distinguish "verified against the statement's own running balance" from
-- "parsed, but unprovable" (a statement with no balance column) from
-- "parsed with issues" -- these must never look the same to the user.
--
-- The layout-cache table originally planned alongside this (bank_statement_
-- layouts) was dropped: the pipeline moved to per-page vision extraction
-- verified against the PDF's text layer, which needs no cached column
-- geometry to reuse.

alter table bank_statement_imports
  add column if not exists parse_method text
    check (parse_method in ('vision', 'deterministic', 'fallback')),
  add column if not exists validation_ok boolean,
  add column if not exists validation_note text;

comment on column bank_statement_imports.parse_method is
  'How this statement''s rows were produced: vision (per-page LLM extraction, the normal path), deterministic (statementTable.ts column parsing), or fallback (whole-statement LLM extraction, last resort).';
comment on column bank_statement_imports.validation_ok is
  'True only when every row reconciled against the statement''s own running balance with no hard issues. Null until processing completes. A statement with no balance column can still import successfully but this stays false/null -- it was parseable, not provably correct, and the UI must show that distinction rather than a blanket green check.';
comment on column bank_statement_imports.validation_note is
  'Human-readable summary of validation results (see validate.ts:summarizeValidation) plus any per-row trust issues from verifyExtraction.ts. No transaction text.';
