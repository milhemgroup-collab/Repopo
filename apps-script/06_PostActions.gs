/**
 * 06_PostActions.gs — what to do with a source item after a routine
 * succeeds or fails on it.
 *
 * applyPostActions(item, routineCfg, success, result)
 *
 * Supported actions per item kind:
 *   gmail:        label, removeLabel, reply, archive, star
 *   drive_file:   markDescription, moveToFolder
 *   calendar:     setTag (via description tag), delete
 *   url/sheet:    no-op
 */

function applyPostActions(item, cfg, success, result) {
  var pa = cfg.postActions || {};
  var actions = success ? pa.onSuccess : pa.onFailure;
  if (!actions) return;

  try {
    if (item.kind === 'gmail') {
      applyGmailActions_(item, actions, cfg, success, result);
    } else if (item.kind === 'drive_file') {
      applyDriveActions_(item, actions, cfg, success);
    } else if (item.kind === 'calendar_event') {
      applyCalendarActions_(item, actions);
    }
  } catch (e) {
    // Post-actions should never block the main routine result. Log and move on.
    log_('postAction-error:' + cfg.id, { itemId: item.id, success: success, error: String(e && e.message || e) });
  }
}

function applyGmailActions_(item, actions, cfg, success, result) {
  var thread = item.meta && item.meta.thread;
  if (!thread) return;

  (actions.addLabels || []).forEach(function (name) {
    var lbl = getOrCreateLabel_(name);
    if (lbl) thread.addLabel(lbl);
  });
  (actions.removeLabels || []).forEach(function (name) {
    var lbl = GmailApp.getUserLabelByName(name);
    if (lbl) thread.removeLabel(lbl);
  });
  if (actions.archive) thread.moveToArchive();
  if (actions.markRead) thread.markRead();
  if (actions.star) thread.getMessages()[0].star();

  if (actions.replyTemplate) {
    var ctx = {
      success: success,
      rowsWritten: (result && result.written && result.written.rowsWritten) || 0,
      error: (result && result.error) || '',
      routineId: cfg.id,
      now: new Date().toISOString()
    };
    var body = renderTemplate_(actions.replyTemplate, ctx);
    if (actions.draftOnly) {
      thread.createDraftReply(body);
    } else {
      thread.reply(body);
    }
  }
}

function applyDriveActions_(item, actions, _cfg, _success) {
  var file = item.meta && item.meta.file;
  if (!file) return;
  if (actions.markDescription) {
    var existing = file.getDescription() || '';
    if (existing.indexOf(actions.markDescription) === -1) {
      file.setDescription((existing + ' ' + actions.markDescription).trim());
    }
  }
  if (actions.moveToFolderId) {
    var dest = DriveApp.getFolderById(actions.moveToFolderId);
    file.getParents().next().removeFile(file);
    dest.addFile(file);
  }
}

function applyCalendarActions_(item, actions) {
  var ev = item.meta && item.meta.event;
  if (!ev) return;
  if (actions.appendDescription) {
    ev.setDescription((ev.getDescription() || '') + '\n' + actions.appendDescription);
  }
  if (actions.delete) ev.deleteEvent();
}

function getOrCreateLabel_(name) {
  var lbl = GmailApp.getUserLabelByName(name);
  if (lbl) return lbl;
  try { return GmailApp.createLabel(name); } catch (_) { return null; }
}
