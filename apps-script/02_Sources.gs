/**
 * 02_Sources.gs — source handlers.
 *
 * A source handler takes (sourceCfg, routineCfg) and returns a list of
 * Item objects. Every item is shaped { id, kind, raw, meta } so downstream
 * parsers, sinks, and post-actions can address it uniformly.
 */

var Sources = {};

/**
 * Gmail source.
 *   cfg.query:           Gmail search query, e.g. "from:reps-hour-logger@example.com newer_than:30d"
 *   cfg.excludeLabels:   array of labels — threads carrying ANY are skipped
 *   cfg.includeLabels:   array of labels — threads MUST carry ALL (if provided)
 *   cfg.maxThreads:      defaults to 25
 *   cfg.messageMode:     "first" (default) or "latest"
 */
Sources.gmail = function (cfg) {
  var query = cfg.query || '';
  var excludeLabels = cfg.excludeLabels || [];
  excludeLabels.forEach(function (l) { query += ' -label:' + quoteLabel_(l); });
  if (cfg.includeLabels) {
    cfg.includeLabels.forEach(function (l) { query += ' label:' + quoteLabel_(l); });
  }
  var max = cfg.maxThreads || 25;
  var threads = GmailApp.search(query, 0, max);
  return threads.map(function (t) {
    var messages = t.getMessages();
    var msg = (cfg.messageMode === 'latest') ? messages[messages.length - 1] : messages[0];
    var body = msg.getPlainBody() || '';
    return {
      id: t.getId(),
      kind: 'gmail',
      raw: body,
      meta: {
        threadId: t.getId(),
        messageId: msg.getId(),
        subject: msg.getSubject(),
        from: msg.getFrom(),
        date: msg.getDate().toISOString(),
        htmlBody: msg.getBody(),
        // Reference to the live thread for post-actions
        thread: t
      }
    };
  });
};

function quoteLabel_(label) {
  if (/[\s\/]/.test(label)) return '"' + label + '"';
  return label;
}

/**
 * Drive folder source.
 *   cfg.folderId:        Drive folder ID
 *   cfg.mimeType:        optional, e.g. "text/csv" or "application/pdf"
 *   cfg.maxFiles:        defaults to 50
 *   cfg.modifiedAfter:   ISO date string; only files modified after this
 *   cfg.skipLabel:       a custom property name to mark already-processed files
 */
Sources.drive_folder = function (cfg) {
  if (!cfg.folderId) throw new Error('drive_folder.folderId required');
  var folder = DriveApp.getFolderById(cfg.folderId);
  var iter = cfg.mimeType ? folder.getFilesByType(cfg.mimeType) : folder.getFiles();
  var out = [];
  var max = cfg.maxFiles || 50;
  var cutoff = cfg.modifiedAfter ? new Date(cfg.modifiedAfter) : null;
  while (iter.hasNext() && out.length < max) {
    var f = iter.next();
    if (cutoff && f.getLastUpdated() <= cutoff) continue;
    if (cfg.skipLabel) {
      try {
        // Drive doesn't have labels, so we use the file's description as a marker.
        var desc = f.getDescription() || '';
        if (desc.indexOf(cfg.skipLabel) !== -1) continue;
      } catch (_) {}
    }
    var raw;
    try {
      raw = f.getBlob().getDataAsString();
    } catch (_) {
      raw = null;
    }
    out.push({
      id: f.getId(),
      kind: 'drive_file',
      raw: raw,
      meta: {
        fileId: f.getId(),
        name: f.getName(),
        mimeType: f.getMimeType(),
        size: f.getSize(),
        updatedAt: f.getLastUpdated().toISOString(),
        file: f
      }
    });
  }
  return out;
};

/**
 * Sheet range source.
 *   cfg.sheetId, cfg.sheetName, cfg.range (A1 notation)
 *   Each item = one row.
 */
Sources.sheet_range = function (cfg) {
  if (!cfg.sheetId || !cfg.sheetName) throw new Error('sheet_range requires sheetId + sheetName');
  var ss = SpreadsheetApp.openById(cfg.sheetId);
  var sheet = ss.getSheetByName(cfg.sheetName);
  if (!sheet) throw new Error('sheet not found: ' + cfg.sheetName);
  var rng = cfg.range ? sheet.getRange(cfg.range) : sheet.getDataRange();
  var values = rng.getValues();
  return values.map(function (row, i) {
    return {
      id: cfg.sheetName + ':row' + (rng.getRow() + i),
      kind: 'sheet_row',
      raw: row,
      meta: { rowIndex: rng.getRow() + i, sheetName: cfg.sheetName }
    };
  });
};

/**
 * Calendar source.
 *   cfg.calendarId (defaults to primary)
 *   cfg.daysAhead, cfg.daysBack
 */
Sources.calendar = function (cfg) {
  var cal = cfg.calendarId ? CalendarApp.getCalendarById(cfg.calendarId) : CalendarApp.getDefaultCalendar();
  if (!cal) throw new Error('calendar not found: ' + cfg.calendarId);
  var now = new Date();
  var start = new Date(now.getTime() - (cfg.daysBack || 0) * 86400000);
  var end = new Date(now.getTime() + (cfg.daysAhead || 7) * 86400000);
  var events = cal.getEvents(start, end);
  return events.map(function (ev) {
    return {
      id: ev.getId(),
      kind: 'calendar_event',
      raw: { title: ev.getTitle(), start: ev.getStartTime(), end: ev.getEndTime(), description: ev.getDescription() },
      meta: { eventId: ev.getId(), event: ev }
    };
  });
};

/**
 * URL fetch source — generic HTTP GET.
 *   cfg.url
 *   cfg.headers (object)
 *   cfg.expectJson (bool)
 */
Sources.url_fetch = function (cfg) {
  if (!cfg.url) throw new Error('url_fetch.url required');
  var resp = UrlFetchApp.fetch(cfg.url, {
    method: 'get',
    headers: cfg.headers || {},
    muteHttpExceptions: true,
    followRedirects: true
  });
  var text = resp.getContentText();
  var data = text;
  if (cfg.expectJson) {
    try { data = JSON.parse(text); } catch (_) {}
  }
  return [{
    id: cfg.url,
    kind: 'url',
    raw: data,
    meta: { status: resp.getResponseCode(), url: cfg.url }
  }];
};
