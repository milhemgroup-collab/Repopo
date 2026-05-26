/**
 * 05_Dedupe.gs — dedupe strategies.
 *
 * applyDedupe(rows, cfg, routineCfg) returns the filtered rows.
 */

function applyDedupe(rows, cfg, _routine) {
  if (!cfg || !cfg.type || cfg.type === 'none') return rows;
  var handler = Dedupe[cfg.type];
  if (!handler) throw new Error('unknown dedupe.type: ' + cfg.type);
  return handler(rows, cfg);
}

var Dedupe = {};

/**
 * sheet_key — read an existing column from a sheet, build a key set,
 * filter out parsed rows whose key column is already present.
 *   cfg.sheetId, cfg.sheetName, cfg.keyColumn (1-based)
 *   cfg.rowKeyColumn:    1-based index INTO the parsed row that holds the key.
 *                        Defaults to cfg.keyColumn - 1 (matching column order).
 *   cfg.composite:       array of column indices into the parsed row — joined
 *                        with "|" to form the dedupe key.
 */
Dedupe.sheet_key = function (rows, cfg) {
  if (!cfg.sheetId || !cfg.sheetName || !cfg.keyColumn) {
    throw new Error('sheet_key requires sheetId, sheetName, keyColumn');
  }
  var ss = SpreadsheetApp.openById(cfg.sheetId);
  var sheet = ss.getSheetByName(cfg.sheetName);
  if (!sheet || sheet.getLastRow() === 0) return rows;
  var lastRow = sheet.getLastRow();
  var existing = sheet.getRange(1, cfg.keyColumn, lastRow, 1).getValues()
    .map(function (r) { return String(r[0]); });
  var set = {};
  existing.forEach(function (k) { set[k] = true; });

  var keyFn;
  if (cfg.composite) {
    keyFn = function (row) {
      return cfg.composite.map(function (i) { return Array.isArray(row) ? row[i] : row[i]; }).join('|');
    };
  } else {
    var keyIdx = (cfg.rowKeyColumn != null) ? cfg.rowKeyColumn : (cfg.keyColumn - 1);
    keyFn = function (row) {
      return String(Array.isArray(row) ? row[keyIdx] : row[keyIdx]);
    };
  }

  return rows.filter(function (r) { return !set[keyFn(r)]; });
};

/**
 * memory_key — dedupe only within this run, using a row-derived key.
 *   cfg.keyIndex: 0-based index into each row to use as the key.
 */
Dedupe.memory_key = function (rows, cfg) {
  var seen = {};
  var idx = cfg.keyIndex || 0;
  return rows.filter(function (r) {
    var k = String(Array.isArray(r) ? r[idx] : r[idx]);
    if (seen[k]) return false;
    seen[k] = true;
    return true;
  });
};
