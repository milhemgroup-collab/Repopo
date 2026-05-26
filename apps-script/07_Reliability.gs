/**
 * 07_Reliability.gs — error handling, retry, logging, heartbeat.
 *
 * Every routine invocation goes through safeRun so a single failure can never
 * take the trigger down. A persistent JSON-per-row audit lives in the _log
 * sheet of the spreadsheet referenced by ScriptProperty LOG_SHEET_ID
 * (falls back to the first sheet referenced by any routine).
 */

var LOG_SHEET_NAME = '_log';
var LOG_SHEET_ID_PROP = 'LOG_SHEET_ID';

/**
 * safeRun(fn, ctx) — runs fn(), returns { ok, report?, error? }.
 * Never throws.
 */
function safeRun(fn, ctx) {
  try {
    var report = fn();
    return { ok: true, ctx: ctx, report: report };
  } catch (e) {
    var err = { ok: false, ctx: ctx, error: String(e && e.message || e), stack: e && e.stack };
    log_('safeRun:error', err);
    return err;
  }
}

/**
 * withRetry(fn, opts) — exponential backoff. Use for inner operations that
 * are safe to retry (HTTP fetches, Sheets writes that can fail transient).
 *   opts.attempts (default 3), opts.baseMs (default 500)
 */
function withRetry(fn, opts) {
  opts = opts || {};
  var attempts = opts.attempts || 3;
  var base = opts.baseMs || 500;
  var lastErr;
  for (var i = 0; i < attempts; i++) {
    try {
      return fn();
    } catch (e) {
      lastErr = e;
      Utilities.sleep(base * Math.pow(2, i));
    }
  }
  throw lastErr;
}

function ensureLogSheet_() {
  var ss = getLogSpreadsheet_();
  if (!ss) return null;
  var sheet = ss.getSheetByName(LOG_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(LOG_SHEET_NAME);
    sheet.appendRow(['ts', 'event', 'payload']);
  }
  return sheet;
}

function getLogSpreadsheet_() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty(LOG_SHEET_ID_PROP);
  if (id) {
    try { return SpreadsheetApp.openById(id); } catch (_) {}
  }
  // Fall back to the first sheet referenced by any routine.
  var routines = (typeof getAllRoutines === 'function') ? getAllRoutines() : [];
  for (var i = 0; i < routines.length; i++) {
    var s = routines[i].sink;
    if (s && s.sheetId) {
      try { return SpreadsheetApp.openById(s.sheetId); } catch (_) {}
    }
    var d = routines[i].dedupe;
    if (d && d.sheetId) {
      try { return SpreadsheetApp.openById(d.sheetId); } catch (_) {}
    }
  }
  return null;
}

function log_(event, payload) {
  try {
    var sheet = ensureLogSheet_();
    if (!sheet) return;
    sheet.appendRow([new Date().toISOString(), event, JSON.stringify(payload)]);
    // Cap log at ~5000 rows to keep the sheet responsive.
    var n = sheet.getLastRow();
    if (n > 5500) sheet.deleteRows(2, n - 5000);
  } catch (_) {
    // Logging must never crash the caller.
  }
}

/**
 * heartbeat() — emails REPORT_EMAIL if the last successful runOnce was more
 * than HEARTBEAT_MAX_HOURS ago. Hook this up as a separate (daily) trigger
 * if you want belt-and-braces monitoring.
 */
function heartbeat() {
  var props = PropertiesService.getScriptProperties();
  var maxHours = parseInt(props.getProperty('HEARTBEAT_MAX_HOURS') || '6', 10);
  var sheet = ensureLogSheet_();
  if (!sheet) return;
  var last = null;
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return;
  var values = sheet.getRange(Math.max(2, lastRow - 50), 1, Math.min(50, lastRow - 1), 2).getValues();
  for (var i = values.length - 1; i >= 0; i--) {
    if (values[i][1] === 'runOnce') { last = new Date(values[i][0]); break; }
  }
  var now = new Date();
  if (!last || (now.getTime() - last.getTime()) / 3600000 > maxHours) {
    var email = props.getProperty(DEFAULT_REPORT_EMAIL_PROP);
    if (email) {
      GmailApp.sendEmail(email, '[REPS][heartbeat] missed run window',
        'Last runOnce: ' + (last ? last.toISOString() : 'never') + '\nThreshold: ' + maxHours + 'h');
    }
  }
}
