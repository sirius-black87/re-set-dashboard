// Phase timeline (Gantt) view + Tasks view + Modules view + Budget view
const D2 = window.RESET_DATA;
const { Editable, EditableSelect, DeleteBtn } = window;

// ============================ PHASES (GANTT) ============================
const Phases = () => {
  const store = window.useTaskStore();
  const editMode = store.editMode;
  const [expanded, setExpanded] = React.useState(null);
  const [drag, setDrag] = React.useState(null); // { phaseId, mode: 'move'|'start'|'end', startX, origStart, origEnd, trackWidth }
  const trackRef = React.useRef(null);
  const totalWeeks = D2.PROJECT.durationWeeks;
  const currentWeek = D2.PROJECT.currentWeek;

  // ---- Drag handling for phase bars ----
  React.useEffect(() => {
    if (!drag) return;
    const onMove = (e) => {
      const trackW = drag.trackWidth;
      const dx = e.clientX - drag.startX;
      // RTL: dragging right (positive dx) means EARLIER week in logical reading.
      // We use logical math: signedDx for "in document direction".
      const isRTL = document.documentElement.dir === 'rtl';
      const logicalDx = isRTL ? -dx : dx;
      const weekDelta = Math.round((logicalDx / trackW) * totalWeeks);
      let ns = drag.origStart;
      let ne = drag.origEnd;
      if (drag.mode === 'move') { ns = drag.origStart + weekDelta; ne = drag.origEnd + weekDelta; }
      else if (drag.mode === 'start') { ns = drag.origStart + weekDelta; }
      else if (drag.mode === 'end')   { ne = drag.origEnd + weekDelta; }
      ns = Math.max(1, Math.min(totalWeeks, ns));
      ne = Math.max(ns, Math.min(totalWeeks, ne));
      // Live update via direct mutation (no localStorage write yet)
      const ph = D2.PHASES.find(p => p.id === drag.phaseId);
      if (ph) { ph.startWeek = ns; ph.endWeek = ne; }
      setDrag({ ...drag, curStart: ns, curEnd: ne });
    };
    const onUp = () => {
      const ph = D2.PHASES.find(p => p.id === drag.phaseId);
      if (ph) {
        store.setEdit('phase.'+ph.id+'.startWeek', ph.startWeek);
        store.setEdit('phase.'+ph.id+'.endWeek',   ph.endWeek);
      }
      setDrag(null);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup',   onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [drag, store, totalWeeks]);

  const startDrag = (e, phaseId, mode) => {
    if (!editMode) return;
    e.stopPropagation();
    e.preventDefault();
    const trackEl = e.currentTarget.closest('.gantt-bar-track');
    if (!trackEl) return;
    const phase = D2.PHASES.find(p => p.id === phaseId);
    setDrag({
      phaseId, mode,
      startX: e.clientX,
      origStart: phase.startWeek,
      origEnd:   phase.endWeek,
      trackWidth: trackEl.getBoundingClientRect().width,
    });
  };

  const weekTicks = [];
  for (let w = 1; w <= totalWeeks; w++) {
    const date = D2.dateFromWeek(w);
    const day = date.getDate();
    const isMonthStart = day <= 7;
    const monthLabel = ['ינ','פב','מר','אפ','מאי','יונ','יול','אוג','ספ','אוק','נוב','דצ'][date.getMonth()];
    weekTicks.push({ w, isMonthStart, label: isMonthStart ? monthLabel : '·' });
  }

  return (
    <div className="view">
      <div className="card" style={{marginBottom: 18}}>
        <div className="card-head">
          <h3>טיימליין הפרויקט · {D2.PHASES.length} שלבים · {D2.fmtDateRange(D2.dateFromWeek(1), new Date(D2.dateFromWeek(totalWeeks).getTime() + 6*24*60*60*1000))}</h3>
          <div style={{display:'flex',gap:14,fontSize:12,color:'var(--ink-3)',flexWrap:'wrap',alignItems:'center'}}>
            {editMode && <span className="gantt-edit-hint"><Icon name="pencil" size={11}/> גרור בר כדי לשנות שבועות · גרור קצוות לשינוי משך</span>}
          </div>
        </div>

        <div className="gantt-wrap">
          <div className="gantt">
            <div className="gantt-head">
              <div className="gantt-head-spacer">שלב</div>
              <div className="gantt-weeks">
                {weekTicks.map(t => (
                  <div key={t.w} className={"gantt-week-tick " + (t.isMonthStart ? 'month-start' : '')}>
                    {t.label}
                  </div>
                ))}
              </div>
            </div>

            {D2.PHASES.map(p => {
              const pct = window.phaseProgress(p, currentWeek);
              const startPct = ((p.startWeek - 1) / totalWeeks) * 100;
              const widthPct = ((p.endWeek - p.startWeek + 1) / totalWeeks) * 100;
              const todayPct = ((currentWeek - 0.5) / totalWeeks) * 100;
              const isActive = p.startWeek <= currentWeek && p.endWeek >= currentWeek;
              const isExpanded = expanded === p.id;
              const cls = pct === 100 ? 'done' : (isActive || pct > 0 ? 'progress' : '');

              return (
                <React.Fragment key={p.id}>
                  <div
                    className={"gantt-row " + cls + (isExpanded ? ' expanded' : '')}
                    onClick={() => setExpanded(isExpanded ? null : p.id)}
                  >
                    <div className="label">
                      <div className="num">{p.id}</div>
                      <Editable path={'phase.'+p.id+'.name'} value={p.name} as="span" minWidth={120} />
                      <Icon name={isExpanded ? 'chevron-up' : 'chevron-down'} size={14} style={{opacity:0.5, marginInlineStart:'auto', marginInlineEnd:8}}/>
                    </div>
                    <div className="gantt-bar-track" style={{position:'relative'}}>
                      <div
                        className={"gantt-bar bg-" + p.color + (editMode ? ' editable-bar' : '')}
                        style={{
                          insetInlineStart: startPct + '%',
                          width: widthPct + '%',
                          opacity: pct === 0 ? 0.55 : 1,
                          cursor: editMode ? 'grab' : 'pointer',
                        }}
                        onMouseDown={editMode ? (e) => startDrag(e, p.id, 'move') : undefined}
                      >
                        <span style={{fontFamily:'Heebo',fontSize:11}}>
                          {pct > 0 && pct + '%'}
                          {editMode && (
                            <span style={{marginInlineStart:6,opacity:0.75,fontSize:10}}>W{p.startWeek}-{p.endWeek}</span>
                          )}
                        </span>
                        {editMode && (
                          <React.Fragment>
                            <div className="gantt-resize gantt-resize-start" onMouseDown={(e) => startDrag(e, p.id, 'start')} title="גרור לשינוי תחילת השלב"/>
                            <div className="gantt-resize gantt-resize-end"   onMouseDown={(e) => startDrag(e, p.id, 'end')}   title="גרור לשינוי סוף השלב"/>
                          </React.Fragment>
                        )}
                      </div>
                      {pct > 0 && pct < 100 && (
                        <div
                          style={{
                            position: 'absolute',
                            top: 4,
                            insetInlineStart: startPct + '%',
                            width: (widthPct * pct / 100) + '%',
                            height: 18,
                            borderRadius: '5px 0 0 5px',
                            background: 'rgba(255,255,255,0.25)',
                            pointerEvents: 'none',
                          }}
                        />
                      )}
                      <div className="gantt-today" style={{insetInlineStart: todayPct + '%'}}/>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="gantt-detail">
                      <div className="phase-detail-meta">
                        <div className="phase-meta-row">
                          <span className="kk">תאריכים:</span>
                          <span style={{fontWeight:600,color:'var(--ink-2)'}}>{D2.fmtDateRange(D2.phaseStartDate(p), D2.phaseEndDate(p))}</span>
                          <span className="kk" style={{marginInlineStart:14}}>שבועות:</span>
                          <Editable path={'phase.'+p.id+'.startWeek'} value={p.startWeek} numeric minWidth={50} inputStyle={{width:60}}/>
                          <span className="dash">–</span>
                          <Editable path={'phase.'+p.id+'.endWeek'} value={p.endWeek} numeric minWidth={50} inputStyle={{width:60}}/>
                          <span className="kk" style={{marginInlineStart:14}}>צבע:</span>
                          <EditableSelect path={'phase.'+p.id+'.color'} value={p.color}
                            options={['sky','indigo','violet','amber','rose','emerald','slate']}/>
                          <span style={{flex:1}}/>
                          <DeleteBtn confirmText={'למחוק את שלב "'+p.name+'" וכל המשימות שבו?'} onDelete={() => store.deletePhase(p.id)} title="מחק שלב"/>
                        </div>
                        <Editable path={'phase.'+p.id+'.summary'} value={p.summary} multiline placeholder="תיאור השלב..."
                          className="phase-summary-edit" inputStyle={{width:'100%'}}/>
                      </div>
                      <div className="tlist">
                        {p.tasks.map((t, i) => (
                          <div key={i} className={"sprint-task " + (t.s === 'done' ? 'done' : '')}>
                            <window.TaskCheck phaseId={p.id} idx={i} status={t.s} size={18}/>
                            <Editable path={'task.'+p.id+':'+i+'.t'} value={t.t} as="div" className="text" inputStyle={{width:'100%'}}/>
                            <EditableSelect path={'task.'+p.id+':'+i+'.p'} value={t.p}
                              options={[{value:'must',label:'חובה'},{value:'should',label:'חשוב'}]}
                              labelMap={{must:'חובה',should:'חשוב'}} className={"pill " + t.p}/>
                            <Editable path={'task.'+p.id+':'+i+'.d'} value={t.d} as="span" className="who" style={{minWidth:60,textAlign:'end'}}/>
                            <DeleteBtn onDelete={() => store.deleteTask(p.id, i)}/>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================ TASKS ============================
const PHASE_COLORS = ['sky','indigo','violet','amber','rose','emerald','slate'];

const Tasks = () => {
  const store = window.useTaskStore();
  const [filter, setFilter] = React.useState('all');
  const [search, setSearch] = React.useState('');
  const [openPhases, setOpenPhases] = React.useState(() => new Set(D2.PHASES.map(p => p.id)));
  const [addingTo, setAddingTo] = React.useState(null);
  const [showNewPhase, setShowNewPhase] = React.useState(false);

  const togglePhase = (id) => {
    setOpenPhases(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  const allTasks = D2.PHASES.flatMap(p => p.tasks);
  const counts = {
    all: allTasks.length,
    progress: allTasks.filter(t => t.s === 'progress').length,
    todo: allTasks.filter(t => t.s === 'todo').length,
    done: allTasks.filter(t => t.s === 'done').length,
    must: allTasks.filter(t => t.p === 'must').length,
  };

  const matchTask = (t) => {
    if (filter !== 'all') {
      if (filter === 'must' && t.p !== 'must') return false;
      if (filter !== 'must' && t.s !== filter) return false;
    }
    if (search) {
      const s = search.toLowerCase();
      if (!t.t.toLowerCase().includes(s)) return false;
    }
    return true;
  };

  const FILTERS = [
    { k: 'all', label: 'כל המשימות' },
    { k: 'progress', label: 'בתהליך' },
    { k: 'todo', label: 'ממתינות' },
    { k: 'done', label: 'הושלמו' },
    { k: 'must', label: 'חובה (MoSCoW)' },
  ];

  const expandAll = () => setOpenPhases(new Set(D2.PHASES.map(p => p.id)));
  const collapseAll = () => setOpenPhases(new Set());

  return (
    <div className="view">
      <div className="task-filters">
        {FILTERS.map(f => (
          <button
            key={f.k}
            className={"filter-btn " + (filter === f.k ? 'active' : '')}
            onClick={() => setFilter(f.k)}
          >
            {f.label} <span className="count">{counts[f.k]}</span>
          </button>
        ))}
        <input
          type="text"
          className="filter-search"
          placeholder="חיפוש משימה..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button className="btn btn-ghost-sm" onClick={expandAll} title="פתח הכל">
          <Icon name="chevron-down" size={14}/>
        </button>
        <button className="btn btn-ghost-sm" onClick={collapseAll} title="סגור הכל">
          <Icon name="chevron-up" size={14}/>
        </button>
      </div>

      <div className="task-phases">
        {D2.PHASES.map(p => {
          const open = openPhases.has(p.id);
          const total = p.tasks.length;
          const doneCount = p.tasks.filter(t => t.s === 'done').length;
          const pct = total === 0 ? 0 : Math.round((doneCount / total) * 100);
          const tasksToShow = p.tasks
            .map((t, idx) => ({...t, _idx: idx}))
            .filter(matchTask);
          const phaseColor = 'var(--c-' + p.color + ')';
          const phaseSoft = 'var(--c-' + p.color + '-soft)';
          return (
            <div key={p.id} className="tp-block">
              <div
                className={"tp-head " + (open ? 'open' : '')}
                onClick={() => togglePhase(p.id)}
                style={{borderInlineStartColor: phaseColor}}
              >
                <Icon name={open ? 'chevron-up' : 'chevron-down'} size={14} className="tp-chev"/>
                <span className="tp-num" style={{background: phaseSoft, color: phaseColor}}>{p.id}</span>
                <Editable path={'phase.'+p.id+'.name'} value={p.name} as="span" className="tp-name" minWidth={150}/>
                <span className="tp-count">{total} משימות</span>
                <div className="tp-progress">
                  <div className="tp-progress-bar">
                    <div className="tp-progress-fill" style={{width: pct + '%', background: phaseColor}}></div>
                  </div>
                  <span className="tp-pct">{pct}%</span>
                </div>
                <button
                  className="tp-add-btn"
                  onClick={(e) => { e.stopPropagation(); setAddingTo(addingTo === p.id ? null : p.id); if (!open) togglePhase(p.id); }}
                  title="הוסף משימה לשלב"
                >
                  <Icon name="plus" size={13}/> משימה
                </button>
                <DeleteBtn
                  confirmText={'למחוק את שלב "'+p.name+'" וכל המשימות שבו?'}
                  onDelete={() => store.deletePhase(p.id)}
                  className="tp-del"
                  title="מחק שלב"
                />
              </div>

              {open && (
                <div className="tp-body">
                  {tasksToShow.length === 0 && addingTo !== p.id && (
                    <div className="tp-empty">לא נמצאו משימות תואמות בשלב זה.</div>
                  )}
                  {tasksToShow.length > 0 && (
                    <div className="task-table tp-table">
                      <div className="task-th">
                        <div></div>
                        <div>משימה</div>
                        <div>תעדוף</div>
                        <div>משך</div>
                        <div>סטטוס</div>
                        <div></div>
                      </div>
                      {tasksToShow.map(t => (
                        <TaskRow
                          key={t._id || t._idx}
                          phaseId={p.id}
                          idx={t._idx}
                          task={t}
                          store={store}
                        />
                      ))}
                    </div>
                  )}
                  {store.editMode && (
                    <PhaseDropZone phaseId={p.id} taskCount={p.tasks.length} store={store}/>
                  )}
                  {addingTo === p.id && (
                    <NewTaskRow
                      phaseId={p.id}
                      onCancel={() => setAddingTo(null)}
                      onSave={(data) => { store.addTask(p.id, data); setAddingTo(null); }}
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}

        {showNewPhase ? (
          <NewPhaseRow
            onCancel={() => setShowNewPhase(false)}
            onSave={(data) => {
              const id = store.addPhase(data);
              setShowNewPhase(false);
              setOpenPhases(prev => new Set(prev).add(id));
            }}
          />
        ) : (
          <button className="btn add-phase-btn" onClick={() => setShowNewPhase(true)}>
            <Icon name="plus" size={14}/> הוסף שלב חדש
          </button>
        )}
      </div>
    </div>
  );
};

const TaskRow = ({ phaseId, idx, task, store }) => {
  const [open, setOpen] = React.useState(false);
  const [dragHover, setDragHover] = React.useState(false);
  const editMode = store.editMode;
  const notes = task.notes || [];
  const hasNotes = notes.length > 0;

  const onDragStart = (e) => {
    if (!editMode) { e.preventDefault(); return; }
    e.dataTransfer.setData('application/x-reset-task', JSON.stringify({ phaseId, idx }));
    e.dataTransfer.effectAllowed = 'move';
    e.stopPropagation();
  };
  const onDragOver = (e) => {
    if (!editMode) return;
    const types = e.dataTransfer && e.dataTransfer.types;
    if (!types || !Array.from(types).some(t => t.indexOf('reset-task') >= 0)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragHover(true);
  };
  const onDragLeave = () => setDragHover(false);
  const onDrop = (e) => {
    setDragHover(false);
    if (!editMode) return;
    const raw = e.dataTransfer.getData('application/x-reset-task');
    if (!raw) return;
    e.preventDefault();
    e.stopPropagation();
    try {
      const src = JSON.parse(raw);
      if (src.phaseId === phaseId && src.idx === idx) return; // no-op
      store.moveTask(src.phaseId, src.idx, phaseId, idx);
    } catch (err) {}
  };

  return (
    <React.Fragment>
      <div
        className={"task-tr tp-tr " + task.s + (hasNotes ? ' has-notes' : '') + (open ? ' expanded' : '') + (dragHover ? ' drop-target' : '') + (editMode ? ' draggable' : '')}
        style={{cursor: editMode ? 'grab' : 'pointer'}}
        draggable={editMode}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <div>
          {editMode && <span className="drag-handle" title="גרור להעביר">⋮⋮</span>}
          <window.TaskCheck phaseId={phaseId} idx={idx} status={task.s} size={18}/>
        </div>
        <div className="text">
          <Editable path={'task.'+phaseId+':'+idx+'.t'} value={task.t} inputStyle={{width:'100%'}}/>
          {hasNotes && (() => {
            const subtasks = notes.filter(n => n.kind === 'subtask');
            if (subtasks.length === 0) {
              return <span className="note-dot" title={notes.length + ' הערות'}/>;
            }
            const done = subtasks.filter(n => n.s === 'done').length;
            const inProg = subtasks.filter(n => n.s === 'progress').length;
            const state = done === subtasks.length ? 'all-done'
                        : (inProg > 0 || done > 0) ? 'progress'
                        : 'todo';
            return (
              <span className={'subtask-badge ' + state} title={done + '/' + subtasks.length + ' תתי-משימות הושלמו'}>
                {done}/{subtasks.length}
              </span>
            );
          })()}
        </div>
        <div>
          <EditableSelect path={'task.'+phaseId+':'+idx+'.p'} value={task.p}
            options={[{value:'must',label:'חובה'},{value:'should',label:'חשוב'}]}
            labelMap={{must:'חובה',should:'חשוב'}} className={"pill " + task.p}/>
        </div>
        <div className="duration">
          <Editable path={'task.'+phaseId+':'+idx+'.d'} value={task.d} inputStyle={{width:90}}/>
        </div>
        <div>
          <span className={"pill " + task.s}>
            {task.s === 'done' ? 'הושלם' : task.s === 'progress' ? 'בתהליך' : 'ממתין'}
          </span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:4}}>
          {editMode && (
            <MoveTaskMenu phaseId={phaseId} idx={idx} store={store}/>
          )}
          <button
            className="row-toggle"
            title={hasNotes ? notes.length + ' הערות — לחץ ' + (open ? 'לסגירה' : 'להצגה') : 'הוסף הערה / מעקב'}
            onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
          >
            <Icon name={open ? 'chevron-up' : 'chevron-down'} size={13}/>
          </button>
          <DeleteBtn onDelete={() => store.deleteTask(phaseId, idx)}/>
        </div>
      </div>
      {open && (
        <TaskNotes phaseId={phaseId} idx={idx} store={store} notes={notes}/>
      )}
    </React.Fragment>
  );
};

// Drop zone at the end of a phase's task list — drop here to append the task to this phase
const PhaseDropZone = ({ phaseId, taskCount, store }) => {
  const [hover, setHover] = React.useState(false);
  const onDragOver = (e) => {
    const types = e.dataTransfer && e.dataTransfer.types;
    if (!types || !Array.from(types).some(t => t.indexOf('reset-task') >= 0)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setHover(true);
  };
  const onDrop = (e) => {
    setHover(false);
    const raw = e.dataTransfer.getData('application/x-reset-task');
    if (!raw) return;
    e.preventDefault();
    try {
      const src = JSON.parse(raw);
      store.moveTask(src.phaseId, src.idx, phaseId, taskCount);
    } catch (err) {}
  };
  return (
    <div
      className={"phase-drop-zone " + (hover ? 'hover' : '')}
      onDragOver={onDragOver}
      onDragLeave={() => setHover(false)}
      onDrop={onDrop}
    >
      ↓ שחרר כאן כדי להעביר משימה לסוף השלב
    </div>
  );
};

// Inline phase-picker menu for moving a task to another phase
const MoveTaskMenu = ({ phaseId, idx, store }) => {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);
  return (
    <div className="move-task-menu" ref={ref}>
      <button className="row-toggle" title="העבר לשלב אחר" onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}>↔</button>
      {open && (
        <div className="move-task-dropdown" onClick={(e) => e.stopPropagation()}>
          <div className="move-task-head">העבר לשלב:</div>
          {D2.PHASES.filter(p => p.id !== phaseId).map(p => (
            <button key={p.id} className="move-task-opt" onClick={() => { store.moveTask(phaseId, idx, p.id, p.tasks.length); setOpen(false); }}>
              <span className="num" style={{background:'var(--c-'+p.color+'-soft)',color:'var(--c-'+p.color+')'}}>{p.id}</span>
              <span>{p.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const TaskNotes = ({ phaseId, idx, store, notes }) => {
  const [text, setText] = React.useState('');
  // noteKind: 'note' | 'status' | 'subtask' — radio choice at creation time
  const [noteKind, setNoteKind] = React.useState('note');
  const [editingIdx, setEditingIdx] = React.useState(-1);
  const [editingText, setEditingText] = React.useState('');

  const submit = () => {
    if (!text.trim()) return;
    store.addNote(phaseId, idx, text, noteKind === 'status', noteKind === 'subtask');
    setText('');
    setNoteKind('note');
  };

  const startEdit = (i, t) => { setEditingIdx(i); setEditingText(t); };
  const saveEdit  = () => {
    if (editingText.trim()) store.updateNote(phaseId, idx, editingIdx, editingText);
    setEditingIdx(-1);
  };
  const cancelEdit = () => { setEditingIdx(-1); setEditingText(''); };

  const subtasks = notes.filter(n => n.kind === 'subtask');
  const subtasksDone = subtasks.filter(n => n.s === 'done').length;

  const fmtTime = (ts) => {
    const d = new Date(ts);
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    const opts = sameDay
      ? { hour: '2-digit', minute: '2-digit' }
      : { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' };
    return d.toLocaleString('he-IL', opts);
  };

  return (
    <div className="task-notes" onClick={(e) => e.stopPropagation()}>
      <div className="task-notes-head">
        <Icon name="list" size={13} style={{color:'var(--ink-3)'}}/>
        <span className="lbl">הערות ותתי-משימות</span>
        <span className="count">{notes.length} {notes.length === 1 ? 'רשומה' : 'רשומות'}</span>
        {subtasks.length > 0 && (
          <span className="count subtask-count">{subtasksDone}/{subtasks.length} תתי-משימות הושלמו</span>
        )}
      </div>

      {notes.length === 0 ? (
        <div className="notes-empty">אין הערות עדיין — הוסף הערה, עדכון סטטוס או תת-משימה.</div>
      ) : (
        <div className="notes-list">
          {notes.slice().reverse().map((n, i) => {
            const realIdx = notes.length - 1 - i;
            const isSub = n.kind === 'subtask';
            const isEditing = editingIdx === realIdx;
            const noteCls = 'note-item'
              + (n.kind === 'status' ? ' status-update' : '')
              + (isSub ? ' is-subtask ' + (n.s || 'todo') : '');
            return (
              <div key={realIdx} className={noteCls}>
                {isSub && (
                  <button
                    className={'note-status ' + (n.s || 'todo')}
                    title={n.s === 'done' ? 'הושלם — לחץ לאיפוס' : n.s === 'progress' ? 'בתהליך — לחץ לסיום' : 'ממתין — לחץ להתחלה'}
                    onClick={(e) => { e.stopPropagation(); store.cycleNoteStatus(phaseId, idx, realIdx); }}
                  >
                    {n.s === 'done' && <Icon name="check" size={11}/>}
                  </button>
                )}

                <div className="note-body">
                  {isEditing ? (
                    <textarea
                      autoFocus
                      className="note-edit-textarea"
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') cancelEdit();
                        else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) saveEdit();
                      }}
                      rows={2}
                    />
                  ) : (
                    <div className="text">{n.text}</div>
                  )}
                  <div className="meta">
                    {n.kind === 'status' && <span className="tag status">עדכון סטטוס</span>}
                    {isSub && <span className="tag subtask">תת-משימה</span>}
                    <span>{fmtTime(n.ts)}</span>
                    {n.editedAt && <span style={{color:'var(--ink-4)'}}>· נערך</span>}
                  </div>
                </div>

                <div className="note-actions">
                  {isEditing ? (
                    <React.Fragment>
                      <button className="note-btn save" title="שמור (Ctrl+Enter)" onClick={saveEdit}>
                        <Icon name="check" size={13}/>
                      </button>
                      <button className="note-btn" title="ביטול (Esc)" onClick={cancelEdit}>
                        <Icon name="x" size={13}/>
                      </button>
                    </React.Fragment>
                  ) : (
                    <React.Fragment>
                      <button
                        className="note-btn edit-btn"
                        title="ערוך הערה"
                        onClick={() => startEdit(realIdx, n.text)}
                      ><Icon name="pencil" size={13}/></button>
                      <button
                        className="note-btn del"
                        title="מחק"
                        onClick={() => store.removeNote(phaseId, idx, realIdx)}
                      ><Icon name="trash" size={13}/></button>
                    </React.Fragment>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="note-compose">
        <textarea
          placeholder="כתוב הערה, עדכון סטטוס או תת-משימה..."
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { submit(); }
          }}
        />
        <div className="note-compose-row">
          <div className="note-kind-picker" role="radiogroup" aria-label="סוג הרשומה">
            <label className={'kind-opt ' + (noteKind === 'note' ? 'active' : '')}>
              <input type="radio" name={'kind-'+phaseId+'-'+idx} checked={noteKind === 'note'} onChange={() => setNoteKind('note')}/>
              📝 הערה
            </label>
            <label className={'kind-opt ' + (noteKind === 'status' ? 'active' : '')}>
              <input type="radio" name={'kind-'+phaseId+'-'+idx} checked={noteKind === 'status'} onChange={() => setNoteKind('status')}/>
              📍 עדכון סטטוס
            </label>
            <label className={'kind-opt ' + (noteKind === 'subtask' ? 'active' : '')}>
              <input type="radio" name={'kind-'+phaseId+'-'+idx} checked={noteKind === 'subtask'} onChange={() => setNoteKind('subtask')}/>
              ☑ תת-משימה
            </label>
          </div>
          <span className="spacer"></span>
          <button className="btn primary" onClick={submit} disabled={!text.trim()}>
            <Icon name="plus" size={12}/> הוסף
          </button>
        </div>
      </div>
    </div>
  );
};

const NewTaskRow = ({ phaseId, onCancel, onSave }) => {
  const [t, setT] = React.useState('');
  const [p, setP] = React.useState('should');
  const [d, setD] = React.useState('1 שבוע');
  const save = () => { if (t.trim()) onSave({t: t.trim(), p, d, s: 'todo'}); };
  return (
    <div className="tp-new-task">
      <input
        autoFocus
        className="filter-search tp-new-input-main"
        placeholder="שם משימה חדשה..."
        value={t}
        onChange={e => setT(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') onCancel(); }}
      />
      <div className="tp-new-row2">
        <select className="tp-select" value={p} onChange={e => setP(e.target.value)}>
          <option value="must">חובה</option>
          <option value="should">חשוב</option>
        </select>
        <input
          className="filter-search"
          placeholder="משך"
          value={d}
          onChange={e => setD(e.target.value)}
          style={{flex: 1}}
        />
      </div>
      <div className="tp-new-row3">
        <button className="btn primary" style={{flex:1}} onClick={save}>שמור</button>
        <button className="btn" style={{flex:1}} onClick={onCancel}>ביטול</button>
      </div>
    </div>
  );
};

const NewPhaseRow = ({ onCancel, onSave }) => {
  const [name, setName] = React.useState('');
  const [color, setColor] = React.useState('slate');
  return (
    <div className="tp-new-phase">
      <Icon name="plus" size={14}/>
      <input
        autoFocus
        className="filter-search"
        placeholder="שם השלב החדש..."
        value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && name.trim()) onSave({name: name.trim(), color}); if (e.key === 'Escape') onCancel(); }}
        style={{flex: 1}}
      />
      <div className="color-picker">
        {PHASE_COLORS.map(c => (
          <button
            key={c}
            className={"color-swatch " + (color === c ? 'active' : '')}
            style={{background: 'var(--c-' + c + ')'}}
            onClick={() => setColor(c)}
            title={c}
          />
        ))}
      </div>
      <button className="btn primary" onClick={() => name.trim() && onSave({name: name.trim(), color})}>שמור</button>
      <button className="btn" onClick={onCancel}>ביטול</button>
    </div>
  );
};

// ============================ MODULES ============================
const MODULE_ICONS = ['users', 'heart', 'scale', 'shield', 'sparkles', 'wallet', 'activity', 'flag', 'list', 'grid'];
const FEATURE_STATUSES = [{value:'todo',label:'מתוכנן'},{value:'spec',label:'אופיין'},{value:'progress',label:'בפיתוח'},{value:'done',label:'הושלם'}];
const FEATURE_LABELS = {todo:'מתוכנן',spec:'אופיין',progress:'בפיתוח',done:'הושלם'};

const Modules = () => {
  const store = window.useTaskStore();
  const [showNew, setShowNew] = React.useState(false);
  const [addingFeatureTo, setAddingFeatureTo] = React.useState(null);

  return (
    <div className="view">
      <div className="modules-grid">
        {D2.MODULES.map(m => {
          const total = m.features.length;
          const fDone = m.features.filter(f => f.status === 'done').length;
          const fProg = m.features.filter(f => f.status === 'progress' || f.status === 'spec').length;
          const livePct = total === 0
            ? (m.progress || 0)
            : Math.round(((fDone + fProg * 0.4) / total) * 100);
          const iconCls = m.custom ? 'custom' : m.id;
          const iconStyle = m.custom ? {
            background: 'var(--c-' + (m.color || 'slate') + '-soft)',
            color: 'var(--c-' + (m.color || 'slate') + ')',
          } : {};
          return (
          <div key={m.id} className="module-card">
            <div className="module-head">
              <div className={"module-icon-box " + iconCls} style={iconStyle}>
                <Icon name={m.icon} size={22}/>
              </div>
              <div style={{flex:1, minWidth:0}}>
                <h3><Editable path={'module.'+m.id+'.name'} value={m.name} inputStyle={{width:'100%'}}/></h3>
                <div className="en">
                  <Editable path={'module.'+m.id+'.en'} value={m.en} inputStyle={{width:'100%'}}/> Module
                </div>
                <div className="desc">
                  <Editable path={'module.'+m.id+'.desc'} value={m.desc} multiline placeholder="תיאור המודול..." inputStyle={{width:'100%'}}/>
                </div>
              </div>
              <DeleteBtn confirmText={'למחוק את המודול "'+m.name+'"?'} onDelete={() => store.deleteModule(m.id)} title="מחק מודול"/>
            </div>
            <div className="module-edit-row">
              <span className="kk">אייקון:</span>
              <EditableSelect path={'module.'+m.id+'.icon'} value={m.icon} options={MODULE_ICONS}/>
              <span className="kk">צבע:</span>
              <EditableSelect path={'module.'+m.id+'.color'} value={m.color || 'slate'} options={PHASE_COLORS}/>
            </div>
            <div className="module-progress-row">
              <div className="num">{livePct}<span style={{fontSize:13,color:'var(--ink-3)'}}>%</span></div>
              <div className="bar"><i style={{width: livePct + '%'}}/></div>
              <div className="lbl">
                {m.phases && m.phases.length > 0
                  ? 'שלבים ' + m.phases.join(', ')
                  : total + ' תכונות'}
              </div>
            </div>
            <div className="module-features">
              {m.features.map((f, i) => (
                <div key={i} className="module-feature">
                  <div className={"task-status " + f.status}>
                    {f.status === 'done' && <Icon name="check" size={11}/>}
                  </div>
                  <div className="name">
                    <Editable path={'feature.'+m.id+'.'+i+'.name'} value={f.name} inputStyle={{width:'100%'}}/>
                  </div>
                  <EditableSelect
                    path={'feature.'+m.id+'.'+i+'.status'} value={f.status}
                    options={FEATURE_STATUSES} labelMap={FEATURE_LABELS}
                    className={"pill " + (f.status === 'spec' ? 'progress' : f.status)}/>
                  <DeleteBtn onDelete={() => store.deleteFeature(m.id, i)}/>
                </div>
              ))}
              {m.features.length === 0 && addingFeatureTo !== m.id && (
                <div className="module-empty">אין תכונות עדיין — הוסף את הראשונה.</div>
              )}
              {addingFeatureTo === m.id ? (
                <NewFeatureRow
                  onCancel={() => setAddingFeatureTo(null)}
                  onSave={(data) => { store.addFeature(m.id, data); setAddingFeatureTo(null); }}
                />
              ) : (
                <button className="module-add-feature" onClick={() => setAddingFeatureTo(m.id)}>
                  <Icon name="plus" size={12}/> הוסף תכונה
                </button>
              )}
            </div>
          </div>
          );
        })}

        {showNew ? (
          <NewModuleCard
            onCancel={() => setShowNew(false)}
            onSave={(data) => { store.addModule(data); setShowNew(false); }}
          />
        ) : (
          <button className="module-card add-module-card" onClick={() => setShowNew(true)}>
            <Icon name="plus" size={20}/>
            <span>הוסף מודול חדש</span>
            <span className="hint">לדוגמה: התראות, אנליטיקס, פרופיל, צ׳אט-בוט</span>
          </button>
        )}
      </div>
    </div>
  );
};

const NewModuleCard = ({ onCancel, onSave }) => {
  const [name, setName] = React.useState('');
  const [en, setEn] = React.useState('');
  const [desc, setDesc] = React.useState('');
  const [icon, setIcon] = React.useState('grid');
  const [color, setColor] = React.useState('slate');

  const submit = () => {
    if (!name.trim()) return;
    onSave({ name: name.trim(), en: en.trim() || name.trim(), desc: desc.trim(), icon, color });
  };

  return (
    <div className="module-card new-module-card">
      <div className="module-head">
        <div className="module-icon-box custom" style={{background:'var(--c-'+color+'-soft)', color:'var(--c-'+color+')'}}>
          <Icon name={icon} size={22}/>
        </div>
        <div style={{flex:1}}>
          <input autoFocus className="nm-input nm-title" placeholder="שם המודול" value={name} onChange={e => setName(e.target.value)}/>
          <input className="nm-input nm-en" placeholder="English label" value={en} onChange={e => setEn(e.target.value)}/>
          <input className="nm-input nm-desc" placeholder="תיאור קצר של המודול" value={desc} onChange={e => setDesc(e.target.value)}/>
        </div>
      </div>

      <div className="nm-section">
        <div className="nm-label">צבע</div>
        <div className="color-picker">
          {['sky','indigo','violet','amber','rose','emerald','slate'].map(c => (
            <button key={c} className={"color-swatch " + (color === c ? 'active' : '')}
              style={{background: 'var(--c-' + c + ')'}} onClick={() => setColor(c)}/>
          ))}
        </div>
      </div>

      <div className="nm-section">
        <div className="nm-label">אייקון</div>
        <div className="icon-picker">
          {MODULE_ICONS.map(ic => (
            <button key={ic} className={"icon-choice " + (icon === ic ? 'active' : '')}
              onClick={() => setIcon(ic)} title={ic}>
              <Icon name={ic} size={16}/>
            </button>
          ))}
        </div>
      </div>

      <div className="nm-actions">
        <button className="btn primary" onClick={submit}>צור מודול</button>
        <button className="btn" onClick={onCancel}>ביטול</button>
      </div>
    </div>
  );
};

const NewFeatureRow = ({ onCancel, onSave }) => {
  const [name, setName] = React.useState('');
  const [status, setStatus] = React.useState('todo');
  return (
    <div className="module-new-feature">
      <input autoFocus className="filter-search" placeholder="שם התכונה..." value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && name.trim()) onSave({name: name.trim(), status}); if (e.key === 'Escape') onCancel(); }}
        style={{flex: 1}}/>
      <select className="tp-select" value={status} onChange={e => setStatus(e.target.value)}>
        <option value="todo">מתוכנן</option>
        <option value="spec">אופיין</option>
        <option value="progress">בפיתוח</option>
        <option value="done">הושלם</option>
      </select>
      <button className="btn primary" onClick={() => name.trim() && onSave({name: name.trim(), status})}>שמור</button>
      <button className="btn" onClick={onCancel}>ביטול</button>
    </div>
  );
};

// ============================ BUDGET ============================
const Budget = () => {
  const store = window.useTaskStore();
  const [showNewCat, setShowNewCat] = React.useState(false);
  const totalSpent = D2.BUDGET.spent;
  const totalCommitted = D2.BUDGET.committed;
  const totalPlanned = D2.BUDGET.total;
  const spentPct = totalPlanned > 0 ? (totalSpent / totalPlanned) * 100 : 0;
  const commPct  = totalPlanned > 0 ? (totalCommitted / totalPlanned) * 100 : 0;

  return (
    <div className="view">
      <div className="budget-overview">
        <div className="budget-big">
          <div className="label">תקציב כולל</div>
          <div className="total">
            <span className="currency">{window.currencySymbol()}</span>
            <Editable path="budget.total" value={totalPlanned} numeric
              format={(v) => window.fmtNum(v)} inputStyle={{width:160,fontSize:'inherit'}}/>
          </div>
          <div className="sub">תקציב לטווח של 6-8 חודשים · {D2.PROJECT.durationWeeks} שבועות</div>
          <div className="budget-big-bar">
            <div className="spent" style={{width: spentPct + '%'}}/>
            <div className="committed" style={{width: commPct + '%'}}/>
          </div>
          <div className="budget-big-legend">
            <div className="item">
              <span className="swatch" style={{background:'var(--primary)'}}/>
              נוצל · {window.currencySymbol()}<Editable path="budget.spent" value={totalSpent} numeric format={(v) => window.fmtNum(v)} inputStyle={{width:90}}/> ({Math.round(spentPct)}%)
            </div>
            <div className="item">
              <span className="swatch" style={{background:'var(--c-amber)',opacity:0.7}}/>
              מחויב · {window.currencySymbol()}<Editable path="budget.committed" value={totalCommitted} numeric format={(v) => window.fmtNum(v)} inputStyle={{width:90}}/> ({Math.round(commPct)}%)
            </div>
            <div className="item">
              <span className="swatch" style={{background:'var(--surface)',border:'1px solid var(--line-2)'}}/>
              זמין · {window.currencySymbol()}{window.fmtNum(totalPlanned - totalSpent - totalCommitted)}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <h3>פירוט קטגוריות</h3>
            <button className="btn btn-ghost-sm" onClick={() => setShowNewCat(true)} title="הוסף קטגוריה">
              <Icon name="plus" size={12}/> קטגוריה
            </button>
          </div>
          <div>
            {D2.BUDGET.categories.map((c, i) => {
              const pct = c.planned === 0 ? 0 : (c.spent / c.planned) * 100;
              return (
                <div key={i} className="budget-cat">
                  <div className="budget-cat-head">
                    <div style={{display:'flex',alignItems:'center',gap:8,flex:1,minWidth:0}}>
                      <EditableSelect path={'budgetCat.'+i+'.color'} value={c.color}
                        options={PHASE_COLORS}
                        style={{display:'inline-flex'}}/>
                      <span style={{width:10,height:10,borderRadius:3,background:'var(--c-' + c.color + ')',flexShrink:0}}/>
                      <Editable path={'budgetCat.'+i+'.name'} value={c.name} className="budget-cat-name" inputStyle={{width:'100%',maxWidth:280}}/>
                    </div>
                    <div className="budget-cat-amounts">
                      <strong>{window.currencySymbol()}<Editable path={'budgetCat.'+i+'.spent'} value={c.spent} numeric format={(v)=>window.fmtNum(v)} inputStyle={{width:80}}/></strong>
                      {' / '}
                      {window.currencySymbol()}<Editable path={'budgetCat.'+i+'.planned'} value={c.planned} numeric format={(v)=>window.fmtNum(v)} inputStyle={{width:80}}/>
                      <span style={{color:'var(--ink-4)'}}> ({Math.round(pct)}%)</span>
                      <DeleteBtn onDelete={() => store.deleteFrom('budgetCats', i)}/>
                    </div>
                  </div>
                  <div className="budget-cat-bar"><i style={{width: pct + '%', background: 'var(--c-' + c.color + ')'}}/></div>
                </div>
              );
            })}
            {showNewCat && (
              <NewBudgetCatRow
                onCancel={() => setShowNewCat(false)}
                onSave={(data) => { store.addBudgetCategory(data); setShowNewCat(false); }}
              />
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h3>לוח זמנים תקציבי</h3>
          <span className="sub">קצב שריפה צפוי לעומת בפועל</span>
        </div>
        <div className="card-pad">
          <BurnChart />
        </div>
      </div>
    </div>
  );
};

const NewBudgetCatRow = ({ onCancel, onSave }) => {
  const [name, setName] = React.useState('');
  const [planned, setPlanned] = React.useState('');
  const [color, setColor] = React.useState('slate');
  return (
    <div className="tp-new-task" style={{padding:'10px 14px'}}>
      <input autoFocus className="filter-search" placeholder="שם הקטגוריה..." value={name}
        onChange={e => setName(e.target.value)} style={{flex:1,minWidth:200}}/>
      <input className="filter-search" type="number" placeholder={'מתוכנן ' + window.currencySymbol()} value={planned}
        onChange={e => setPlanned(e.target.value)} style={{width:120}}/>
      <select className="tp-select" value={color} onChange={e => setColor(e.target.value)}>
        {PHASE_COLORS.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
      <button className="btn primary" onClick={() => name.trim() && onSave({name: name.trim(), planned: Number(planned) || 0, color})}>שמור</button>
      <button className="btn" onClick={onCancel}>ביטול</button>
    </div>
  );
};

const BurnChart = () => {
  const weeks = D2.PROJECT.durationWeeks;
  const total = D2.BUDGET.total;
  const planned = [];
  const actual = [];
  for (let w = 0; w <= weeks; w++) {
    const x = w / weeks;
    const y = 1 / (1 + Math.exp(-8 * (x - 0.5)));
    planned.push({ w, v: y * total });
  }
  for (let w = 0; w <= D2.PROJECT.currentWeek; w++) {
    const x = w / weeks;
    const y = 1 / (1 + Math.exp(-8 * (x - 0.5)));
    actual.push({ w, v: y * total * 0.85 });
  }

  const W = 800, H = 220, P = 30;
  const xMap = w => P + (w / weeks) * (W - 2*P);
  const yMap = v => total > 0 ? (H - P - (v / total) * (H - 2*P)) : (H - P);

  const plannedPath = planned.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xMap(p.w)} ${yMap(p.v)}`).join(' ');
  const actualPath = actual.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xMap(p.w)} ${yMap(p.v)}`).join(' ');

  return (
    <div style={{position:'relative'}}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{width:'100%', height: 220}}>
        {[0, 0.25, 0.5, 0.75, 1].map(f => (
          <g key={f}>
            <line x1={P} y1={yMap(total*f)} x2={W-P} y2={yMap(total*f)} stroke="var(--line)" strokeDasharray="2 4"/>
            <text x={W-P+4} y={yMap(total*f)+4} fontSize="10" fill="var(--ink-3)" fontFamily="Inter">
              {window.currencySymbol()}{(total*f/1000).toFixed(0)}K
            </text>
          </g>
        ))}
        {[1, 8, 16, 24, weeks].map(w => (
          <text key={w} x={xMap(w)} y={H-P+18} fontSize="10" fill="var(--ink-3)" textAnchor="middle" fontFamily="Inter">
            W{w}
          </text>
        ))}
        <line x1={xMap(D2.PROJECT.currentWeek)} y1={P} x2={xMap(D2.PROJECT.currentWeek)} y2={H-P} stroke="var(--risk-high)" strokeWidth="1.5"/>
        <text x={xMap(D2.PROJECT.currentWeek)} y={P-6} fontSize="10" fill="var(--risk-high)" textAnchor="middle" fontWeight="600">היום</text>

        <path d={plannedPath + ` L ${xMap(weeks)} ${H-P} L ${xMap(0)} ${H-P} Z`} fill="var(--primary-soft)" opacity="0.6"/>
        <path d={plannedPath} stroke="var(--primary)" strokeWidth="1.5" fill="none" strokeDasharray="4 4"/>
        <path d={actualPath} stroke="var(--c-emerald)" strokeWidth="2.5" fill="none"/>
        {actual.map((p, i) => i % 2 === 0 && (
          <circle key={i} cx={xMap(p.w)} cy={yMap(p.v)} r="3" fill="var(--c-emerald)"/>
        ))}
      </svg>
      <div style={{display:'flex',gap:18,fontSize:12,color:'var(--ink-2)',marginTop:8,paddingInlineStart:30}}>
        <div style={{display:'flex',alignItems:'center',gap:6}}>
          <span style={{width:18,height:2,background:'var(--primary)',borderTop:'1px dashed var(--primary)'}}/> מתוכנן
        </div>
        <div style={{display:'flex',alignItems:'center',gap:6}}>
          <span style={{width:18,height:2,background:'var(--c-emerald)'}}/> בפועל ({D2.BUDGET.total > 0 ? Math.round(D2.BUDGET.spent/D2.BUDGET.total*100) : 0}% מהתקציב)
        </div>
      </div>
    </div>
  );
};

window.Phases = Phases;
window.Tasks = Tasks;
window.Modules = Modules;
window.Budget = Budget;
