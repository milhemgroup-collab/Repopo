# Gmail Draft Assistant — Test Harness Prompt

Paste this prompt into a Codex/Claude session to regression-test the
assistant's decision logic without touching Gmail. Run it after any change
to `config.yaml` or `automation-prompt.md`, before the next 5:00 AM run.

---

You are dry-run testing the Gmail draft assistant. Read these files from
`C:\Users\matts\My Drive\MilhemVault\_System\Gmail-Assistant\`:

1. `config.yaml`
2. `automation-prompt.md`
3. `tests\fixtures.md`

Rules for this test session:

- Do NOT call any Gmail tools. No searches, no drafts, no labels.
- Do NOT write to `state.sqlite`.
- Treat each fixture in `fixtures.md` as if it were a live candidate thread
  under `run_mode: active`, and simulate the full per-thread procedure from
  `automation-prompt.md` (skip rules, idempotency gate, classification,
  decision table, drafting).
- For fixtures that expect a draft, write the exact draft body you would
  have created, and check it against the style rules (short, no em dashes,
  signs off as Matt, no invented facts or commitments).
- For F09 and F10, assume the preconditions described in the fixture
  (existing unsent draft; existing `draft_created = 1` row) and show which
  idempotency step fires.

Output:

1. The scorecard table from `fixtures.md` with the Pass column filled in
   (`pass` / `FAIL` with a one-line explanation for any failure).
2. The simulated draft bodies for F01, F02, F03.
3. A short list of any ambiguities in `automation-prompt.md` or
   `config.yaml` that made a decision unclear. These become the next
   config/prompt fixes.

A release is good when all ten fixtures pass and the drafts read like Matt.
