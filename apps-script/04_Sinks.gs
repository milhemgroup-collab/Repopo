/**
 * 04_Sinks.gs — sink handlers.
 *
 * Sinks receive (rows, sinkCfg, routineCfg, sourceItem) and return
 * { rowsWritten, ... } or anything truthy. Throw to mark the item as failed.
 */

var Sinks = {};

/**
 * Append rows to a sheet.
 *   cfg.sheetId, cfg.sheetName
 *   cfg.headerRow:        if true, first append also writes headers (cfg.headers)
 *   cfg.formulaColumns:   { columnIndex (1-based): template string }
 *                         template may include `{row}` placeholder which is
 *                         replaced with the absolute row index of each new row.
 *   cfg.columnOrder:      array of field names (when rows are objects)
 */
Sinks.sheet_append = function (rows, cfg) {
  if (!cfg.sheetId || !cfg.sheetName) throw new Error('sheet_append requires sheetId + sheetName');
  if (!rows || !rows.length) return { rowsWritten: 0 };

  var ss = SpreadsheetApp.openById(cfg.sheetId);
  var sheet = ss.getSheetByName(cfg.sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(cfg.sheetName);
    if (cfg.headers) sheet.appendRow(cfg.headers);
  }
  if (cfg.headers && sheet.getLastRow() === 0) {
    sheet.appendRow(cfg.headers);
  }

  var matrix = rows.map(function (r) {
    if (Array.isArray(r)) return r.slice();
    if (cfg.columnOrder) return cfg.columnOrder.map(function (k) { return r[k]; });
    return Object.keys(r).map(function (k) { return r[k]; });
  });

  var startRow = sheet.getLastRow() + 1;
  var cols = Math.max.apply(null, matrix.map(function (r) { return r.length; }));
  // Pad jagged rows so setValues accepts the matrix.
  matrix = matrix.map(function (r) {
    while (r.length < cols) r.push('');
    return r;
  });

  sheet.getRange(startRow, 1, matrix.length, cols).setValues(matrix);

  // Inject live formulas into specified columns AFTER values are written.
  if (cfg.formulaColumns) {
    Object.keys(cfg.formulaColumns).forEach(function (colStr) {
      var col = parseInt(colStr, 10);
      var template = cfg.formulaColumns[colStr];
      var formulas = matrix.map(function (_, i) {
        var rowIdx = startRow + i;
        return [template.replace(/\{row\}/g, rowIdx)];
      });
      sheet.getRange(startRow, col, formulas.length, 1).setFormulas(formulas);
    });
  }

  return { rowsWritten: matrix.length, startRow: startRow };
};

/**
 * Send an email.
 *   cfg.to, cfg.subjectTemplate, cfg.bodyTemplate
 *   Templates support {{var}} substitution from a `data` object the parser produces.
 *   When rows is an array, one email is sent per row (with row[N] available as {{n}}).
 *   To send a single summary email per item, set cfg.singleEmail = true and use
 *   {{rows}} (rendered as JSON) in the body.
 */
Sinks.gmail_send = function (rows, cfg, _routine, item) {
  if (!cfg.to) throw new Error('gmail_send.to required');
  var subject = cfg.subjectTemplate || 'Notification';
  var body = cfg.bodyTemplate || '';
  if (cfg.singleEmail || !rows.length) {
    var rendered = renderTemplate_(body, { rows: JSON.stringify(rows, null, 2), item: (item && item.meta) || {} });
    var subjectRendered = renderTemplate_(subject, { rows: rows.length, item: (item && item.meta) || {} });
    GmailApp.sendEmail(cfg.to, subjectRendered, rendered);
    return { rowsWritten: rows.length, emailsSent: 1 };
  }
  rows.forEach(function (r) {
    var ctx = Array.isArray(r) ? r.reduce(function (acc, v, i) { acc[i] = v; return acc; }, {}) : r;
    GmailApp.sendEmail(cfg.to, renderTemplate_(subject, ctx), renderTemplate_(body, ctx));
  });
  return { rowsWritten: rows.length, emailsSent: rows.length };
};

/**
 * Write a file to a Drive folder.
 *   cfg.folderId, cfg.filenameTemplate, cfg.mimeType (default text/plain)
 *   Each row becomes one file, OR set cfg.singleFile = true to write one file
 *   per item with all rows as JSON.
 */
Sinks.drive_write = function (rows, cfg, _routine, item) {
  if (!cfg.folderId) throw new Error('drive_write.folderId required');
  var folder = DriveApp.getFolderById(cfg.folderId);
  var mime = cfg.mimeType || 'text/plain';
  if (cfg.singleFile) {
    var name = renderTemplate_(cfg.filenameTemplate || 'output_{{ts}}.json', {
      ts: new Date().toISOString().replace(/[:.]/g, '-'),
      item: (item && item.meta) || {}
    });
    folder.createFile(name, JSON.stringify(rows, null, 2), mime);
    return { rowsWritten: rows.length, filesWritten: 1 };
  }
  rows.forEach(function (r, i) {
    var n = renderTemplate_(cfg.filenameTemplate || 'row_{{i}}.txt', { i: i, item: (item && item.meta) || {} });
    folder.createFile(n, String(r), mime);
  });
  return { rowsWritten: rows.length, filesWritten: rows.length };
};

/**
 * Create calendar events.
 *   cfg.calendarId (defaults to primary)
 *   Each row should be { title, start, end, description?, location? }
 */
Sinks.calendar_create = function (rows, cfg) {
  var cal = cfg.calendarId ? CalendarApp.getCalendarById(cfg.calendarId) : CalendarApp.getDefaultCalendar();
  if (!cal) throw new Error('calendar not found: ' + cfg.calendarId);
  var n = 0;
  rows.forEach(function (r) {
    if (!r.title || !r.start || !r.end) return;
    cal.createEvent(r.title, new Date(r.start), new Date(r.end), {
      description: r.description || '',
      location: r.location || ''
    });
    n += 1;
  });
  return { rowsWritten: n, eventsCreated: n };
};

/**
 * No-op sink — useful for debugging routines without side effects.
 */
Sinks.noop = function (rows) {
  return { rowsWritten: rows.length, noop: true };
};

function renderTemplate_(tpl, ctx) {
  return String(tpl || '').replace(/\{\{\s*([\w\.]+)\s*\}\}/g, function (_, path) {
    var parts = path.split('.');
    var cur = ctx;
    for (var i = 0; i < parts.length; i++) {
      if (cur == null) return '';
      cur = cur[parts[i]];
    }
    return cur == null ? '' : String(cur);
  });
}
