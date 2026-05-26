/**
 * 03_Parsers.gs — parser handlers.
 *
 * A parser takes (item, parseCfg, routineCfg) and returns an array of rows.
 * Each row is itself an array (sheet-friendly) OR an object — the sink will
 * adapt. Throw if the item is fundamentally malformed.
 */

var Parsers = {};

Parsers.passthrough = function (item) {
  return Array.isArray(item.raw) ? item.raw : [item.raw];
};

Parsers.json = function (item, cfg) {
  var data = (typeof item.raw === 'string') ? JSON.parse(item.raw) : item.raw;
  var path = cfg.rowsPath ? cfg.rowsPath.split('.') : null;
  var arr = path ? path.reduce(function (acc, k) { return acc && acc[k]; }, data) : data;
  if (!Array.isArray(arr)) throw new Error('json parser: rowsPath did not resolve to an array');
  return arr;
};

Parsers.csv = function (item, cfg) {
  var text = String(item.raw || '');
  var sep = cfg.separator || ',';
  var lines = text.split(/\r?\n/).filter(function (l) { return l.length; });
  if (cfg.skipHeader) lines.shift();
  return lines.map(function (line) {
    return Utilities.parseCsv(line, sep)[0];
  });
};

/**
 * REPS rows parser — handles ALL FOUR observed body formats from
 * reps-hour-logger:
 *   1. Space-separated, multi-line wrapped:  "1 04/27 9:00 AM 10:00 AM 1.00 15098 Lebeau Loop..."
 *   2. Pipe-delimited, multi-line wrapped:   "| 1 | 04/16/2026 | 8:30 AM | 9:30 AM | 1.00 |..."
 *   3. Pipe-delimited, padded:               "| 1  | 04/16/2026 | 7:00 AM  | 7:30 AM  | 0.50 |..."
 *   4. HTML→plain flattened, NO whitespace:  "104/279:00 AM10:00 AM1.0015098 Lebeau Loop..."
 *
 * Strategy:
 *   a. Slice from the "Rows (N)" header.
 *   b. Decode HTML entities, drop pipes, drop newlines (so wraps don't matter).
 *   c. Re-insert spaces at the boundaries between adjacent typed fields so the
 *      flattened format becomes parseable: digit-then-date, date-then-time,
 *      time-then-time, time-then-hours, hours-then-address.
 *   d. Apply a single unified row regex with lookahead for the next row.
 *
 * Returns rows shaped: [num, date, start, end, hours, notes].
 */
Parsers.reps_rows = function (item, cfg) {
  var body = String((item && item.raw) || '');
  var expected = (cfg && cfg.expectedCountRegex)
    ? extractExpectedCount_(body, cfg.expectedCountRegex)
    : extractExpectedCount_(body, /Rows?\s*\(?\s*(\d+)\s*\)?/i);

  // (a) Slice from the rows header (if present) so summary/preamble doesn't pollute the parse.
  var headRe = /Rows?\s*\(?\s*\d+\s*\)?\s*[:\-]?/i;
  var headMatch = headRe.exec(body);
  var text = headMatch ? body.slice(headMatch.index + headMatch[0].length) : body;

  // (b) Normalize: decode entities, drop pipes, collapse whitespace, drop newlines.
  text = text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<').replace(/&gt;/gi, '>')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&#?\w+;/g, ' ')
    .replace(/\r/g, '')
    .replace(/\|/g, ' ')
    .replace(/\n+/g, ' ');

  // (c) Re-insert spaces at field boundaries when missing (handles the flattened HTML case).
  //     Order matters — each rewrite targets a specific glued pair.
  //     We enforce 2-digit MM in the date pattern so "104/27" disambiguates as
  //     row 1 + date 04/27 rather than row 10 + date 4/27.
  text = text
    // Letter directly glued to row#+date+time: separate BOTH boundaries
    //   "Loop204/279:00..." -> "Loop 2 04/27 9:00..."
    .replace(/([A-Za-z])(\d{1,2})(\d{2}\/\d{1,2}(?:\/\d{2,4})?)(?=\d{1,2}:\d{2})/g, '$1 $2 $3')
    // Start-of-string or non-data char glued to row#+date+time
    //   "104/279:00..." -> "1 04/27 9:00..." at BOS
    .replace(/(^|[^\d\/:])(\d{1,2})(\d{2}\/\d{1,2}(?:\/\d{2,4})?)(?=\d{1,2}:\d{2})/g, '$1$2 $3')
    // Date (with or without year) glued to time "H:MM"
    .replace(/(\d{2}\/\d{1,2}(?:\/\d{2,4})?)(\d{1,2}:\d{2})/g, '$1 $2')
    // Time without space before AM/PM
    .replace(/(\d{1,2}:\d{2})([AP]M)\b/gi, '$1 $2')
    // AM/PM glued to next time
    .replace(/([AP]M)(\d{1,2}:\d{2})/gi, '$1 $2')
    // AM/PM glued to hours decimal
    .replace(/([AP]M)(\d+\.\d{1,2})/gi, '$1 $2')
    // Hours decimal glued to next token (typically an address number).
    // REPS always emits XX.YY (exactly 2 decimals); enforcing \d{2} prevents
    // the regex from backtracking and splitting "1.00 X" into "1.0 0 X".
    .replace(/(\d+\.\d{2})(\d|[A-Za-z])/g, '$1 $2');

  // Collapse runs of whitespace.
  text = text.replace(/[ \t]+/g, ' ').trim();

  // (d) Unified row regex.
  //     The lookahead lets the "notes" field absorb internal spaces and stop
  //     when the next row begins (row# + date + time pattern) or text ends.
  var ROW_RE = new RegExp(
    '(^|\\s)' +
    '(\\d{1,2})\\s+' +
    '(\\d{1,2})\\/(\\d{1,2})(?:\\/(\\d{2,4}))?\\s+' +
    '(\\d{1,2}:\\d{2})\\s*([AP]M)\\s+' +
    '(\\d{1,2}:\\d{2})\\s*([AP]M)\\s+' +
    '(\\d+(?:\\.\\d{1,2})?)' +
    '(?:\\s+([\\s\\S]*?))?' +
    '(?=\\s+\\d{1,2}\\s+\\d{1,2}\\/\\d{1,2}(?:\\/\\d{2,4})?\\s+\\d{1,2}:\\d{2}|$)',
    'gi'
  );

  var rows = [];
  var m;
  while ((m = ROW_RE.exec(text)) !== null) {
    var num = parseInt(m[2], 10);
    var date = m[5] ? m[3] + '/' + m[4] + '/' + m[5] : m[3] + '/' + m[4];
    var start = m[6] + ' ' + m[7].toUpperCase();
    var end = m[8] + ' ' + m[9].toUpperCase();
    var hours = parseFloat(m[10]);
    var notes = (m[11] || '').replace(/\s+/g, ' ').trim();
    rows.push([num, date, start, end, hours, notes]);
  }

  // Sanity check expected count if available.
  if (expected != null && rows.length === 0) {
    throw new Error('reps_rows parser: expected ' + expected + ' rows, got 0');
  }
  if (expected != null && rows.length !== expected) {
    // Don't throw — log and proceed with what we found. The sink will still
    // append, and we leave a breadcrumb in the row report.
    rows.__warn = 'expected ' + expected + ', got ' + rows.length;
  }
  return rows;
};

function extractExpectedCount_(body, re) {
  var m = re.exec(body);
  if (m && m[1]) return parseInt(m[1], 10);
  return null;
}
