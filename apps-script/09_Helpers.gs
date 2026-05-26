/**
 * 09_Helpers.gs — small utility entry points that are useful to run from
 * the Apps Script editor or from the Web App.
 */

/**
 * unlabelFailed(label) — strips a label from every Gmail thread carrying it.
 * Defaults to 'REPS/AppendFailed'. Use this after a parser fix to re-queue
 * previously-failed threads for the next runOnce.
 */
function unlabelFailed(label) {
  label = label || 'REPS/AppendFailed';
  var lbl = GmailApp.getUserLabelByName(label);
  if (!lbl) return { ok: true, label: label, removed: 0, note: 'label not found' };
  var removed = 0;
  // Process in batches; getThreads() caps at 500.
  while (true) {
    var threads = lbl.getThreads(0, 100);
    if (!threads.length) break;
    threads.forEach(function (t) { t.removeLabel(lbl); removed++; });
    if (threads.length < 100) break;
  }
  log_('unlabelFailed', { label: label, removed: removed });
  return { ok: true, label: label, removed: removed };
}

/**
 * listRoutines() — prints all registered routine ids/source/sink for sanity.
 */
function listRoutines() {
  var r = getAllRoutines().map(function (cfg) {
    return { id: cfg.id, enabled: cfg.enabled !== false, source: cfg.source.type, parse: cfg.parse.type, sink: cfg.sink.type };
  });
  Logger.log(JSON.stringify(r, null, 2));
  return r;
}

/**
 * getStatus() — quick health snapshot you can call from anywhere.
 */
function getStatus() {
  var props = PropertiesService.getScriptProperties();
  var triggers = ScriptApp.getProjectTriggers().map(function (t) {
    return { handler: t.getHandlerFunction(), type: String(t.getEventType()), id: t.getUniqueId() };
  });
  return {
    ok: true,
    version: FRAMEWORK_VERSION,
    user: Session.getEffectiveUser().getEmail(),
    routines: getAllRoutines().length,
    triggers: triggers,
    hasWebAppToken: !!props.getProperty(WEBAPP_TOKEN_PROP),
    reportEmail: props.getProperty(DEFAULT_REPORT_EMAIL_PROP) || null
  };
}

/**
 * runRepsOnce() — convenience wrapper so the editor's "Run" button has an
 * obvious entry point for the REPS routine.
 */
function runRepsOnce() {
  return runRoutine('reps_appender');
}

/**
 * resetWebAppToken() — rotates the Web App shared secret. The new token is
 * returned; update any clients (curl, Claude Code, MCP) afterwards.
 */
function resetWebAppToken() {
  var token = Utilities.getUuid().replace(/-/g, '');
  PropertiesService.getScriptProperties().setProperty(WEBAPP_TOKEN_PROP, token);
  return { ok: true, token: token };
}
