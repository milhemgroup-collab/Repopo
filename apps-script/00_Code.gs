/**
 * 00_Code.gs — main entry points.
 *
 * Public functions:
 *   setup()              — install the hourly trigger + initialize ScriptProperties.
 *   runOnce()            — invoked by the trigger; runs every enabled routine.
 *   runRoutine(id)       — runs one routine by id (callable from editor).
 *   doGet(e)             — HTTP GET endpoint for Web App.
 *   doPost(e)            — HTTP POST endpoint for Web App.
 *
 * Anything routine-specific lives in 08_*_Routine.gs or as ScriptProperties.
 * The framework is intentionally generic: add a routine by appending an entry
 * to ROUTINES in 01_Routines.gs — no other code changes required.
 */

var FRAMEWORK_VERSION = '2.0.0';
var DEFAULT_REPORT_EMAIL_PROP = 'REPORT_EMAIL';
var WEBAPP_TOKEN_PROP = 'WEBAPP_TOKEN';

/**
 * One-time setup. Idempotent: safe to re-run.
 *   - Installs the hourly trigger for runOnce.
 *   - Generates a webapp shared-secret token if missing.
 *   - Initializes the _log sheet referenced by routines that opt into sheet logging.
 *   - Validates every routine config (fails fast on broken config).
 */
function setup() {
  var props = PropertiesService.getScriptProperties();

  if (!props.getProperty(WEBAPP_TOKEN_PROP)) {
    props.setProperty(WEBAPP_TOKEN_PROP, Utilities.getUuid().replace(/-/g, ''));
  }
  if (!props.getProperty(DEFAULT_REPORT_EMAIL_PROP)) {
    props.setProperty(DEFAULT_REPORT_EMAIL_PROP, Session.getEffectiveUser().getEmail() || '');
  }

  var existing = ScriptApp.getProjectTriggers();
  var hasHourly = existing.some(function (t) {
    return t.getHandlerFunction() === 'runOnce' && t.getEventType() === ScriptApp.EventType.CLOCK;
  });
  if (!hasHourly) {
    ScriptApp.newTrigger('runOnce').timeBased().everyHours(1).create();
  }

  var routines = getAllRoutines();
  var errors = [];
  routines.forEach(function (r) {
    try {
      validateRoutineConfig(r);
    } catch (e) {
      errors.push(r.id + ': ' + e.message);
    }
  });
  if (errors.length) {
    throw new Error('Routine config validation failed:\n' + errors.join('\n'));
  }

  ensureLogSheet_();
  log_('setup', { ok: true, routines: routines.map(function (r) { return r.id; }) });
  return { ok: true, routines: routines.length, version: FRAMEWORK_VERSION };
}

/**
 * Invoked by the hourly trigger. Runs every enabled routine inside safeRun
 * so a single failure cannot block the others.
 */
function runOnce() {
  var routines = getAllRoutines().filter(function (r) { return r.enabled !== false; });
  var summary = { startedAt: new Date().toISOString(), results: [] };

  routines.forEach(function (r) {
    var res = safeRun(function () { return runRoutine(r.id); }, { routineId: r.id });
    summary.results.push(res);
  });

  summary.finishedAt = new Date().toISOString();
  sendRunReportIfRequested_(summary);
  log_('runOnce', summary);
  return summary;
}

/**
 * Runs one routine by id. Throws on validation failure; returns a structured
 * report on success or partial success. Per-item parse failures are captured
 * in result.failures rather than thrown.
 */
function runRoutine(id) {
  var cfg = getRoutineConfig(id);
  if (!cfg) throw new Error('Unknown routine: ' + id);
  validateRoutineConfig(cfg);

  var source = Sources[cfg.source.type];
  var parser = Parsers[cfg.parse.type];
  var sink = Sinks[cfg.sink.type];
  if (!source) throw new Error('Unknown source.type: ' + cfg.source.type);
  if (!parser) throw new Error('Unknown parse.type: ' + cfg.parse.type);
  if (!sink) throw new Error('Unknown sink.type: ' + cfg.sink.type);

  var items = source(cfg.source, cfg);
  var report = {
    routineId: id,
    startedAt: new Date().toISOString(),
    itemsFound: items.length,
    itemsProcessed: 0,
    rowsWritten: 0,
    failures: []
  };

  items.forEach(function (item) {
    try {
      var parsed = parser(item, cfg.parse, cfg);
      if (!parsed || (Array.isArray(parsed) && parsed.length === 0)) {
        throw new Error('parser returned 0 rows');
      }
      var deduped = applyDedupe(parsed, cfg.dedupe, cfg);
      var written = sink(deduped, cfg.sink, cfg, item);
      report.rowsWritten += (written && written.rowsWritten) || (Array.isArray(deduped) ? deduped.length : 0);
      report.itemsProcessed += 1;
      applyPostActions(item, cfg, /*success*/ true, { written: written, parsed: parsed });
    } catch (e) {
      report.failures.push({ itemId: item && item.id, error: String(e && e.message || e) });
      applyPostActions(item, cfg, /*success*/ false, { error: String(e && e.message || e) });
    }
  });

  report.finishedAt = new Date().toISOString();
  log_('runRoutine:' + id, report);
  return report;
}

/**
 * HTTP GET — minimal control surface. Auth via ?token=.
 *   ?action=status      — returns version + routines.
 *   ?action=run&id=foo  — runs one routine.
 *   ?action=runAll      — runs every enabled routine (same as runOnce).
 */
function doGet(e) {
  return httpHandle_(e, 'GET');
}
function doPost(e) {
  return httpHandle_(e, 'POST');
}

function httpHandle_(e, method) {
  var params = (e && e.parameter) || {};
  var body = {};
  if (method === 'POST' && e && e.postData && e.postData.contents) {
    try { body = JSON.parse(e.postData.contents); } catch (_) { body = {}; }
  }
  var token = params.token || body.token;
  var expected = PropertiesService.getScriptProperties().getProperty(WEBAPP_TOKEN_PROP);
  if (!expected || token !== expected) {
    return json_({ ok: false, error: 'unauthorized' }, 401);
  }

  var action = params.action || body.action || 'status';
  try {
    if (action === 'status') {
      return json_({
        ok: true,
        version: FRAMEWORK_VERSION,
        routines: getAllRoutines().map(function (r) { return { id: r.id, enabled: r.enabled !== false, source: r.source.type, sink: r.sink.type }; })
      });
    }
    if (action === 'run') {
      var id = params.id || body.id;
      if (!id) return json_({ ok: false, error: 'missing id' }, 400);
      return json_({ ok: true, report: runRoutine(id) });
    }
    if (action === 'runAll') {
      return json_({ ok: true, report: runOnce() });
    }
    if (action === 'unlabelFailed') {
      return json_({ ok: true, report: unlabelFailed(params.label || body.label) });
    }
    return json_({ ok: false, error: 'unknown action: ' + action }, 400);
  } catch (e2) {
    return json_({ ok: false, error: String(e2 && e2.message || e2), stack: e2 && e2.stack }, 500);
  }
}

function json_(obj, _status) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function sendRunReportIfRequested_(summary) {
  var props = PropertiesService.getScriptProperties();
  var email = props.getProperty(DEFAULT_REPORT_EMAIL_PROP);
  if (!email) return;

  var anyFailure = summary.results.some(function (r) { return r && (!r.ok || (r.report && r.report.failures && r.report.failures.length)); });
  var totalRows = summary.results.reduce(function (acc, r) { return acc + ((r && r.report && r.report.rowsWritten) || 0); }, 0);
  var subject = (anyFailure ? '[REPS][issue] ' : '[REPS] ') + 'Run report — ' +
    summary.results.length + ' routines, ' + totalRows + ' rows';
  var body = JSON.stringify(summary, null, 2);
  try {
    GmailApp.sendEmail(email, subject, body);
  } catch (_) {
    MailApp.sendEmail(email, subject, body);
  }
}
