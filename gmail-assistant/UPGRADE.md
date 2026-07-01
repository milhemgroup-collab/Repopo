# Upgrading the control folder to v2

Deploy target:
`C:\Users\matts\My Drive\MilhemVault\_System\Gmail-Assistant\`

The upgrade is non-destructive: `state.sqlite` is migrated in place and the
`daily\` history is untouched. Total time is about ten minutes plus one
shadow run.

## Steps

1. **Back up state.** Copy `state.sqlite` to `state.sqlite.bak-v1` inside
   the control folder.
2. **Copy the v2 files** from this directory over the control folder:
   `config.yaml`, `automation-prompt.md`, `init_state.py`,
   `check_health.py`, `README.md`, and the `tests\` folder.
3. **Fill in `contacts.vip`** in the deployed `config.yaml` with the real
   addresses that must never be filtered as noise: tenants, property
   managers, CPA, attorney, lender, family. (Left empty in the repo copy on
   purpose; real addresses stay out of git.)
4. **Migrate the database:**
   ```
   python init_state.py state.sqlite
   python init_state.py state.sqlite --check
   ```
   The check should print `schema version: v2 ... OK` and both tables.
5. **Dry-run the logic** (no Gmail access): paste
   `tests\test-harness-prompt.md` into a Codex session and confirm all ten
   fixtures pass.
6. **One shadow validation run:** set `assistant.run_mode: shadow` in the
   deployed `config.yaml`, trigger the automation once manually, and read
   the run report in `daily\`. Check that the stage counts look sane, the
   skip table contains only noise, and every proposed draft is one you
   would actually send.
7. **Go active:** set `assistant.run_mode: active`. The next 5:00 AM run
   creates real drafts.
8. **Daily/weekly review loop:** skim the run report each morning and mark
   the Review column (`ok` / `wrong`) on anything notable;
   `python check_health.py` shows the rolling picture. Misclassifications
   become additions to `skip_rules`, `contacts.vip`, or the prompt's
   example list — edit here in the repo first, then redeploy from step 2.

## Rollback

Copy `state.sqlite.bak-v1` back over `state.sqlite` and restore the v1
`config.yaml` and `automation-prompt.md` (git history has them). The v2
schema is backward compatible with the v1 prompt, so rolling back the
prompt alone is also safe.
