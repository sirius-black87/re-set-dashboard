// Overview view — widget-based: KPIs, current sprint, phase progress, activity, risks, modules, budget, tasks, team
const D = window.RESET_DATA;
const { Editable: EditableO, EditableSelect: EditableSelectO, DeleteBtn: DeleteBtnO } = window;

function statusOf(phase, currentWeek) {
  if (phase.endWeek <= currentWeek) return 'done';
  if (phase.startWeek <= currentWeek) return 'progress';
  return 'todo';
}
function phaseProgress(phase, currentWeek) {
  const total = phase.tasks.length;
  if (total === 0) return 0;
  const done = phase.tasks.filter(t => t.s === 'done').length;
  const prog = phase.tasks.filter(t => t.s === 'progress').length;
  return Math.round(((done + prog * 0.4) / total) * 100);
}

function fmtNum(n) { return (n || 0).toLocaleString('he-IL'); }
function currencySymbol() {
  return (window.RESET_DATA && window.RESET_DATA.PROJECT && window.RESET_DATA.PROJECT.currency) || '₪';
}
function fmtCurrency(n) {
  const s = currencySymbol();
  return s + ((n || 0)/1000).toFixed(0) + 'K';
}
function fmtMoney(n) {
  return currencySymbol() + fmtNum(n);
}

const RISK_LEVELS = [{value:'high',label:'גבוה'},{value:'med',label:'בינוני'},{value:'low',label:'נמוך'}];
const RISK_LABELS = {high:'גבוה',med:'בינוני',low:'נמוך'};
const ACTIVITY_TYPES = [{value:'task',label:'משימה'},{value:'meeting',label:'פגישה'},{value:'decision',label:'החלטה'},{value:'risk',label:'סיכון'}];
const ACTIVITY_LABELS = {task:'משימה',meeting:'פגישה',decision:'החלטה',risk:'סיכון'};

const WIDGET_DEFS = [
  { k: 'kpis',        label: 'כרטיסי KPI',         icon: 'activity', col: 'full' },
  { k: 'sprint',      label: 'הספרינט הפעיל',       icon: 'list',     col: 'half' },
  { k: 'phasesMini',  label: 'התקדמות לפי שלב',     icon: 'gantt',    col: 'half' },
  { k: 'activity',    label: 'פעילות אחרונה',       icon: 'clock',    col: 'half' },
  { k: 'risks',       label: 'סיכונים',             icon: 'alert',    col: 'half' },
  { k: 'modulesMini', label: 'מודולים — תקציר',     icon: 'grid',     col: 'half' },
  { k: 'budgetMini',  label: 'תקציב — תקציר',       icon: 'wallet',   col: 'half' },
  { k: 'tasksList',   label: 'משימות בתהליך',       icon: 'list',     col: 'half' },
  { k: 'team',        label: 'צוות',                icon: 'users',    col: 'half' },
];
const DEFAULT_WIDGETS = ['kpis','sprint','phasesMini','activity','risks'];

function useWidgets() {
  const [w, setW] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem('reset-widgets') || 'null') || DEFAULT_WIDGETS.slice(); }
    catch (e) { return DEFAULT_WIDGETS.slice(); }
  });
  const persist = (next) => { setW(next); try { localStorage.setItem('reset-widgets', JSON.stringify(next)); } catch (e) {} };
  return [w, persist];
}

// ──────────────────────────────────────────────────────────────────────
const Overview = ({ goTo }) => {
  window.useTaskStore();
  const store = window.useTaskStore();
  const editMode = store.editMode;
  const [showNewRisk, setShowNewRisk] = React.useState(false);
  const [showNewAct, setShowNewAct] = React.useState(false);
  const [widgets, setWidgets] = useWidgets();
  const [pickerOpen, setPickerOpen] = React.useState(false);

  const removeWidget = (k) => setWidgets(widgets.filter(x => x !== k));
  const addWidget    = (k) => { if (!widgets.includes(k)) setWidgets([...widgets, k]); };

  // helpers for rendering, take a `editMode`-driven X button
  const wrapWidget = (key, body) => (
    <div className="ov-widget" key={key}>
      {editMode && (
        <button className="ov-widget-x" title="הסר ויג'ט" onClick={() => removeWidget(key)}>
          <Icon name="x" size={14}/>
        </button>
      )}
      {body}
    </div>
  );

  // pair up `half` widgets so they render side-by-side in .row containers
  const rendered = [];
  let pendingHalf = null;
  widgets.forEach(k => {
    const def = WIDGET_DEFS.find(d => d.k === k);
    if (!def) return;
    if (def.col === 'full') {
      if (pendingHalf) { rendered.push({ type:'row', items:[pendingHalf] }); pendingHalf = null; }
      rendered.push({ type:'full', key: k });
    } else {
      if (pendingHalf) {
        rendered.push({ type:'row', items:[pendingHalf, k] });
        pendingHalf = null;
      } else {
        pendingHalf = k;
      }
    }
  });
  if (pendingHalf) rendered.push({ type:'row', items:[pendingHalf] });

  const renderWidget = (k) => {
    switch (k) {
      case 'kpis':        return wrapWidget(k, <KPIsWidget/>);
      case 'sprint':      return wrapWidget(k, <SprintWidget/>);
      case 'phasesMini':  return wrapWidget(k, <PhasesMiniWidget goTo={goTo}/>);
      case 'activity':    return wrapWidget(k, <ActivityWidget store={store} showNew={showNewAct} setShowNew={setShowNewAct}/>);
      case 'risks':       return wrapWidget(k, <RisksWidget store={store} showNew={showNewRisk} setShowNew={setShowNewRisk}/>);
      case 'modulesMini': return wrapWidget(k, <ModulesMiniWidget goTo={goTo}/>);
      case 'budgetMini':  return wrapWidget(k, <BudgetMiniWidget goTo={goTo}/>);
      case 'tasksList':   return wrapWidget(k, <TasksProgressWidget goTo={goTo}/>);
      case 'team':        return wrapWidget(k, <TeamWidget/>);
      default: return null;
    }
  };

  return (
    <div className="view">
      {/* Edit-mode widget controls */}
      {editMode && (
        <div className="widget-toolbar">
          <div className="widget-toolbar-label">
            <Icon name="grid" size={14}/>
            <span>ניהול ויג'טים בעמוד הבית</span>
          </div>
          <button className="btn primary" onClick={() => setPickerOpen(p => !p)}>
            <Icon name="plus" size={12}/> הוסף ויג'ט
          </button>
        </div>
      )}
      {editMode && pickerOpen && (
        <WidgetPicker
          active={widgets}
          onAdd={(k) => { addWidget(k); setPickerOpen(false); }}
          onClose={() => setPickerOpen(false)}
        />
      )}

      {/* Render widgets in their grouped order */}
      {rendered.map((row, i) => {
        if (row.type === 'full') return <React.Fragment key={i}>{renderWidget(row.key)}</React.Fragment>;
        return (
          <div className={"row " + (row.items.length === 1 ? 'row-single' : '')} key={i}>
            {row.items.map(k => <React.Fragment key={k}>{renderWidget(k)}</React.Fragment>)}
          </div>
        );
      })}

      {widgets.length === 0 && (
        <div className="ov-empty">
          <Icon name="grid" size={32}/>
          <div>אין ויג'טים בעמוד הבית.</div>
          <div className="hint">הפעל מצב עריכה ולחץ "הוסף ויג'ט" כדי לבחור תוכן.</div>
        </div>
      )}
    </div>
  );
};

// ───────────── Widget picker (in-page modal-ish) ─────────────
const WidgetPicker = ({ active, onAdd, onClose }) => {
  const available = WIDGET_DEFS.filter(d => !active.includes(d.k));
  return (
    <div className="widget-picker">
      <div className="widget-picker-head">
        <span>בחר ויג'ט להוספה</span>
        <button className="widget-picker-close" onClick={onClose}><Icon name="x" size={14}/></button>
      </div>
      {available.length === 0 ? (
        <div className="widget-picker-empty">כל הוויג'טים כבר מוצגים בעמוד.</div>
      ) : (
        <div className="widget-picker-grid">
          {available.map(d => (
            <button key={d.k} className="widget-picker-item" onClick={() => onAdd(d.k)}>
              <Icon name={d.icon} size={18}/>
              <span>{d.label}</span>
              <span className="hint">{d.col === 'full' ? 'רוחב מלא' : 'חצי רוחב'}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================
// Individual widget components
// ============================================================

const KPIsWidget = () => {
  const allTasks = D.PHASES.flatMap(p => p.tasks);
  const totalTasks = allTasks.length;
  const doneTasks = allTasks.filter(t => t.s === 'done').length;
  const progressTasks = allTasks.filter(t => t.s === 'progress').length;
  const overallPct = totalTasks === 0 ? 0 : Math.round(((doneTasks + progressTasks * 0.4) / totalTasks) * 100);

  return (
    <div className="kpi-grid">
      <div className="kpi">
        <div className="kpi-top">
          <div className="label">התקדמות כוללת</div>
          <div className="icon-wrap" style={{background: 'var(--c-emerald-soft)', color: 'var(--c-emerald)'}}><Icon name="activity" size={16}/></div>
        </div>
        <div>
          <div className="value-row"><div className="value">{overallPct}<span style={{fontSize:18,color:'var(--ink-3)'}}>%</span></div></div>
          <div className="progress-line" style={{marginTop: 10}}><i style={{width: overallPct + '%', background: 'var(--c-emerald)'}}/></div>
        </div>
        <div className="note">{doneTasks} מתוך {totalTasks} משימות הושלמו</div>
      </div>

      <div className="kpi">
        <div className="kpi-top">
          <div className="label">שבוע נוכחי</div>
          <div className="icon-wrap"><Icon name="calendar" size={16}/></div>
        </div>
        <div className="value-row">
          <div className="value"><EditableO path="project.currentWeek" value={D.PROJECT.currentWeek} numeric inputStyle={{width:60,fontSize:'inherit'}}/></div>
          <div className="target">/ <EditableO path="project.durationWeeks" value={D.PROJECT.durationWeeks} numeric inputStyle={{width:60}}/></div>
        </div>
        <div className="progress-line"><i style={{width: (D.PROJECT.currentWeek/D.PROJECT.durationWeeks*100) + '%'}}/></div>
        <div className="note">{D.PROJECT.durationWeeks - D.PROJECT.currentWeek} שבועות עד השקה ציבורית</div>
      </div>

      <div className="kpi">
        <div className="kpi-top">
          <div className="label">תקציב MVP</div>
          <div className="icon-wrap" style={{background: 'var(--c-amber-soft)', color: 'var(--c-amber)'}}><Icon name="wallet" size={16}/></div>
        </div>
        <div className="value-row">
          <div className="value">{fmtCurrency(D.BUDGET.spent)}</div>
          <div className="target">/ {fmtCurrency(D.BUDGET.total)}</div>
        </div>
        <div className="progress-line"><i style={{width: (D.BUDGET.total > 0 ? (D.BUDGET.spent/D.BUDGET.total*100) : 0) + '%', background:'var(--c-amber)'}}/></div>
        <div className="note">{D.BUDGET.total > 0 ? Math.round(D.BUDGET.spent/D.BUDGET.total*100) : 0}% נוצל · {fmtCurrency(D.BUDGET.committed)} מחויב</div>
      </div>

      <div className="kpi">
        <div className="kpi-top">
          <div className="label">סיכונים פתוחים</div>
          <div className="icon-wrap" style={{background: 'var(--c-rose-soft)', color: 'var(--risk-high)'}}><Icon name="alert" size={16}/></div>
        </div>
        <div className="value-row">
          <div className="value">{D.RISKS.length}</div>
          <div className="target">{D.RISKS.filter(r=>r.level==='high').length} גבוהים</div>
        </div>
        <div className="progress-line"><i style={{width: '70%', background:'var(--risk-high)'}}/></div>
        <div className="note">דורש מעקב שבועי בריטרוספקטיבה</div>
      </div>
    </div>
  );
};

const SprintWidget = () => {
  const currentPhases = D.PHASES.filter(p => p.startWeek <= D.PROJECT.currentWeek && p.endWeek >= D.PROJECT.currentWeek);
  const currentPhase = currentPhases[currentPhases.length - 1] || D.PHASES[0];
  if (!currentPhase) return <div className="card"><div className="card-head"><h3>הספרינט הפעיל</h3></div><div className="card-pad">אין שלב פעיל.</div></div>;
  const dateRange = D.fmtDateRange(D.phaseStartDate(currentPhase), D.phaseEndDate(currentPhase));
  return (
    <div className="card">
      <div className="sprint-head">
        <div>
          <div className="label">הספרינט הפעיל</div>
          <h2>שלב {currentPhase.id}: <EditableO path={'phase.'+currentPhase.id+'.name'} value={currentPhase.name} inputStyle={{minWidth:200}}/></h2>
          <div className="meta">
            <span style={{fontWeight:600,color:'var(--ink-2)'}}>{dateRange}</span>
            {' · שבועות '+currentPhase.startWeek+'–'+currentPhase.endWeek+' · '}
            <EditableO path={'phase.'+currentPhase.id+'.summary'} value={currentPhase.summary} multiline inputStyle={{width:'100%'}}/>
          </div>
        </div>
        <div className="sprint-progress-wrap">
          <div className="sprint-progress-num">{phaseProgress(currentPhase, D.PROJECT.currentWeek)}<span>%</span></div>
          <div style={{fontSize:11, color:'var(--ink-3)', marginTop:2}}>שלב</div>
        </div>
      </div>
      <div className="sprint-tasks">
        {currentPhase.tasks.map((t, i) => (
          <div key={i} className={"sprint-task " + (t.s === 'done' ? 'done' : '')}>
            <window.TaskCheck phaseId={currentPhase.id} idx={i} status={t.s} size={18}/>
            <EditableO path={'task.'+currentPhase.id+':'+i+'.t'} value={t.t} as="div" className="text" inputStyle={{width:'100%'}}/>
            <EditableSelectO path={'task.'+currentPhase.id+':'+i+'.p'} value={t.p}
              options={[{value:'must',label:'חובה'},{value:'should',label:'חשוב'}]}
              labelMap={{must:'חובה',should:'חשוב'}} className={"pri " + t.p}/>
            <EditableO path={'task.'+currentPhase.id+':'+i+'.d'} value={t.d} as="div" className="who"/>
          </div>
        ))}
      </div>
    </div>
  );
};

const PhasesMiniWidget = ({ goTo }) => {
  const allTasks = D.PHASES.flatMap(p => p.tasks);
  const totalTasks = allTasks.length;
  const doneTasks = allTasks.filter(t => t.s === 'done').length;
  const progressTasks = allTasks.filter(t => t.s === 'progress').length;
  const overallPct = totalTasks === 0 ? 0 : Math.round(((doneTasks + progressTasks * 0.4) / totalTasks) * 100);
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (overallPct / 100) * circumference;

  return (
    <div className="card">
      <div className="card-head">
        <h3>התקדמות לפי שלב</h3>
        <button className="btn" style={{padding:'4px 10px',fontSize:12}} onClick={() => goTo('phases')}>טיימליין מלא ←</button>
      </div>
      <div className="phase-progress-card" style={{paddingBottom: 8}}>
        <div className="donut-wrap">
          <div className="donut">
            <svg viewBox="0 0 120 120">
              <circle cx="60" cy="60" r={radius} fill="none" stroke="var(--surface-3)" strokeWidth="10"/>
              <circle cx="60" cy="60" r={radius} fill="none" stroke="var(--primary)" strokeWidth="10"
                strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
                style={{transition: 'stroke-dashoffset 0.8s'}}
              />
            </svg>
            <div className="center"><div><div className="pct">{overallPct}%</div><div className="lbl">סה״כ פרויקט</div></div></div>
          </div>
          <div style={{flex:1, fontSize: 12.5, color: 'var(--ink-2)', lineHeight: 1.55}}>
            <div style={{fontWeight: 600, color: 'var(--ink)', marginBottom: 6, fontSize: 13}}>איפה אנחנו עומדים</div>
            <div>{doneTasks} משימות הושלמו · {progressTasks} בעבודה כעת · {totalTasks - doneTasks - progressTasks} ממתינות.</div>
          </div>
        </div>
      </div>
      <div className="phase-list">
        {D.PHASES.map(p => {
          const pct = phaseProgress(p, D.PROJECT.currentWeek);
          const isActive = p.startWeek <= D.PROJECT.currentWeek && p.endWeek >= D.PROJECT.currentWeek;
          const cls = pct === 100 ? 'done' : (pct > 0 ? 'progress' : '');
          return (
            <div key={p.id} className={"phase-row " + cls + (isActive ? ' active' : '')}>
              <div className="phase-num">{p.id}</div>
              <div className="name">{p.name}</div>
              <div className="bar"><i style={{width: pct + '%'}}/></div>
              <div className="pct-mini">{pct}%</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ActivityWidget = ({ store, showNew, setShowNew }) => (
  <div className="card">
    <div className="card-head">
      <h3>פעילות אחרונה</h3>
      {store.editMode && (
        <button className="btn btn-ghost-sm" onClick={() => setShowNew(true)} title="הוסף">
          <Icon name="plus" size={12}/> פעילות
        </button>
      )}
    </div>
    {showNew && store.editMode && (
      <NewActivityRow onCancel={() => setShowNew(false)} onSave={(d) => { store.addActivity(d); setShowNew(false); }}/>
    )}
    <div className="activity-list">
      {D.ACTIVITY.map((a, i) => (
        <div key={i} className="activity-item">
          <div className={"activity-dot " + a.type}></div>
          <div className="activity-body">
            <div className="activity-text">
              <EditableO path={'activity.'+i+'.text'} value={a.text} multiline inputStyle={{width:'100%'}}/>
            </div>
            <div className="activity-meta">
              <EditableO path={'activity.'+i+'.time'} value={a.time}/>
              {' · '}
              <EditableO path={'activity.'+i+'.who'} value={a.who}/>
              {' · '}
              <EditableSelectO path={'activity.'+i+'.type'} value={a.type} options={ACTIVITY_TYPES} labelMap={ACTIVITY_LABELS}/>
            </div>
          </div>
          <DeleteBtnO onDelete={() => store.deleteFrom('activity', i)}/>
        </div>
      ))}
    </div>
  </div>
);

const RisksWidget = ({ store, showNew, setShowNew }) => (
  <div className="card">
    <div className="card-head">
      <h3>סיכונים ופעולות מיטיגציה</h3>
      {store.editMode && (
        <button className="btn btn-ghost-sm" onClick={() => setShowNew(true)} title="הוסף">
          <Icon name="plus" size={12}/> סיכון
        </button>
      )}
    </div>
    {showNew && store.editMode && (
      <NewRiskRow onCancel={() => setShowNew(false)} onSave={(d) => { store.addRisk(d); setShowNew(false); }}/>
    )}
    <div className="risk-card">
      {D.RISKS.map((r, i) => (
        <div key={i} className="risk-row">
          <EditableSelectO path={'risk.'+i+'.level'} value={r.level} options={RISK_LEVELS} labelMap={RISK_LABELS}
            className={"risk-level " + r.level}/>
          <div style={{minWidth:0,flex:1}}>
            <div className="title"><EditableO path={'risk.'+i+'.title'} value={r.title} inputStyle={{width:'100%'}}/></div>
            <div className="impact">השפעה: <EditableO path={'risk.'+i+'.impact'} value={r.impact} multiline inputStyle={{width:'100%'}}/></div>
            <div className="mit">מיטיגציה: <EditableO path={'risk.'+i+'.mitigation'} value={r.mitigation} multiline inputStyle={{width:'100%'}}/></div>
          </div>
          <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:6}}>
            <EditableO path={'risk.'+i+'.owner'} value={r.owner} className="owner-tag"/>
            <DeleteBtnO onDelete={() => store.deleteFrom('risks', i)}/>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const ModulesMiniWidget = ({ goTo }) => (
  <div className="card">
    <div className="card-head">
      <h3>מודולים — תקציר</h3>
      <button className="btn" style={{padding:'4px 10px',fontSize:12}} onClick={() => goTo('modules')}>פתח מודולים ←</button>
    </div>
    <div className="card-pad" style={{display:'flex',flexDirection:'column',gap:10}}>
      {D.MODULES.map(m => {
        const total = m.features.length;
        const fDone = m.features.filter(f => f.status === 'done').length;
        const fProg = m.features.filter(f => f.status === 'progress' || f.status === 'spec').length;
        const pct = total === 0 ? (m.progress || 0) : Math.round(((fDone + fProg * 0.4) / total) * 100);
        const iconCls = m.custom ? 'custom' : m.id;
        const iconStyle = m.custom ? { background: 'var(--c-' + (m.color || 'slate') + '-soft)', color: 'var(--c-' + (m.color || 'slate') + ')' } : {};
        return (
          <div key={m.id} className="mod-mini">
            <div className={"module-icon-box " + iconCls} style={{...iconStyle, width:34,height:34}}>
              <Icon name={m.icon} size={16}/>
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div className="mod-mini-name">{m.name}</div>
              <div className="mod-mini-bar"><i style={{width: pct + '%'}}/></div>
            </div>
            <div className="mod-mini-pct">{pct}%</div>
          </div>
        );
      })}
    </div>
  </div>
);

const BudgetMiniWidget = ({ goTo }) => {
  const total = D.BUDGET.total || 0;
  const spentPct = total > 0 ? (D.BUDGET.spent / total) * 100 : 0;
  const commPct  = total > 0 ? (D.BUDGET.committed / total) * 100 : 0;
  return (
    <div className="card">
      <div className="card-head">
        <h3>תקציב — תקציר</h3>
        <button className="btn" style={{padding:'4px 10px',fontSize:12}} onClick={() => goTo('budget')}>פתח תקציב ←</button>
      </div>
      <div className="card-pad">
        <div style={{display:'flex',alignItems:'baseline',gap:8,marginBottom:10}}>
          <div style={{fontFamily:'Inter',fontSize:28,fontWeight:700,color:'var(--ink)'}}>{currencySymbol()}{fmtNum(D.BUDGET.spent)}</div>
          <div style={{color:'var(--ink-3)',fontSize:13}}>/ {currencySymbol()}{fmtNum(D.BUDGET.total)}</div>
        </div>
        <div className="budget-big-bar" style={{height:14,marginBottom:12}}>
          <div className="spent" style={{width: spentPct + '%'}}/>
          <div className="committed" style={{width: commPct + '%'}}/>
        </div>
        {D.BUDGET.categories.slice(0,4).map((c, i) => {
          const pct = c.planned === 0 ? 0 : (c.spent / c.planned) * 100;
          return (
            <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'6px 0',borderTop:'1px dashed var(--line)',fontSize:12.5}}>
              <span style={{width:8,height:8,borderRadius:2,background:'var(--c-'+c.color+')',flexShrink:0}}/>
              <span style={{flex:1,minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',color:'var(--ink-2)'}}>{c.name}</span>
              <span style={{color:'var(--ink-3)',fontFamily:'Inter',fontWeight:500}}>{currencySymbol()}{fmtNum(c.spent)} / {currencySymbol()}{fmtNum(c.planned)}</span>
              <span style={{color:'var(--ink-3)',fontFamily:'Inter',width:36,textAlign:'end'}}>{Math.round(pct)}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const TasksProgressWidget = ({ goTo }) => {
  const inProgress = D.PHASES.flatMap(p => p.tasks.map((t, i) => ({ ...t, phaseId: p.id, phaseName: p.name, phaseColor: p.color, idx: i })))
    .filter(t => t.s === 'progress');
  return (
    <div className="card">
      <div className="card-head">
        <h3>משימות בתהליך</h3>
        <button className="btn" style={{padding:'4px 10px',fontSize:12}} onClick={() => goTo('tasks')}>כל המשימות ←</button>
      </div>
      <div className="card-pad" style={{display:'flex',flexDirection:'column',gap:8}}>
        {inProgress.length === 0 && <div style={{color:'var(--ink-3)',fontSize:13}}>אין משימות בתהליך כרגע.</div>}
        {inProgress.map((t) => (
          <div key={t.phaseId+':'+t.idx} className="sprint-task">
            <window.TaskCheck phaseId={t.phaseId} idx={t.idx} status={t.s} size={18}/>
            <EditableO path={'task.'+t.phaseId+':'+t.idx+'.t'} value={t.t} as="div" className="text" inputStyle={{width:'100%'}}/>
            <span className="pill progress" style={{fontSize:10}}>{t.phaseName}</span>
            <EditableO path={'task.'+t.phaseId+':'+t.idx+'.d'} value={t.d} as="div" className="who"/>
          </div>
        ))}
      </div>
    </div>
  );
};

const TeamWidget = () => {
  const store = window.useTaskStore();
  return (
    <div className="card">
      <div className="card-head"><h3>צוות</h3><span className="sub">{D.TEAM.length} חברים</span></div>
      <div className="card-pad" style={{display:'flex',flexDirection:'column',gap:8}}>
        {D.TEAM.map((m, i) => (
          <div key={i} className="team-row" style={{padding:'8px 6px',borderRadius:8,background:'var(--surface-2)'}}>
            <div className={"avatar " + (i % 2 === 1 ? 'violet' : '')}>{m.initial}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontWeight:600}}><EditableO path={'team.'+i+'.name'} value={m.name}/></div>
              <div className="role"><EditableO path={'team.'+i+'.role'} value={m.role}/> · <EditableO path={'team.'+i+'.tasks'} value={m.tasks} numeric/> פעילות</div>
            </div>
            <DeleteBtnO onDelete={() => store.deleteFrom('team', i)}/>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================
const NewRiskRow = ({ onCancel, onSave }) => {
  const [title, setTitle] = React.useState('');
  const [level, setLevel] = React.useState('med');
  const [owner, setOwner] = React.useState('');
  return (
    <div style={{display:'flex',gap:8,padding:'10px 14px',borderBottom:'1px solid var(--line)',flexWrap:'wrap'}}>
      <input autoFocus className="filter-search" placeholder="כותרת הסיכון..." value={title}
        onChange={e => setTitle(e.target.value)} style={{flex:1,minWidth:200}}/>
      <select className="tp-select" value={level} onChange={e => setLevel(e.target.value)}>
        <option value="high">גבוה</option>
        <option value="med">בינוני</option>
        <option value="low">נמוך</option>
      </select>
      <input className="filter-search" placeholder="אחראי" value={owner}
        onChange={e => setOwner(e.target.value)} style={{width:120}}/>
      <button className="btn primary" onClick={() => title.trim() && onSave({title: title.trim(), level, owner: owner || '—', impact:'', mitigation:''})}>שמור</button>
      <button className="btn" onClick={onCancel}>ביטול</button>
    </div>
  );
};

const NewActivityRow = ({ onCancel, onSave }) => {
  const [text, setText] = React.useState('');
  const [type, setType] = React.useState('task');
  const [who, setWho] = React.useState('');
  const [time, setTime] = React.useState('עכשיו');
  return (
    <div style={{display:'flex',gap:8,padding:'10px 14px',borderBottom:'1px solid var(--line)',flexWrap:'wrap'}}>
      <input autoFocus className="filter-search" placeholder="מה קרה?" value={text}
        onChange={e => setText(e.target.value)} style={{flex:1,minWidth:200}}/>
      <select className="tp-select" value={type} onChange={e => setType(e.target.value)}>
        <option value="task">משימה</option>
        <option value="meeting">פגישה</option>
        <option value="decision">החלטה</option>
        <option value="risk">סיכון</option>
      </select>
      <input className="filter-search" placeholder="מי" value={who}
        onChange={e => setWho(e.target.value)} style={{width:100}}/>
      <input className="filter-search" placeholder="מתי" value={time}
        onChange={e => setTime(e.target.value)} style={{width:100}}/>
      <button className="btn primary" onClick={() => text.trim() && onSave({text: text.trim(), type, who: who || '—', time})}>שמור</button>
      <button className="btn" onClick={onCancel}>ביטול</button>
    </div>
  );
};

window.Overview = Overview;
window.phaseProgress = phaseProgress;
window.statusOf = statusOf;
window.fmtNum = fmtNum;
window.fmtCurrency = fmtCurrency;
window.fmtMoney = fmtMoney;
window.currencySymbol = currencySymbol;
