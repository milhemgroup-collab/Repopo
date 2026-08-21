---
name: repstracker-candidate-search
description: >-
  Sweeps every connected source (Gmail AI/REPS Candidate labels, Google
  Calendar, the maintenance log, Google Drive activity, brain-dump reports,
  and session harvests) for real-estate work Matt performed but has not yet
  locked as time entries in REPStracker, then produces a deduplicated,
  evidence-backed candidate list formatted for one-pass entry and locking.
  Use this skill whenever the user mentions REPStracker, REPS hours, REPS
  candidates, locking hours, logging real estate time, unlogged or missing
  hours, a REPS sweep or REPS review, material participation hours, or asks
  "what hours am I missing" or to catch up on time tracking — even if they
  do not name REPStracker explicitly.
---

# REPStracker Candidate Search

Find real-estate work Matt already did — scattered across email, calendar,
maintenance logs, files, and conversation notes — and turn it into a clean,
deduplicated list of time entries ready to lock in REPStracker.

## Why this exists

Real Estate Professional Status (REPS) hinges on contemporaneous,
defensible hour records. Matt does the work but the evidence of it lands in
five different places, and anything not entered into REPStracker promptly
is effectively lost at audit time. This skill closes that gap: it is the
periodic sweep that catches everything the day-to-day tools surfaced but
nobody entered.

Two rules shape everything below:

1. **Evidence first.** Every candidate must point at a real artifact (an
   email thread, a calendar event, a maintenance log row, a file edit, a
   dated note). A remembered-but-unevidenced activity is still worth
   surfacing, but flag it as `no-artifact` so Matt knows its audit weight.
2. **Matt locks, the skill never does.** REPStracker has no API and hour
   entries are a tax position. The skill's output is a review list and an
   entry-ready format. It never fabricates hours, never rounds up, and
   never marks anything as entered without Matt saying it was.

## Inputs

- **Lookback window** — if the user names one ("since June", "last two
  weeks"), use it. Otherwise default to the period since the last sweep
  recorded in the candidates log (below), falling back to the last 14 days
  on a first run.
- **Candidates log** — `MilhemVault\_System\REPStracker\candidates-log.csv`
  (Google Drive). One row per candidate ever surfaced, with a `status`
  column (`surfaced` | `locked` | `rejected`). This is the dedup memory:
  read it before sweeping, append to it after review. If it does not exist,
  create it with the columns listed under "Log schema" and note that this
  is a first run.

## The sweep

Search the sources below for the window. Run them independently (parallel
subagents where available); each source is blind to the others, which is
the point — the dedup pass afterwards is where overlaps merge. All source
access is read-only: search and read, never label, move, edit, or delete.

### 1. Gmail — labeled candidates

The daily gmail-assistant already labels property mail `AI/REPS Candidate`
(see `gmail-assistant/config.yaml`). This is the highest-precision source.

- Query: `label:AI/REPS-Candidate after:<window-start>`
- Each labeled thread where Matt actually acted (replied, coordinated,
  decided) is a candidate. A thread that is purely an automated notice
  (e.g. an Innago deposit confirmation) is evidence of activity but may
  represent zero time by itself — pair it with related activity rather
  than inventing minutes for reading a notification.

### 2. Gmail — unlabeled catch-up

The labeler only sees recent inbox mail, so run a second, targeted pass
for property work that escaped the label:

- Sent mail: `in:sent after:<window-start>` filtered to tenants, vendors,
  property managers, the CPA, lender, insurer, county, and utilities.
  Sent mail is the strongest evidence Matt personally spent time.
- Keyword pass: threads matching lease, tenant, showing, repair, quote,
  invoice, inspection, insurance, closing, HVAC, plumber, unit addresses.

### 3. Google Calendar

- Pull events in the window and keep property-related ones: showings,
  move-ins/outs, inspections, vendor meetings, closings, court dates,
  bank/lender meetings, property visits.
- Calendar events are the best duration evidence available — prefer the
  event's actual start/end over any estimate.

### 4. Maintenance log

The maintenance-triage skill logs every work order with a REPS-hours
column. Read its log for the window and pick up entries whose hours were
never carried into REPStracker (cross-check the candidates log, not
memory).

### 5. Google Drive activity

Files Matt created or modified in the Milhem Group folders (Rental Units,
Forms, Insurance and Loans, Tax, Finance — see the milhem-group-folders
skill for locations) during the window. A lease drafted, an application
screened, a spreadsheet reconciled — each is evidence of a work session.
Use file modification timestamps for the date; duration is an estimate,
so mark it `estimated`.

### 6. Brain dumps and session harvests

Walk-brain-dump reports have an explicit "REPS candidates" section, and
weekly-knowledge-capture / session harvest notes in MilhemVault often
record property work in passing. Search the vault notes for the window.
These frequently carry activities with no other artifact — surface them
with the `no-artifact` flag rather than dropping them.

## Normalize and deduplicate

Convert every raw hit into a candidate:

| Field | Rule |
|---|---|
| Date | The date the work happened, ISO format (`2026-08-14`), not the date the artifact was found. |
| Property/Unit | Specific property or `Portfolio` for cross-property work. |
| Activity | One plain sentence of what Matt did. Write it as audit-ready description, not a subject line. |
| Category | REPStracker category: Acquisitions, Advertising, Admin/Bookkeeping, Tenant Relations, Leasing/Showings, Maintenance/Repairs, Construction/Reno, Property Management, Travel, Education, Research. |
| Est. hours | Calendar duration when available; otherwise a conservative estimate. Round to the nearest 0.25h, and round **down** when unsure. Never pad. |
| Sources | Every artifact supporting it (thread subject + date, event name, log row, file path). |
| Flags | See below. |

Then dedup twice:

1. **Across sources in this sweep.** The same repair appears as a tenant
   email, a calendar slot, and a maintenance-log row — that is one
   candidate with three evidence links (and the strongest duration
   source wins). Merge on date + property + activity similarity.
2. **Against the candidates log.** Anything already `surfaced`, `locked`,
   or `rejected` is skipped silently. Match on the log's `candidate_key`
   (date + property + category + short activity slug).

### Flags

- `no-artifact` — mentioned in a note or dump but no independent evidence.
- `estimated` — duration is inferred, not documented.
- `check-eligibility` — activities that commonly fail material-participation
  scrutiny: general education, market research, investor-level review,
  commute-style travel. Do not silently drop these and do not present them
  as safe; surface them flagged so Matt (and his CPA) decide. This skill
  never gives tax advice — it sorts evidence.

## Output

Present one review report, newest first, in this exact structure:

```
# REPS Candidate Sweep — <window start> to <window end>

## Ready to lock (N candidates, X.X hours)
<table: Date | Property | Activity | Category | Hrs | Sources | Flags>

## Flagged for review (N)
<same table, only rows with any flag, with one line each on why>

## Sweep coverage
<per source: hits found, candidates produced, anything unreachable —
 an unreachable source is reported, never silently skipped>
```

After Matt reviews:

1. Append every candidate to the candidates log with his verdicts
   (`surfaced` for ones he will enter, `rejected` for ones he strikes).
2. Offer — do not auto-run — a batch-entry aid: either a copy-paste block
   matching REPStracker's entry fields in order (Date, Hours, Category,
   Property, Description), or a Comet browser-agent prompt (via
   comet-agent-prompt-builder) that enters and locks the approved rows.
3. Only when Matt confirms entries are locked in REPStracker, update those
   rows to `locked`. His confirmation is the only thing that sets that
   status.

## Log schema

`candidates-log.csv` columns:

```
candidate_key, date, property, activity, category, est_hours, sources,
flags, status, sweep_date
```

`sweep_date` on the newest row doubles as the "last sweep" marker that
sets the next default window.

## Edge cases

- **Empty sweep** — report it as a result ("no unlogged candidates found
  in the window"), including the coverage table. Silence is not a report.
- **A source is unavailable** (connector down, folder moved) — complete
  the sweep with the rest and say plainly which source was not covered,
  so Matt knows the list may be incomplete.
- **Overlapping windows** — re-sweeping an already-swept period is safe by
  design: the candidates log absorbs duplicates. Never skip a re-sweep out
  of caution; idempotency is the log's job.
- **Huge backlog** (months of catch-up) — sweep month by month, oldest
  first, and deliver per-month reports rather than one unreviewable list.
