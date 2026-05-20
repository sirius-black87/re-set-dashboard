// Task / phase / module / feature / project / budget / risks / activity / team store
// — handles statuses, additions, edits, deletes, notes — all persisted to localStorage.
const D_TS = window.RESET_DATA;

// ---------------------------------------------------------------- helpers
function safeJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
  catch (e) { return fallback; }
}

// ---------------------------------------------------------------- 1. STATUS overrides
(function applySavedStatus() {
  const overrides = safeJSON('reset-task-status', {});
  D_TS.PHASES.forEach(p => p.tasks.forEach((t, i) => {
    const key = p.id + ':' + i;
    if (overrides[key]) t.s = overrides[key];
  }));
})();

// ---------------------------------------------------------------- 2. ADDITIONS (new tasks/phases/modules/features/risks/activity/team/budget categories)
(function applyAdditions() {
  const adds = safeJSON('reset-additions', { tasks: {}, phases: [], modules: [], features: {}, risks: [], activity: [], team: [], budgetCats: [] });
  // Extra tasks per existing phase
  Object.keys(adds.tasks || {}).forEach(pid => {
    const phase = D_TS.PHASES.find(p => p.id === Number(pid));
    if (phase && Array.isArray(adds.tasks[pid])) adds.tasks[pid].forEach(t => phase.tasks.push(t));
  });
  // New phases
  (adds.phases || []).forEach(p => {
    if (!D_TS.PHASES.find(x => x.id === p.id)) D_TS.PHASES.push({ ...p, tasks: p.tasks || [] });
  });
  // New modules
  (adds.modules || []).forEach(m => {
    if (!D_TS.MODULES.find(x => x.id === m.id)) D_TS.MODULES.push({ ...m, features: m.features || [] });
  });
  // Extra features per module
  Object.keys(adds.features || {}).forEach(mid => {
    const mod = D_TS.MODULES.find(m => m.id === mid);
    if (mod && Array.isArray(adds.features[mid])) adds.features[mid].forEach(f => mod.features.push(f));
  });
  // Risks / activity / team / budget categories
  (adds.risks || []).forEach(r => D_TS.RISKS.push(r));
  (adds.activity || []).forEach(a => D_TS.ACTIVITY.unshift(a));
  (adds.team || []).forEach(t => D_TS.TEAM.push(t));
  (adds.budgetCats || []).forEach(c => D_TS.BUDGET.categories.push(c));
})();

// ---------------------------------------------------------------- 3. EDITS (patches to existing fields)
// Edit key paths:
//   project.<field>
//   budget.<field>            (e.g. budget.total, budget.spent)
//   budgetCat.<idx>.<field>   (e.g. budgetCat.0.spent)
//   phase.<phaseId>.<field>   (name/color/summary/startWeek/endWeek/en)
//   task.<phaseId>:<idx>.<field>   (t/p/d/s)
//   module.<moduleId>.<field>  (name/en/desc/icon/color/progress)
//   feature.<moduleId>.<idx>.<field>
//   risk.<idx>.<field>
//   activity.<idx>.<field>
//   team.<idx>.<field>
(function applyEdits() {
  const edits = safeJSON('reset-edits', {});
  Object.keys(edits).forEach(path => {
    const v = edits[path];
    const parts = path.split('.');
    const kind = parts[0];
    try {
      if (kind === 'project') D_TS.PROJECT[parts[1]] = v;
      else if (kind === 'budget') D_TS.BUDGET[parts[1]] = v;
      else if (kind === 'budgetCat') {
        const c = D_TS.BUDGET.categories[Number(parts[1])];
        if (c) c[parts[2]] = v;
      }
      else if (kind === 'phase') {
        const p = D_TS.PHASES.find(x => x.id === Number(parts[1]));
        if (p) p[parts[2]] = v;
      }
      else if (kind === 'task') {
        const [pid, idx] = parts[1].split(':');
        const ph = D_TS.PHASES.find(x => x.id === Number(pid));
        if (ph && ph.tasks[Number(idx)]) ph.tasks[Number(idx)][parts[2]] = v;
      }
      else if (kind === 'module') {
        const m = D_TS.MODULES.find(x => x.id === parts[1]);
        if (m) m[parts[2]] = v;
      }
      else if (kind === 'feature') {
        const m = D_TS.MODULES.find(x => x.id === parts[1]);
        if (m && m.features[Number(parts[2])]) m.features[Number(parts[2])][parts[3]] = v;
      }
      else if (kind === 'risk') {
        if (D_TS.RISKS[Number(parts[1])]) D_TS.RISKS[Number(parts[1])][parts[2]] = v;
      }
      else if (kind === 'activity') {
        if (D_TS.ACTIVITY[Number(parts[1])]) D_TS.ACTIVITY[Number(parts[1])][parts[2]] = v;
      }
      else if (kind === 'team') {
        if (D_TS.TEAM[Number(parts[1])]) D_TS.TEAM[Number(parts[1])][parts[2]] = v;
      }
    } catch (e) {}
  });
})();

// ---------------------------------------------------------------- 4. DELETES
// Deleted ids stored as sets of string keys per kind
(function applyDeletes() {
  const dels = safeJSON('reset-deletes', { tasks: [], phases: [], modules: [], features: [], risks: [], activity: [], team: [], budgetCats: [] });
  // Tasks: ['phaseId:idx', ...]  — delete from highest idx first to keep indexes stable
  const tasksByPhase = {};
  (dels.tasks || []).forEach(k => {
    const [pid, idx] = k.split(':');
    if (!tasksByPhase[pid]) tasksByPhase[pid] = [];
    tasksByPhase[pid].push(Number(idx));
  });
  Object.keys(tasksByPhase).forEach(pid => {
    const ph = D_TS.PHASES.find(p => p.id === Number(pid));
    if (!ph) return;
    tasksByPhase[pid].sort((a, b) => b - a).forEach(i => ph.tasks.splice(i, 1));
  });
  // Phases
  (dels.phases || []).forEach(id => {
    const i = D_TS.PHASES.findIndex(p => p.id === Number(id));
    if (i >= 0) D_TS.PHASES.splice(i, 1);
  });
  // Modules
  (dels.modules || []).forEach(id => {
    const i = D_TS.MODULES.findIndex(m => m.id === id);
    if (i >= 0) D_TS.MODULES.splice(i, 1);
  });
  // Features: ['moduleId:idx']
  const featuresByMod = {};
  (dels.features || []).forEach(k => {
    const [mid, idx] = k.split(':');
    if (!featuresByMod[mid]) featuresByMod[mid] = [];
    featuresByMod[mid].push(Number(idx));
  });
  Object.keys(featuresByMod).forEach(mid => {
    const m = D_TS.MODULES.find(x => x.id === mid);
    if (!m) return;
    featuresByMod[mid].sort((a, b) => b - a).forEach(i => m.features.splice(i, 1));
  });
  // Risks / activity / team / budget categories
  ['risks', 'activity', 'team', 'budgetCats'].forEach(kind => {
    const arr = kind === 'budgetCats' ? D_TS.BUDGET.categories : D_TS[kind.toUpperCase()];
    if (!arr) return;
    (dels[kind] || []).slice().sort((a, b) => b - a).forEach(i => arr.splice(Number(i), 1));
  });
})();

// ---------------------------------------------------------------- 4.5 STABLE TASK IDS + migrate legacy notes into task.notes + apply LAYOUT
(function applyTaskIdsAndLayout() {
  // Assign stable IDs to all tasks that don't have one
  D_TS.PHASES.forEach(p => p.tasks.forEach(t => {
    if (!t._id) t._id = 'tk-' + Math.random().toString(36).slice(2, 10) + '-' + Date.now().toString(36).slice(-4);
    if (!Array.isArray(t.notes)) t.notes = [];
  }));
  // One-time migration: legacy localStorage 'reset-task-notes' keyed by phaseId:idx → task.notes
  try {
    const legacy = JSON.parse(localStorage.getItem('reset-task-notes') || '{}');
    if (legacy && Object.keys(legacy).length > 0) {
      Object.keys(legacy).forEach(k => {
        const [pid, idx] = k.split(':');
        const ph = D_TS.PHASES.find(p => p.id === Number(pid));
        if (!ph) return;
        const t = ph.tasks[Number(idx)];
        if (!t) return;
        // append (avoid duplicates)
        const existing = JSON.stringify(t.notes || []);
        legacy[k].forEach(n => { if (existing.indexOf(JSON.stringify(n)) < 0) t.notes.push(n); });
      });
    }
  } catch (e) {}
  // Apply LAYOUT (full task-array snapshot per phase) — overrides additions/edits/deletes for those phases
  try {
    const layout = JSON.parse(localStorage.getItem('reset-task-layout') || 'null');
    if (layout && typeof layout === 'object') {
      Object.keys(layout).forEach(pid => {
        const ph = D_TS.PHASES.find(p => p.id === Number(pid));
        if (!ph || !Array.isArray(layout[pid])) return;
        // ensure IDs + notes arrays exist
        ph.tasks = layout[pid].map(t => ({
          _id: t._id || 'tk-' + Math.random().toString(36).slice(2, 10),
          t: t.t, s: t.s || 'todo', p: t.p || 'should', d: t.d || '—',
          notes: Array.isArray(t.notes) ? t.notes : [],
        }));
      });
    }
  } catch (e) {}
})();

// ---------------------------------------------------------------- 5. NOTES (per task) — kept for compat, but task.notes is now source of truth
let __notesCache = null;
function loadNotes() {
  if (__notesCache) return __notesCache;
  __notesCache = safeJSON('reset-task-notes', {});
  return __notesCache;
}
function saveNotes(n) {
  __notesCache = n;
  localStorage.setItem('reset-task-notes', JSON.stringify(n));
}

// ---------------------------------------------------------------- localStorage I/O helpers
function loadAdds()  { return safeJSON('reset-additions', { tasks: {}, phases: [], modules: [], features: {}, risks: [], activity: [], team: [], budgetCats: [] }); }
function saveAdds(a) {
  localStorage.setItem('reset-additions', JSON.stringify(a));
}
function loadEdits() { return safeJSON('reset-edits', {}); }
function saveEdits(e){
  localStorage.setItem('reset-edits', JSON.stringify(e));
}
function loadDels()  { return safeJSON('reset-deletes', { tasks: [], phases: [], modules: [], features: [], risks: [], activity: [], team: [], budgetCats: [] }); }
function saveDels(d) {
  localStorage.setItem('reset-deletes', JSON.stringify(d));
}

// Save current full task layout per phase — becomes source of truth on next load
function saveTaskLayout() {
  const layout = {};
  D_TS.PHASES.forEach(p => {
    layout[p.id] = p.tasks.map(t => ({
      _id: t._id, t: t.t, s: t.s, p: t.p, d: t.d,
      notes: Array.isArray(t.notes) ? t.notes : [],
    }));
  });
  localStorage.setItem('reset-task-layout', JSON.stringify(layout));
}

const TaskStoreContext = React.createContext(null);

function TaskStoreProvider({ children }) {
  const [version, setVersion] = React.useState(0);
  const [editMode, setEditMode] = React.useState(() => {
    try { return localStorage.getItem('reset-edit-mode') === '1'; } catch (e) { return false; }
  });
  const bump = () => {
    setVersion(v => v + 1);
    try { window.dispatchEvent(new CustomEvent('reset-data-changed')); } catch (e) {}
  };

  const toggleEditMode = React.useCallback(() => {
    setEditMode(v => {
      const nv = !v;
      try { localStorage.setItem('reset-edit-mode', nv ? '1' : '0'); } catch (e) {}
      document.documentElement.setAttribute('data-edit-mode', nv ? 'on' : 'off');
      return nv;
    });
  }, []);

  React.useEffect(() => {
    document.documentElement.setAttribute('data-edit-mode', editMode ? 'on' : 'off');
  }, [editMode]);

  // ============ STATUS cycle (clickable) ============
  const cycle = React.useCallback((phaseId, idx) => {
    const phase = D_TS.PHASES.find(p => p.id === phaseId);
    if (!phase) return;
    const t = phase.tasks[idx];
    const order = ['todo', 'progress', 'done'];
    const next = order[(order.indexOf(t.s) + 1) % order.length];
    t.s = next;
    const overrides = safeJSON('reset-task-status', {});
    overrides[phase.id + ':' + idx] = next;
    localStorage.setItem('reset-task-status', JSON.stringify(overrides));
    saveTaskLayout();
    bump();
  }, []);

  // ============ ADD: task / phase / module / feature ============
  const addTask = React.useCallback((phaseId, taskData) => {
    const phase = D_TS.PHASES.find(p => p.id === phaseId);
    if (!phase) return;
    const t = {
      _id: 'tk-' + Math.random().toString(36).slice(2, 10) + '-' + Date.now().toString(36).slice(-4),
      t: taskData.t, s: taskData.s || 'todo', p: taskData.p || 'should', d: taskData.d || '—',
      notes: [],
    };
    phase.tasks.push(t);
    const adds = loadAdds();
    if (!adds.tasks[phaseId]) adds.tasks[phaseId] = [];
    adds.tasks[phaseId].push(t);
    saveAdds(adds);
    saveTaskLayout();
    bump();
  }, []);

  const addPhase = React.useCallback((phaseData) => {
    const nextId = D_TS.PHASES.reduce((m, p) => Math.max(m, p.id), 0) + 1;
    const phase = {
      id: nextId,
      name: phaseData.name,
      en: phaseData.en || '',
      color: phaseData.color || 'slate',
      startWeek: phaseData.startWeek || D_TS.PROJECT.currentWeek,
      endWeek: phaseData.endWeek || (D_TS.PROJECT.currentWeek + 2),
      summary: phaseData.summary || '',
      tasks: [],
    };
    D_TS.PHASES.push(phase);
    const adds = loadAdds();
    adds.phases.push(phase);
    saveAdds(adds);
    bump();
    return phase.id;
  }, []);

  const addModule = React.useCallback((data) => {
    const slug = (data.name || 'module').replace(/\s+/g, '-').toLowerCase() + '-' + Date.now().toString(36);
    const mod = {
      id: slug, name: data.name, en: data.en || data.name, icon: data.icon || 'grid',
      desc: data.desc || '', progress: 0, phases: [], color: data.color || 'slate',
      features: [], custom: true,
    };
    D_TS.MODULES.push(mod);
    const adds = loadAdds();
    if (!adds.modules) adds.modules = [];
    adds.modules.push(mod);
    saveAdds(adds);
    bump();
    return mod.id;
  }, []);

  const addFeature = React.useCallback((moduleId, featureData) => {
    const mod = D_TS.MODULES.find(m => m.id === moduleId);
    if (!mod) return;
    const f = { name: featureData.name, status: featureData.status || 'todo' };
    mod.features.push(f);
    const adds = loadAdds();
    if (!adds.features) adds.features = {};
    if (!adds.features[moduleId]) adds.features[moduleId] = [];
    adds.features[moduleId].push(f);
    saveAdds(adds);
    bump();
  }, []);

  const addRisk = React.useCallback((data) => {
    const r = { level: data.level || 'med', title: data.title || 'סיכון חדש', impact: data.impact || '', mitigation: data.mitigation || '', owner: data.owner || '—' };
    D_TS.RISKS.push(r);
    const adds = loadAdds();
    adds.risks = adds.risks || [];
    adds.risks.push(r);
    saveAdds(adds);
    bump();
  }, []);

  const addActivity = React.useCallback((data) => {
    const a = { time: data.time || 'עכשיו', type: data.type || 'task', text: data.text || '', who: data.who || '—' };
    D_TS.ACTIVITY.unshift(a);
    const adds = loadAdds();
    adds.activity = adds.activity || [];
    adds.activity.unshift(a);
    saveAdds(adds);
    bump();
  }, []);

  const addTeamMember = React.useCallback((data) => {
    const initial = (data.name || '?').trim().split(/\s+/).map(s => s[0]).slice(0, 2).join('');
    const m = { name: data.name || 'חבר צוות', role: data.role || '—', initial, tasks: 0 };
    D_TS.TEAM.push(m);
    const adds = loadAdds();
    adds.team = adds.team || [];
    adds.team.push(m);
    saveAdds(adds);
    bump();
  }, []);

  const addBudgetCategory = React.useCallback((data) => {
    const c = { name: data.name || 'קטגוריה', planned: Number(data.planned) || 0, spent: Number(data.spent) || 0, color: data.color || 'slate' };
    D_TS.BUDGET.categories.push(c);
    const adds = loadAdds();
    adds.budgetCats = adds.budgetCats || [];
    adds.budgetCats.push(c);
    saveAdds(adds);
    bump();
  }, []);

  // ============ EDIT (generic patch) ============
  // Mutates the live data object AND persists the edit by path key.
  const setEdit = React.useCallback((path, value) => {
    const edits = loadEdits();
    edits[path] = value;
    saveEdits(edits);
    // Mirror onto live data
    const parts = path.split('.');
    const kind = parts[0];
    try {
      if (kind === 'project') D_TS.PROJECT[parts[1]] = value;
      else if (kind === 'budget') D_TS.BUDGET[parts[1]] = value;
      else if (kind === 'budgetCat') D_TS.BUDGET.categories[Number(parts[1])][parts[2]] = value;
      else if (kind === 'phase') {
        const p = D_TS.PHASES.find(x => x.id === Number(parts[1]));
        if (p) p[parts[2]] = value;
      }
      else if (kind === 'task') {
        const [pid, idx] = parts[1].split(':');
        const ph = D_TS.PHASES.find(x => x.id === Number(pid));
        if (ph && ph.tasks[Number(idx)]) ph.tasks[Number(idx)][parts[2]] = value;
      }
      else if (kind === 'module') {
        const m = D_TS.MODULES.find(x => x.id === parts[1]);
        if (m) m[parts[2]] = value;
      }
      else if (kind === 'feature') {
        const m = D_TS.MODULES.find(x => x.id === parts[1]);
        if (m && m.features[Number(parts[2])]) m.features[Number(parts[2])][parts[3]] = value;
      }
      else if (kind === 'risk' && D_TS.RISKS[Number(parts[1])]) D_TS.RISKS[Number(parts[1])][parts[2]] = value;
      else if (kind === 'activity' && D_TS.ACTIVITY[Number(parts[1])]) D_TS.ACTIVITY[Number(parts[1])][parts[2]] = value;
      else if (kind === 'team' && D_TS.TEAM[Number(parts[1])]) D_TS.TEAM[Number(parts[1])][parts[2]] = value;
    } catch (e) {}
    bump();
  }, []);

  // ============ DELETE ============
  const deleteTask = React.useCallback((phaseId, idx) => {
    const ph = D_TS.PHASES.find(p => p.id === phaseId);
    if (!ph) return;
    ph.tasks.splice(idx, 1);
    const dels = loadDels();
    dels.tasks = dels.tasks || [];
    dels.tasks.push(phaseId + ':' + idx);
    saveDels(dels);
    saveTaskLayout();
    bump();
  }, []);

  // ============ MOVE / REORDER TASK ============
  const moveTask = React.useCallback((srcPhaseId, srcIdx, dstPhaseId, dstIdx) => {
    const src = D_TS.PHASES.find(p => p.id === srcPhaseId);
    const dst = D_TS.PHASES.find(p => p.id === dstPhaseId);
    if (!src || !dst) return;
    const [task] = src.tasks.splice(srcIdx, 1);
    if (!task) return;
    const targetIdx = (srcPhaseId === dstPhaseId && srcIdx < dstIdx) ? dstIdx - 1 : dstIdx;
    const clamped = Math.max(0, Math.min(dst.tasks.length, targetIdx));
    dst.tasks.splice(clamped, 0, task);
    saveTaskLayout();
    bump();
  }, []);

  const deletePhase = React.useCallback((phaseId) => {
    const i = D_TS.PHASES.findIndex(p => p.id === phaseId);
    if (i < 0) return;
    D_TS.PHASES.splice(i, 1);
    const dels = loadDels();
    dels.phases = dels.phases || [];
    dels.phases.push(phaseId);
    saveDels(dels);
    bump();
  }, []);

  const deleteModule = React.useCallback((moduleId) => {
    const i = D_TS.MODULES.findIndex(m => m.id === moduleId);
    if (i < 0) return;
    D_TS.MODULES.splice(i, 1);
    const dels = loadDels();
    dels.modules = dels.modules || [];
    dels.modules.push(moduleId);
    saveDels(dels);
    bump();
  }, []);

  const deleteFeature = React.useCallback((moduleId, idx) => {
    const m = D_TS.MODULES.find(x => x.id === moduleId);
    if (!m) return;
    m.features.splice(idx, 1);
    const dels = loadDels();
    dels.features = dels.features || [];
    dels.features.push(moduleId + ':' + idx);
    saveDels(dels);
    bump();
  }, []);

  const deleteFrom = React.useCallback((kind, idx) => {
    const arr = kind === 'budgetCats' ? D_TS.BUDGET.categories : D_TS[kind.toUpperCase()];
    if (!arr) return;
    arr.splice(idx, 1);
    const dels = loadDels();
    dels[kind] = dels[kind] || [];
    dels[kind].push(idx);
    saveDels(dels);
    bump();
  }, []);

  // ============ NOTES ============
  const addNote = React.useCallback((phaseId, idx, text, isStatusUpdate, isSubtask) => {
    if (!text || !text.trim()) return;
    const ph = D_TS.PHASES.find(p => p.id === phaseId);
    if (!ph) return;
    const t = ph.tasks[idx];
    if (!t) return;
    if (!Array.isArray(t.notes)) t.notes = [];
    const note = {
      text: text.trim(),
      ts: Date.now(),
      kind: isStatusUpdate ? 'status' : (isSubtask ? 'subtask' : 'note'),
    };
    if (isSubtask) note.s = 'todo';
    t.notes.push(note);
    saveTaskLayout();
    bump();
  }, []);
  const removeNote = React.useCallback((phaseId, idx, noteIdx) => {
    const ph = D_TS.PHASES.find(p => p.id === phaseId);
    if (!ph) return;
    const t = ph.tasks[idx];
    if (!t || !Array.isArray(t.notes)) return;
    t.notes.splice(noteIdx, 1);
    saveTaskLayout();
    bump();
  }, []);
  // Update text of an existing note
  const updateNote = React.useCallback((phaseId, idx, noteIdx, newText) => {
    const ph = D_TS.PHASES.find(p => p.id === phaseId);
    if (!ph) return;
    const t = ph.tasks[idx];
    if (!t || !Array.isArray(t.notes) || !t.notes[noteIdx]) return;
    t.notes[noteIdx].text = (newText || '').trim();
    t.notes[noteIdx].editedAt = Date.now();
    saveTaskLayout();
    bump();
  }, []);
  // Toggle whether a note is a tracked subtask
  const toggleNoteSubtask = React.useCallback((phaseId, idx, noteIdx) => {
    const ph = D_TS.PHASES.find(p => p.id === phaseId);
    if (!ph) return;
    const t = ph.tasks[idx];
    if (!t || !Array.isArray(t.notes) || !t.notes[noteIdx]) return;
    const n = t.notes[noteIdx];
    if (n.kind === 'subtask') {
      n.kind = 'note';
      delete n.s;
    } else {
      n.kind = 'subtask';
      n.s = n.s || 'todo';
    }
    saveTaskLayout();
    bump();
  }, []);
  // Cycle status of a subtask note: todo → progress → done
  const cycleNoteStatus = React.useCallback((phaseId, idx, noteIdx) => {
    const ph = D_TS.PHASES.find(p => p.id === phaseId);
    if (!ph) return;
    const t = ph.tasks[idx];
    if (!t || !Array.isArray(t.notes) || !t.notes[noteIdx]) return;
    const n = t.notes[noteIdx];
    if (n.kind !== 'subtask') return;
    const order = ['todo', 'progress', 'done'];
    n.s = order[(order.indexOf(n.s || 'todo') + 1) % order.length];
    saveTaskLayout();
    bump();
  }, []);
  const getNotes = React.useCallback((phaseId, idx) => {
    const ph = D_TS.PHASES.find(p => p.id === phaseId);
    if (!ph) return [];
    const t = ph.tasks[idx];
    return (t && Array.isArray(t.notes)) ? t.notes : [];
  }, []);

  // ============ RESET ============
  const reset = React.useCallback(() => {
    if (!confirm('לאפס את כל הנתונים לערכי המקור? כל השינויים, ההערות, וההוספות יימחקו.')) return;
    ['reset-task-status','reset-additions','reset-task-notes','reset-edits','reset-deletes','reset-widgets','reset-task-layout']
      .forEach(k => localStorage.removeItem(k));
    location.reload();
  }, []);

  // ============ EXPORT / IMPORT ============
  const exportData = React.useCallback(() => {
    const payload = {
      _meta: {
        app: 'Re-Set Dashboard',
        version: 1,
        exportedAt: new Date().toISOString(),
      },
      status:    safeJSON('reset-task-status', {}),
      additions: safeJSON('reset-additions', {}),
      notes:     safeJSON('reset-task-notes', {}),
      edits:     safeJSON('reset-edits', {}),
      deletes:   safeJSON('reset-deletes', {}),
      layout:    safeJSON('reset-task-layout', null),
      widgets:   safeJSON('reset-widgets', null),
    };
    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const stamp = new Date().toISOString().slice(0,16).replace(/[:T]/g,'-');
    a.href = url;
    a.download = 'reset-dashboard-backup-' + stamp + '.json';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 0);
  }, []);

  const importData = React.useCallback((jsonText, mode) => {
    // mode: 'replace' (overwrite all) | 'merge' (keep current + overlay)
    try {
      const payload = JSON.parse(jsonText);
      if (!payload || typeof payload !== 'object') throw new Error('בעיה בפענוח הקובץ');
      if (mode === 'replace') {
        ['reset-task-status','reset-additions','reset-task-notes','reset-edits','reset-deletes','reset-widgets','reset-task-layout']
          .forEach(k => localStorage.removeItem(k));
      }
      const mergeObj = (key, incoming) => {
        if (!incoming) return;
        if (mode === 'merge') {
          const cur = safeJSON(key, {});
          const merged = { ...cur };
          Object.keys(incoming).forEach(k => {
            if (Array.isArray(incoming[k])) {
              merged[k] = (cur[k] || []).concat(incoming[k]);
            } else if (typeof incoming[k] === 'object' && incoming[k] !== null) {
              merged[k] = { ...(cur[k] || {}), ...incoming[k] };
            } else {
              merged[k] = incoming[k];
            }
          });
          localStorage.setItem(key, JSON.stringify(merged));
        } else {
          localStorage.setItem(key, JSON.stringify(incoming));
        }
      };
      if (payload.status)    mergeObj('reset-task-status', payload.status);
      if (payload.additions) mergeObj('reset-additions',   payload.additions);
      if (payload.notes)     mergeObj('reset-task-notes',  payload.notes);
      if (payload.edits)     mergeObj('reset-edits',       payload.edits);
      if (payload.deletes)   mergeObj('reset-deletes',     payload.deletes);
      if (payload.layout)    localStorage.setItem('reset-task-layout', JSON.stringify(payload.layout));
      if (payload.widgets)   localStorage.setItem('reset-widgets', JSON.stringify(payload.widgets));
      alert('יובאו נתונים בהצלחה — הדף ייטען מחדש.');
      location.reload();
    } catch (e) {
      alert('שגיאה בטעינת קובץ: ' + (e.message || e));
    }
  }, []);

  const api = {
    version, cycle,
    editMode, toggleEditMode,
    addTask, addPhase, addModule, addFeature, addRisk, addActivity, addTeamMember, addBudgetCategory,
    setEdit,
    deleteTask, deletePhase, deleteModule, deleteFeature, deleteFrom,
    moveTask,
    addNote, removeNote, updateNote, toggleNoteSubtask, cycleNoteStatus, getNotes,
    exportData, importData,
    reset,
  };

  return <TaskStoreContext.Provider value={api}>{children}</TaskStoreContext.Provider>;
}

function useTaskStore() { return React.useContext(TaskStoreContext); }

function TaskCheck({ phaseId, idx, status, size = 18 }) {
  const store = useTaskStore();
  const cls = 'task-status ' + status + ' clickable';
  const tip = status === 'done' ? 'הושלם — לחץ כדי לאפס'
            : status === 'progress' ? 'בתהליך — לחץ כדי לסמן כהושלם'
            : 'ממתין — לחץ כדי להתחיל';
  return (
    <button
      type="button"
      className={cls}
      title={tip}
      style={{ width: size, height: size, padding: 0, cursor: 'pointer' }}
      onClick={(e) => { e.stopPropagation(); store.cycle(phaseId, idx); }}
    >
      {status === 'done' && <Icon name="check" size={Math.round(size * 0.6)} />}
    </button>
  );
}

window.TaskStoreProvider = TaskStoreProvider;
window.TaskStoreContext = TaskStoreContext;
window.useTaskStore = useTaskStore;
window.TaskCheck = TaskCheck;
