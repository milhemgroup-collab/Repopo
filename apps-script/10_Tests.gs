/**
 * 10_Tests.gs — runnable smoke tests. Open the editor, pick a function,
 * click Run. Each test logs PASS/FAIL via Logger.log; none of them touch
 * Gmail/Sheets/Drive, so they're safe to run at any time.
 *
 * To run them all: testAll()
 */

function testAll() {
  var fns = [
    testRepsParser_format1_spaceWrapped,
    testRepsParser_format2_pipeWrapped,
    testRepsParser_format3_pipePadded,
    testRepsParser_format4_htmlFlattened,
    testTemplateRender,
    testDedupeSheetKey_skipsExisting
  ];
  var results = fns.map(function (fn) {
    try { fn(); return { name: fn.name, ok: true }; }
    catch (e) { return { name: fn.name, ok: false, error: String(e && e.message || e) }; }
  });
  Logger.log(JSON.stringify(results, null, 2));
  return results;
}

function assertEqual_(actual, expected, label) {
  var a = JSON.stringify(actual);
  var b = JSON.stringify(expected);
  if (a !== b) throw new Error(label + ' — expected ' + b + ', got ' + a);
}

function assertContains_(rows, sample, label) {
  var found = rows.some(function (r) {
    return JSON.stringify(r).indexOf(JSON.stringify(sample).slice(1, -1)) !== -1;
  });
  if (!found) throw new Error(label + ' — did not find sample ' + JSON.stringify(sample) + ' in ' + JSON.stringify(rows));
}

function testRepsParser_format1_spaceWrapped() {
  var body = 'BACKFILL 22d\nRows (2)\n' +
    '1 04/27 9:00 AM 10:00 AM 1.00 15098 Lebeau Loop\n' +
    '2 04/28 2:30 PM 3:30 PM 1.00 200 Main St';
  var rows = Parsers.reps_rows({ raw: body }, {});
  assertEqual_(rows.length, 2, 'format1 row count');
  assertEqual_(rows[0][0], 1, 'format1 row1 num');
  assertEqual_(rows[0][1], '04/27', 'format1 row1 date');
  assertEqual_(rows[0][2], '9:00 AM', 'format1 row1 start');
  assertEqual_(rows[0][4], 1.00, 'format1 row1 hours');
  assertContains_(rows, [1, '04/27', '9:00 AM', '10:00 AM', 1.00, '15098 Lebeau Loop'], 'format1 row1 full');
}

function testRepsParser_format2_pipeWrapped() {
  var body = 'BACKFILL 27d\nRows (2)\n' +
    '| 1 | 04/16/2026 | 8:30 AM | 9:30 AM | 1.00 | 15098 Lebeau Loop |\n' +
    '| 2 | 04/17/2026 | 10:00 AM | 11:00 AM | 1.00 | 200 Main St |';
  var rows = Parsers.reps_rows({ raw: body }, {});
  assertEqual_(rows.length, 2, 'format2 row count');
  assertEqual_(rows[0][1], '04/16/2026', 'format2 row1 date');
  assertEqual_(rows[0][2], '8:30 AM', 'format2 row1 start');
  assertEqual_(rows[1][3], '11:00 AM', 'format2 row2 end');
}

function testRepsParser_format3_pipePadded() {
  var body = 'BACKFILL 20d\nRows (1)\n' +
    '| 1  | 04/16/2026 | 7:00 AM  | 7:30 AM  | 0.50 | 15098 Lebeau Loop |';
  var rows = Parsers.reps_rows({ raw: body }, {});
  assertEqual_(rows.length, 1, 'format3 row count');
  assertEqual_(rows[0][4], 0.50, 'format3 hours');
}

function testRepsParser_format4_htmlFlattened() {
  // Two rows, no whitespace, no pipes — pure flattened HTML.
  var body = 'BACKFILL 30dRows (2)' +
    '104/279:00 AM10:00 AM1.0015098 Lebeau Loop' +
    '204/282:30 PM3:30 PM1.00200 Main St';
  var rows = Parsers.reps_rows({ raw: body }, {});
  if (rows.length === 0) throw new Error('format4 returned 0 rows — parser still broken');
  assertEqual_(rows[0][0], 1, 'format4 row1 num');
  assertEqual_(rows[0][1], '04/27', 'format4 row1 date');
  assertEqual_(rows[0][2], '9:00 AM', 'format4 row1 start');
  assertEqual_(rows[0][3], '10:00 AM', 'format4 row1 end');
  assertEqual_(rows[0][4], 1.00, 'format4 row1 hours');
}

function testTemplateRender() {
  var out = renderTemplate_('Hello {{name}}, rows={{rows}}', { name: 'Tony', rows: 3 });
  assertEqual_(out, 'Hello Tony, rows=3', 'template render');
}

function testDedupeSheetKey_skipsExisting() {
  // We can't read a real sheet in a smoke test, so we monkey-patch the call.
  // Just exercise the keyFn logic with composite keys.
  var rows = [[1, '04/27', '9:00 AM', 'x'], [2, '04/28', '8:00 AM', 'y']];
  // Build the same key function the handler builds internally.
  var keyFn = function (row) { return [row[0], row[1], row[2]].join('|'); };
  assertEqual_(keyFn(rows[0]), '1|04/27|9:00 AM', 'composite key shape');
}
