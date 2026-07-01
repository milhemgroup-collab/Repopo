# Gmail Draft Assistant (v2)

Reviewed source for Matt's permanent daily Gmail draft assistant. The
canonical runtime copy lives in the control folder
`C:\Users\matts\My Drive\MilhemVault\_System\Gmail-Assistant\`; this
directory is where changes get reviewed before deployment (see
`UPGRADE.md`).

The assistant runs as the Codex cron automation `gmail-draft-assistant`
daily at 5:00 AM America/New_York. It scans recent inbox threads, ignores
automated and low-value mail, and creates short draft replies in Matt's
voice inside threads that need a human response. It never sends, archives,
or deletes anything.

## Files

- `config.yaml` — runtime mode, staged Gmail queries, thresholds, skip
  rules, labels, style, paths
- `automation-prompt.md` — the exact behavior prompt the cron automation
  executes
- `init_state.py` — creates or migrates `state.sqlite` (idempotent, run
  every startup)
- `check_health.py` — one-command summary of runs, classifications,
  drafts, skips, and errors
- `tests/fixtures.md` — ten synthetic threads with expected outcomes
- `tests/test-harness-prompt.md` — dry-run regression prompt (no Gmail
  access)
- `UPGRADE.md` — how to deploy these files to the control folder

Runtime-only files that live in the control folder and are not mirrored
here: `state.sqlite`, `daily/` reports and digests.

## What changed from v1

1. **Staged Gmail queries.** One broad `in:inbox newer_than:7d` query became
   three ordered stages: `category:primary` human mail first, a VIP-sender
   catch-up, then an `is:important` catch-all. Promo noise stops competing
   with real mail for the per-run candidate cap, and truncation is reported
   instead of silent.
2. **Deterministic idempotency.** A four-step gate (SQLite row for the
   anchor message, shadow-row handling, any-unsent-draft-in-thread check,
   content hash) replaces "check SQLite and existing drafts". Shadow rows no
   longer permanently block active-mode drafting; they are updated in place.
3. **Confidence and risk gates.** Drafting requires
   `confidence >= min_confidence_to_draft` and low risk; borderline
   `no_reply_needed` calls surface as `AI/Needs Review` instead of being
   silently buried. `max_drafts_per_run` is a hard circuit breaker.
4. **Schema v2.** `email_actions` gains `latest_message_hash`,
   `thread_latest_ts`, `proposed_reply`, `action_taken`, `skip_reason`,
   `risk_level`, `review_status`, `query_stage`, `prompt_version`;
   `run_history` gains per-outcome counts and version stamps.
   `init_state.py` migrates v1 databases in place without data loss.
5. **Prompt-injection defense.** Email content is explicitly untrusted;
   instructions inside messages route the thread to `AI/Needs Review`.
   The prompt also whitelists the only Gmail operations allowed.
6. **Calibration examples.** The prompt now carries positive and negative
   classification examples (tenant repair vs broker blast vs CPA tax ask vs
   phishing) drawn from the real first shadow run.
7. **Reviewable reports.** Run reports gain a Review column, a skipped-mail
   audit table, verbatim draft bodies, and explicit warnings; the digest
   carries unresolved items forward.
8. **Ops tooling.** `check_health.py` for daily state inspection,
   `--check` mode on `init_state.py`, crash-visible `run_history` start
   rows, per-thread error isolation, and 90-day report retention.
9. **Test harness.** Ten fixtures covering drafts, skips, high-risk, and
   idempotency, plus a no-Gmail dry-run prompt to run before flipping any
   change live.

## Architecture decision: prompt-driven with deterministic edges

The assistant stays a Codex prompt automation (Matt's preference: no Zapier,
no Apps Script), but everything that must be exact is pushed into
deterministic artifacts: `config.yaml` owns the knobs, `init_state.py` owns
the schema, SQLite owns idempotency, and the prompt's decision table owns
the mapping from classification to action. If drift is still observed after
a few weeks of v2 reports, the next step is a small local runner script that
performs retrieval, skip rules, and idempotency in code and leaves only
classification and draft wording to the model.

## SQLite schema (v2)

`email_actions` — one row per processed anchor message:
`message_id` (unique), `thread_id`, `received_at`, `sender`, `subject`,
`classification`, `confidence`, `reason`, `risk_level`, `draft_created`,
`draft_id`, `proposed_reply`, `action_taken`
(`drafted|labeled|skipped|no_action_needed|error`), `skip_reason`,
`labels_applied`, `latest_message_hash`, `thread_latest_ts`, `query_stage`,
`digest_date`, `run_mode`, `prompt_version`, `review_status`, `created_at`.

`run_history` — one row per run: `run_started_at`, `run_finished_at`,
`run_mode`, `candidate_count`, `processed_count`, `draft_count`,
`skipped_count`, `needs_review_count`, `reps_count`, `no_reply_count`,
`error_count`, `config_version`, `prompt_version`, `notes`.

`schema_meta` — `schema_version` marker used by the migrator.

## Runtime rules

- Draft-only forever unless Matt explicitly changes that.
- `shadow` mode classifies and logs but performs no Gmail mutations.
- The Gmail connector is the only mail mutation path. No Zapier, no Apps
  Script, no auto-send.
- Only `AI/*` labels are ever touched.
