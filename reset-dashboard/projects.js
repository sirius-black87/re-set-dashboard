// ─────────────────────────────────────────────────────────────────
// Projects manager — multi-project support via localStorage scoping.
//
// Data model:
//   reset-projects-list   → array of { id, name, createdAt, lastOpened, color }
//   reset-active-project  → id of the currently active project
//   reset-proj-<id>       → bundle of all the dashboard state for that project
//                            (snapshot of the CLOUD_KEYS values)
//
// Switching projects = snapshot current state → restore other state → reload.
// ─────────────────────────────────────────────────────────────────

(function () {
  const LIST_KEY   = 'reset-projects-list';
  const ACTIVE_KEY = 'reset-active-project';

  // All keys that belong to a "project snapshot"
  const PROJECT_KEYS = [
    'reset-task-status',
    'reset-additions',
    'reset-task-notes',
    'reset-edits',
    'reset-deletes',
    'reset-task-layout',
    'reset-widgets',
    'reset-edit-mode',
  ];

  function safe(k, fb) {
    try { return JSON.parse(localStorage.getItem(k) || JSON.stringify(fb)); }
    catch (e) { return fb; }
  }

  function listProjects() {
    const arr = safe(LIST_KEY, null);
    if (!arr) {
      // First-ever load → create the "default" project with whatever's currently in localStorage
      const def = {
        id: 'default',
        name: 'Re-Set (פרויקט ראשון)',
        createdAt: new Date().toISOString(),
        lastOpened: new Date().toISOString(),
        color: 'indigo',
      };
      localStorage.setItem(LIST_KEY, JSON.stringify([def]));
      localStorage.setItem(ACTIVE_KEY, def.id);
      return [def];
    }
    return arr;
  }

  function saveList(list) { localStorage.setItem(LIST_KEY, JSON.stringify(list)); }

  function getActiveId() {
    return localStorage.getItem(ACTIVE_KEY) || 'default';
  }

  function snapshotCurrent() {
    const blob = {};
    PROJECT_KEYS.forEach(k => {
      const v = localStorage.getItem(k);
      if (v !== null) blob[k] = v;
    });
    return blob;
  }

  function restoreSnapshot(blob) {
    // Wipe project keys first
    PROJECT_KEYS.forEach(k => localStorage.removeItem(k));
    if (!blob) return;
    Object.keys(blob).forEach(k => {
      localStorage.setItem(k, blob[k]);
    });
  }

  function persistCurrent() {
    const id = getActiveId();
    const blob = snapshotCurrent();
    localStorage.setItem('reset-proj-' + id, JSON.stringify(blob));

    // Update lastOpened
    const list = listProjects();
    const p = list.find(x => x.id === id);
    if (p) { p.lastOpened = new Date().toISOString(); saveList(list); }
  }

  function switchTo(id) {
    if (id === getActiveId()) return;
    persistCurrent();
    const blob = safe('reset-proj-' + id, null);
    restoreSnapshot(blob || {});
    localStorage.setItem(ACTIVE_KEY, id);
    location.reload();
  }

  function createProject({ name, template, color, tagline, durationWeeks, startDate, budget, currency }) {
    // Snapshot current first
    persistCurrent();
    const id = 'p_' + Date.now().toString(36) + Math.random().toString(36).slice(2,6);
    const list = listProjects();
    list.push({
      id, name,
      createdAt: new Date().toISOString(),
      lastOpened: new Date().toISOString(),
      color: color || 'sky',
      template: template ? template.id : null,
    });
    saveList(list);

    // Apply template starting state (deletes + phase additions)
    restoreSnapshot(template && template.snapshot ? template.snapshot : {});

    // Now overlay project-level edits so the dashboard reflects the new project's identity
    const edits = safe('reset-edits', {});
    edits['project.name']         = name;
    edits['project.tagline']      = tagline || '';
    edits['project.methodology']  = '';
    edits['project.currentWeek']  = 1;
    edits['project.durationWeeks']= Number(durationWeeks) || (template && template.defaultWeeks) || 12;
    edits['project.startDate']    = startDate ? new Date(startDate).toISOString() : new Date().toISOString();
    edits['budget.total']         = Number(budget) || 0;
    edits['budget.spent']         = 0;
    edits['budget.committed']     = 0;
    edits['project.currency']     = currency || '₪';
    localStorage.setItem('reset-edits', JSON.stringify(edits));

    // Snapshot current to new project's slot
    localStorage.setItem('reset-proj-' + id, JSON.stringify(snapshotCurrent()));
    localStorage.setItem(ACTIVE_KEY, id);
    location.reload();
  }

  function renameProject(id, name) {
    const list = listProjects();
    const p = list.find(x => x.id === id);
    if (p) { p.name = name; saveList(list); }
  }

  function deleteProject(id) {
    if (id === getActiveId()) {
      alert('לא ניתן למחוק את הפרויקט הפעיל. עבור לפרויקט אחר קודם.');
      return;
    }
    const list = listProjects().filter(p => p.id !== id);
    saveList(list);
    localStorage.removeItem('reset-proj-' + id);
  }

  // ────────── Templates ──────────
  // Each template is { id, name, description, snapshot }
  // Where `snapshot` is a map of LS_KEY → stringified value to set on init.
  // To make an "empty" template, we provide a `reset-task-layout` with empty
  // arrays for every default phase, plus deletes for default modules/risks/etc.

  const PHASE_COLORS = ['sky','indigo','violet','amber','rose','emerald','slate'];

  function emptySnapshot() {
    // Delete all default Re-Set seed data
    return {
      'reset-deletes': JSON.stringify({
        tasks: [],
        phases: [1,2,3,4,5,6,7,8,9,10,11,12],
        modules: ['community','therapy','rights','admin'],
        features: [],
        risks: [0,1,2,3],
        activity: [0,1,2,3,4,5,6],
        team: [],
        budgetCats: [0,1,2,3,4,5,6],
      }),
    };
  }

  function buildSnapshotFromPhases(phases, opts = {}) {
    // phases: [{name, color, startWeek, weeks, summary, tasks: [{t, p, d, s}]}]
    const dels = emptySnapshot();
    const nextId = 13; // after the 12 Re-Set phases that we delete
    const additions = { tasks: {}, phases: [], modules: [], features: {}, risks: [], activity: [], team: [], budgetCats: [] };
    phases.forEach((p, i) => {
      const id = nextId + i;
      additions.phases.push({
        id, name: p.name, en: p.en || '',
        color: p.color || PHASE_COLORS[i % PHASE_COLORS.length],
        startWeek: p.startWeek || 1,
        endWeek:   (p.startWeek || 1) + (p.weeks || 2) - 1,
        summary: p.summary || '',
        tasks: (p.tasks || []).map(t => ({ t: t.t, p: t.p || 'should', d: t.d || '—', s: t.s || 'todo' })),
      });
    });
    return {
      ...dels,
      'reset-additions': JSON.stringify(additions),
    };
  }

  const TEMPLATES = [
    {
      id: 'empty',
      name: 'ריק',
      description: 'פרויקט ריק לחלוטין — תוסיף/י שלבים, מודולים ומשימות ידנית.',
      icon: 'grid',
      defaultWeeks: 12,
      snapshot: emptySnapshot(),
    },
    {
      id: 'software-mvp',
      name: 'פרויקט תוכנה / MVP',
      description: '5 שלבים סטנדרטיים: מחקר, אפיון, עיצוב, פיתוח, השקה — לפרויקטי תוכנה.',
      icon: 'sparkles',
      defaultWeeks: 22,
      snapshot: buildSnapshotFromPhases([
        { name: 'מחקר וגילוי', color: 'sky',     startWeek: 1,  weeks: 3, summary: 'הגדרת בעיה, מתחרים, ראיונות משתמשים' },
        { name: 'אפיון מוצר',  color: 'sky',     startWeek: 4,  weeks: 3, summary: 'Feature map, MoSCoW, תרחישי שימוש' },
        { name: 'עיצוב UX/UI', color: 'indigo',  startWeek: 7,  weeks: 4, summary: 'IA, Wireframes, Design System, אב-טיפוס' },
        { name: 'פיתוח MVP',   color: 'violet',  startWeek: 11, weeks: 8, summary: 'פיתוח Frontend, Backend, אינטגרציות' },
        { name: 'QA והשקה',    color: 'rose',    startWeek: 19, weeks: 3, summary: 'בדיקות, ASO, חנויות, השקה' },
      ]),
    },
    {
      id: 'content',
      name: 'פרויקט תוכן',
      description: '4 שלבים: תכנון, כתיבה, עריכה, פרסום — לפרויקטי קמפיין, ספר, או סדרה.',
      icon: 'list',
      defaultWeeks: 10,
      snapshot: buildSnapshotFromPhases([
        { name: 'תכנון',  color: 'sky',     startWeek: 1, weeks: 2, summary: 'קהל יעד, מטרות, נושאים מרכזיים' },
        { name: 'כתיבה', color: 'indigo',  startWeek: 3, weeks: 4, summary: 'יצירת תוכן ראשונית, טיוטות' },
        { name: 'עריכה', color: 'amber',   startWeek: 7, weeks: 2, summary: 'הגהה, עריכה ספרותית, אישורים' },
        { name: 'פרסום', color: 'rose',    startWeek: 9, weeks: 2, summary: 'הפצה, שיווק, מעקב נתונים' },
      ]),
    },
    {
      id: 'generic-3m',
      name: 'כללי — 3 חודשים',
      description: '4 שלבים: תכנון, ביצוע, סקירה, סיום — לפרויקט קצר ובינוני.',
      icon: 'flag',
      defaultWeeks: 13,
      snapshot: buildSnapshotFromPhases([
        { name: 'תכנון',  color: 'sky',     startWeek: 1, weeks: 2, summary: 'הגדרת יעדים ומשאבים' },
        { name: 'ביצוע',  color: 'violet',  startWeek: 3, weeks: 7, summary: 'הקטע העיקרי של העבודה' },
        { name: 'סקירה',  color: 'amber',   startWeek: 10, weeks: 2, summary: 'בדיקה, איסוף משוב, איטרציה' },
        { name: 'סיום',   color: 'emerald', startWeek: 12, weeks: 1, summary: 'מסירה, סיכום, דו״ח' },
      ]),
    },
    {
      id: 'clone',
      name: 'העתק את הפרויקט הנוכחי',
      description: 'יוצר/ת עותק של הפרויקט הפעיל כעת — כולל כל המשימות, המודולים, התקציב.',
      icon: 'check',
      defaultWeeks: 12,
      snapshot: null,   // resolved at create time → current snapshot
    },
  ];

  function resolveTemplate(t) {
    if (t.id === 'clone') {
      return { ...t, snapshot: snapshotCurrent() };
    }
    return t;
  }

  window.RESET_PROJECTS = {
    listProjects,
    getActiveId,
    switchTo,
    createProject: (opts) => createProject({ ...opts, template: opts.template ? resolveTemplate(opts.template) : null }),
    renameProject,
    deleteProject,
    persistCurrent,
    templates: TEMPLATES,
  };

  // Ensure we're initialised
  listProjects();
})();
