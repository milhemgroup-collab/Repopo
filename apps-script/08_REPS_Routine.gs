/**
 * 08_REPS_Routine.gs — REPS-specific routine config.
 *
 * The framework is generic; the REPS specifics live here as plain config.
 * Sensitive values come from ScriptProperties:
 *   REPS_SHEET_ID         — the spreadsheet ID to append into
 *   REPS_SHEET_TAB        — the worksheet tab name (e.g. "Sheet1")
 *   REPS_GMAIL_QUERY      — Gmail search, e.g. 'from:reps-hour-logger@... subject:"BACKFILL"'
 *   REPS_HOURS_FORMULA    — D-column live formula template; "{row}" replaced per row
 *
 * Existing labels: REPS/Processed, REPS/AppendFailed.
 */

function registerRepsRoutine_() {
  return {
    id: 'reps_appender',
    enabled: true,
    source: {
      type: 'gmail',
      query: 'prop:REPS_GMAIL_QUERY',
      excludeLabels: ['REPS/Processed', 'REPS/AppendFailed'],
      maxThreads: 25,
      messageMode: 'first'
    },
    parse: {
      type: 'reps_rows',
      expectedCountRegex: /Rows?\s*\(?\s*(\d+)\s*\)?/i
    },
    dedupe: {
      type: 'sheet_key',
      sheetId: 'prop:REPS_SHEET_ID',
      sheetName: 'prop:REPS_SHEET_TAB',
      // Composite key from row#+date+start to avoid double-inserting the same shift.
      composite: [0, 1, 2]
    },
    sink: {
      type: 'sheet_append',
      sheetId: 'prop:REPS_SHEET_ID',
      sheetName: 'prop:REPS_SHEET_TAB',
      // Column D (1-based: 4) gets a live formula per row.
      // Template uses {row} for the absolute row index.
      formulaColumns: {
        '4': 'prop:REPS_HOURS_FORMULA'
      }
    },
    postActions: {
      onSuccess: {
        addLabels: ['REPS/Processed'],
        removeLabels: ['REPS/AppendFailed']
      },
      onFailure: {
        addLabels: ['REPS/AppendFailed']
      }
    },
    meta: {
      description: 'Append REPS hour-logger rows into the master sheet with live D-column formula.'
    }
  };
}
