/**
 * 01_Routines.gs — routine registry & schema validation.
 *
 * A routine is a plain JS object with this shape:
 * {
 *   id: string,                       // unique id, used in API and logs
 *   enabled: boolean,                 // default true
 *   source: { type: string, ... },    // see 02_Sources.gs
 *   parse:  { type: string, ... },    // see 03_Parsers.gs
 *   dedupe: { type: string, ... },    // see 05_Dedupe.gs ('none' is fine)
 *   sink:   { type: string, ... },    // see 04_Sinks.gs
 *   postActions: { onSuccess: {...}, onFailure: {...} },
 *   meta: { ... }                     // anything else handlers want to read
 * }
 *
 * Routines defined here are static; values inside them can reference
 * ScriptProperties via "prop:KEY_NAME" — resolveProperty() expands them.
 */

/**
 * Override or extend this list to register new routines. Adding a routine
 * is config — no other code changes are needed unless the routine needs
 * a brand-new source/parser/sink/dedupe handler.
 *
 * Anything that should not be hard-coded (sheet IDs, queries, label names)
 * should be referenced as "prop:KEY" and stored in ScriptProperties via
 * the editor → Project Settings → Script Properties.
 */
function getRoutineRegistry_() {
  var routines = [];
  // The REPS routine lives in 08_REPS_Routine.gs — see registerRepsRoutine_().
  if (typeof registerRepsRoutine_ === 'function') {
    routines.push(registerRepsRoutine_());
  }
  // Add additional routines here, e.g.
  //   if (typeof registerInvoiceImportRoutine_ === 'function') {
  //     routines.push(registerInvoiceImportRoutine_());
  //   }
  return routines;
}

function getAllRoutines() {
  return getRoutineRegistry_().map(resolveRoutineProperties_);
}

function getRoutineConfig(id) {
  var found = getRoutineRegistry_().filter(function (r) { return r.id === id; })[0];
  return found ? resolveRoutineProperties_(found) : null;
}

/**
 * Recursively replaces any string value of the form "prop:KEY" with the
 * value of that ScriptProperty. Leaves everything else unchanged.
 */
function resolveRoutineProperties_(obj) {
  var props = PropertiesService.getScriptProperties();
  function walk(v) {
    if (v == null) return v;
    if (typeof v === 'string') {
      var m = /^prop:(.+)$/.exec(v);
      if (m) {
        var resolved = props.getProperty(m[1]);
        if (resolved == null) {
          throw new Error('ScriptProperty missing: ' + m[1]);
        }
        return resolved;
      }
      return v;
    }
    if (Array.isArray(v)) return v.map(walk);
    if (typeof v === 'object') {
      var out = {};
      Object.keys(v).forEach(function (k) { out[k] = walk(v[k]); });
      return out;
    }
    return v;
  }
  return walk(obj);
}

function validateRoutineConfig(cfg) {
  if (!cfg || typeof cfg !== 'object') throw new Error('routine must be an object');
  if (!cfg.id || typeof cfg.id !== 'string') throw new Error('routine.id required');
  if (!cfg.source || !cfg.source.type) throw new Error(cfg.id + ': source.type required');
  if (!cfg.parse || !cfg.parse.type) throw new Error(cfg.id + ': parse.type required');
  if (!cfg.sink || !cfg.sink.type) throw new Error(cfg.id + ': sink.type required');
  if (!Sources[cfg.source.type]) throw new Error(cfg.id + ': unknown source.type ' + cfg.source.type);
  if (!Parsers[cfg.parse.type]) throw new Error(cfg.id + ': unknown parse.type ' + cfg.parse.type);
  if (!Sinks[cfg.sink.type]) throw new Error(cfg.id + ': unknown sink.type ' + cfg.sink.type);
  return true;
}
