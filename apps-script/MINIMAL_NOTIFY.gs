/**
 * Minimal notify-only Apps Script for Claude Code Stop-hook integration.
 *
 * Single file, single purpose: receive {token, subject, body} POSTs from
 * Claude Code sessions (via scripts/notify-on-stop.sh) and email them.
 *
 * This is the STRIPPED-DOWN version of the full Routine Framework. Use this
 * when you just want auto-email from your routines and aren't ready to
 * migrate the REPS-specific stuff yet. The full framework can be layered
 * on later without changing any of this code.
 *
 * Setup (5 minutes, no Comet needed):
 *   1. Open https://script.google.com → New project. Name it
 *      "Claude Notify" (or anything else).
 *   2. Replace the default Code.gs body with this entire file's contents.
 *      Save with Ctrl/Cmd+S.
 *   3. Function dropdown → `setup` → click Run. Authorize when prompted
 *      (Gmail send + ScriptApp). It returns { token, email }.
 *   4. Deploy → New deployment → gear icon → Web app:
 *        Execute as: Me
 *        Who has access: Anyone
 *      Click Deploy. Copy the URL ending in /exec.
 *   5. Project Settings → Script properties → copy the WEBAPP_TOKEN value.
 *   6. In Claude Code on the web (Settings → Environments), set on the
 *      environment your routines use:
 *        WEBAPP_URL        = <the /exec URL>
 *        APPS_SCRIPT_TOKEN = <the WEBAPP_TOKEN value>
 *
 * Test:
 *   curl -sX POST "$WEBAPP_URL" \
 *     -H 'Content-Type: application/json' \
 *     -d "{\"token\":\"$TOKEN\",\"action\":\"notify\",\"subject\":\"hello\",\"body\":\"it works\"}"
 *   → email lands in your inbox within ~5 seconds.
 */

var WEBAPP_TOKEN_PROP = 'WEBAPP_TOKEN';
var REPORT_EMAIL_PROP = 'REPORT_EMAIL';

/** Run once. Generates the shared-secret token and captures your email. */
function setup() {
  var props = PropertiesService.getScriptProperties();
  if (!props.getProperty(WEBAPP_TOKEN_PROP)) {
    props.setProperty(WEBAPP_TOKEN_PROP, Utilities.getUuid().replace(/-/g, ''));
  }
  if (!props.getProperty(REPORT_EMAIL_PROP)) {
    props.setProperty(REPORT_EMAIL_PROP, Session.getEffectiveUser().getEmail() || '');
  }
  return {
    ok: true,
    token: props.getProperty(WEBAPP_TOKEN_PROP),
    email: props.getProperty(REPORT_EMAIL_PROP)
  };
}

function doPost(e) { return handle_(e, 'POST'); }
function doGet(e)  { return handle_(e, 'GET');  }

function handle_(e, method) {
  var params = (e && e.parameter) || {};
  var body = {};
  if (method === 'POST' && e && e.postData && e.postData.contents) {
    try { body = JSON.parse(e.postData.contents); } catch (_) {}
  }
  var expected = PropertiesService.getScriptProperties().getProperty(WEBAPP_TOKEN_PROP);
  var token = params.token || body.token;
  if (!expected || token !== expected) {
    return json_({ ok: false, error: 'unauthorized' });
  }
  var action = params.action || body.action || 'status';
  if (action === 'status') {
    return json_({ ok: true, version: 'notify-1.0.0' });
  }
  if (action === 'notify') {
    return json_(notify_({
      to:      params.to      || body.to,
      subject: params.subject || body.subject,
      body:    params.body    || body.body,
      tag:     params.tag     || body.tag
    }));
  }
  return json_({ ok: false, error: 'unknown action: ' + action });
}

function notify_(opts) {
  opts = opts || {};
  var to = opts.to || PropertiesService.getScriptProperties().getProperty(REPORT_EMAIL_PROP);
  if (!to) return { ok: false, error: 'no recipient (set REPORT_EMAIL script property)' };
  var subject = opts.subject || '(no subject)';
  if (opts.tag) subject = '[' + opts.tag + '] ' + subject;
  GmailApp.sendEmail(to, subject, String(opts.body || ''));
  return { ok: true, to: to, subject: subject };
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
