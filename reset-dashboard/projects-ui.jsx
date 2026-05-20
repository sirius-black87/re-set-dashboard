// Projects hub view + new-project wizard + sidebar switcher.
const { useState: useStateP, useEffect: useEffectP } = React;
const PM = window.RESET_PROJECTS;

// ─────────────── Sidebar Switcher (compact dropdown) ───────────────
function ProjectSwitcher({ goToHub }) {
  const [open, setOpen] = useStateP(false);
  const [list, setList] = useStateP(() => PM.listProjects());
  const activeId = PM.getActiveId();
  const active = list.find(p => p.id === activeId) || list[0];
  const ref = React.useRef(null);

  useEffectP(() => {
    if (!open) return;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  return (
    <div className="proj-switcher" ref={ref}>
      <button className="proj-switcher-btn" onClick={() => setOpen(o => !o)}>
        <span className="proj-dot" style={{background: 'var(--c-' + (active.color || 'sky') + ')'}}/>
        <div className="proj-switcher-text">
          <div className="lbl">פרויקט</div>
          <div className="name">{active.name}</div>
        </div>
        <Icon name={open ? 'chevron-up' : 'chevron-down'} size={13}/>
      </button>
      {open && (
        <div className="proj-switcher-menu">
          {list.map(p => (
            <button
              key={p.id}
              className={'proj-menu-item ' + (p.id === activeId ? 'active' : '')}
              onClick={() => {
                if (p.id !== activeId) PM.switchTo(p.id);
                setOpen(false);
              }}
            >
              <span className="proj-dot" style={{background: 'var(--c-' + (p.color || 'sky') + ')'}}/>
              <span style={{flex:1,minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.name}</span>
              {p.id === activeId && <Icon name="check" size={12}/>}
            </button>
          ))}
          <div className="proj-menu-divider"/>
          <button className="proj-menu-item" onClick={() => { setOpen(false); goToHub(); }}>
            <Icon name="grid" size={13}/>
            <span style={{flex:1}}>כל הפרויקטים</span>
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────── Projects Hub view ───────────────
function ProjectsHub({ onOpen, onClose }) {
  const [list, setList] = useStateP(() => PM.listProjects());
  const [wizard, setWizard] = useStateP(false);
  const activeId = PM.getActiveId();

  const refresh = () => setList(PM.listProjects().slice());

  const onDelete = (p) => {
    if (!confirm('למחוק את הפרויקט "' + p.name + '"? כל המידע יימחק לצמיתות.')) return;
    PM.deleteProject(p.id);
    refresh();
  };
  const onRename = (p) => {
    const n = prompt('שם חדש לפרויקט:', p.name);
    if (n && n.trim()) { PM.renameProject(p.id, n.trim()); refresh(); }
  };

  return (
    <div className="projects-hub">
      <div className="projects-hub-head">
        <div>
          <h1>הפרויקטים שלי</h1>
          <p>{list.length} פרויקטים · בחר/י פרויקט קיים או צור/י חדש</p>
        </div>
        <div style={{display:'flex',gap:8}}>
          {onClose && (
            <button className="btn" onClick={onClose}>
              ← חזרה לפרויקט הפעיל
            </button>
          )}
          <button className="btn primary" onClick={() => setWizard(true)}>
            <Icon name="plus" size={14}/> פרויקט חדש
          </button>
        </div>
      </div>

      <div className="projects-grid">
        {list.map(p => {
          const isActive = p.id === activeId;
          return (
            <div key={p.id} className={'proj-card ' + (isActive ? 'active' : '')}>
              <div className="proj-card-head">
                <span className="proj-dot lg" style={{background:'var(--c-' + (p.color || 'sky') + ')'}}/>
                <h3>{p.name}</h3>
                {isActive && <span className="proj-active-tag">פעיל כעת</span>}
              </div>
              <div className="proj-card-meta">
                <div>נוצר: {new Date(p.createdAt).toLocaleDateString('he-IL', { day:'numeric', month:'short', year:'numeric' })}</div>
                <div>פעם אחרונה: {new Date(p.lastOpened).toLocaleDateString('he-IL', { day:'numeric', month:'short' })}</div>
              </div>
              <div className="proj-card-actions">
                {!isActive && (
                  <button className="btn primary" onClick={() => { PM.switchTo(p.id); }}>
                    פתח/י
                  </button>
                )}
                {isActive && (
                  <button className="btn primary" onClick={onClose}>
                    המשך עבודה
                  </button>
                )}
                <button className="btn" onClick={() => onRename(p)}>שינוי שם</button>
                {!isActive && list.length > 1 && (
                  <button className="btn btn-danger" onClick={() => onDelete(p)}>
                    <Icon name="trash" size={12}/> מחק
                  </button>
                )}
              </div>
            </div>
          );
        })}

        <button className="proj-card proj-add-card" onClick={() => setWizard(true)}>
          <Icon name="plus" size={28}/>
          <div>צור/י פרויקט חדש</div>
          <div className="hint">בחר/י תבנית מוכנה או התחל/י מאפס</div>
        </button>
      </div>

      {wizard && (
        <NewProjectWizard
          onCancel={() => setWizard(false)}
          onCreate={(d) => { PM.createProject(d); }}
        />
      )}
    </div>
  );
}

// ─────────────── New Project Wizard ───────────────
function NewProjectWizard({ onCancel, onCreate }) {
  const [step, setStep] = useStateP(1);
  const [name, setName] = useStateP('');
  const [color, setColor] = useStateP('sky');
  const [tagline, setTagline] = useStateP('');
  const [startDate, setStartDate] = useStateP(() => new Date().toISOString().slice(0,10));
  const [durationWeeks, setDurationWeeks] = useStateP('');
  const [budget, setBudget] = useStateP('');
  const [currency, setCurrency] = useStateP('₪');
  const [tmpl, setTmpl] = useStateP(null);
  const [showFormat, setShowFormat] = useStateP(false);

  // When user picks a template, auto-fill the duration field if empty
  React.useEffect(() => {
    if (tmpl && tmpl.defaultWeeks && !durationWeeks) {
      setDurationWeeks(String(tmpl.defaultWeeks));
    }
  }, [tmpl]);

  const submit = () => {
    if (!name.trim()) { alert('הזן/י שם פרויקט'); return; }
    if (!tmpl) { alert('בחר/י תבנית'); return; }
    onCreate({
      name: name.trim(),
      color,
      tagline: tagline.trim(),
      startDate,
      durationWeeks: Number(durationWeeks) || (tmpl.defaultWeeks || 12),
      budget: Number(budget) || 0,
      currency: currency || '₪',
      template: tmpl,
    });
  };

  return (
    <div className="wizard-overlay" onClick={onCancel}>
      <div className="wizard-card" onClick={(e) => e.stopPropagation()}>
        <div className="wizard-head">
          <div>
            <h2>פרויקט חדש</h2>
            <p>שלב {step} מתוך 2</p>
          </div>
          <button className="wizard-x" onClick={onCancel}><Icon name="x" size={16}/></button>
        </div>

        {step === 1 && (
          <div className="wizard-body">
            <label className="wizard-field">
              <span>שם הפרויקט *</span>
              <input
                autoFocus type="text"
                value={name} onChange={(e) => setName(e.target.value)}
                placeholder="לדוגמה: אתר אינדי, ספר חדש, קמפיין שיווק..."
              />
            </label>
            <label className="wizard-field">
              <span>תיאור קצר</span>
              <input
                type="text"
                value={tagline} onChange={(e) => setTagline(e.target.value)}
                placeholder="מה הפרויקט עושה? למי הוא מיועד?"
              />
            </label>
            <div className="wizard-row">
              <label className="wizard-field" style={{flex:1}}>
                <span>תאריך התחלה</span>
                <input
                  type="date" dir="ltr"
                  value={startDate} onChange={(e) => setStartDate(e.target.value)}
                />
              </label>
              <label className="wizard-field" style={{flex:1}}>
                <span>משך (שבועות)</span>
                <input
                  type="number" min="1" max="104" dir="ltr"
                  value={durationWeeks} onChange={(e) => setDurationWeeks(e.target.value)}
                  placeholder="12"
                />
              </label>
            </div>
            <div className="wizard-row">
              <label className="wizard-field" style={{flex:2}}>
                <span>תקציב כולל (אופציונלי)</span>
                <input
                  type="number" min="0" dir="ltr"
                  value={budget} onChange={(e) => setBudget(e.target.value)}
                  placeholder="0"
                />
              </label>
              <label className="wizard-field" style={{flex:1}}>
                <span>מטבע</span>
                <select
                  value={currency} onChange={(e) => setCurrency(e.target.value)}
                  className="wizard-select"
                >
                  <option value="₪">₪ שקל</option>
                  <option value="$">$ דולר</option>
                  <option value="€">€ יורו</option>
                  <option value="£">£ פאונד</option>
                </select>
              </label>
            </div>
            <label className="wizard-field">
              <span>צבע</span>
              <div className="color-picker" style={{justifyContent:'flex-start'}}>
                {['sky','indigo','violet','amber','rose','emerald','slate'].map(c => (
                  <button key={c} type="button"
                    className={"color-swatch " + (color === c ? 'active' : '')}
                    style={{background: 'var(--c-' + c + ')'}}
                    onClick={() => setColor(c)} title={c}/>
                ))}
              </div>
            </label>
            <div className="wizard-actions">
              <button className="btn" onClick={onCancel}>ביטול</button>
              <button className="btn primary" onClick={() => name.trim() && setStep(2)}>הבא ←</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="wizard-body">
            <div className="wizard-section-title">בחר/י תבנית</div>
            <div className="template-grid">
              {PM.templates.map(t => (
                <button
                  key={t.id}
                  className={'template-card ' + (tmpl && tmpl.id === t.id ? 'selected' : '')}
                  onClick={() => setTmpl(t)}
                >
                  <Icon name={t.icon} size={22}/>
                  <div className="template-name">{t.name}</div>
                  <div className="template-desc">{t.description}</div>
                </button>
              ))}
            </div>

            <button className="wizard-format-toggle" onClick={() => setShowFormat(s => !s)}>
              {showFormat ? '↑ הסתר/י' : '↓ הראה/י'} פורמט הגדרות (שלבים, משימות, מודולים)
            </button>
            {showFormat && <FormatHelp/>}

            <div className="wizard-actions">
              <button className="btn" onClick={() => setStep(1)}>→ חזרה</button>
              <button className="btn primary" onClick={submit} disabled={!tmpl}>
                <Icon name="plus" size={12}/> צור פרויקט
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────── Format Help ───────────────
function FormatHelp() {
  return (
    <div className="format-help">
      <h4>פורמט שלב (Phase)</h4>
      <p>שלב = יחידת זמן בטיימליין שמכילה משימות. כל שלב צריך:</p>
      <ul>
        <li><code>name</code> — שם השלב (לדוגמה: "אפיון מוצר")</li>
        <li><code>color</code> — אחד מ: <code>sky · indigo · violet · amber · rose · emerald · slate</code></li>
        <li><code>startWeek</code> — באיזה שבוע מתחיל (מספר, 1-based)</li>
        <li><code>endWeek</code> — באיזה שבוע מסתיים (כולל)</li>
        <li><code>summary</code> — תיאור קצר (אופציונלי)</li>
        <li><code>tasks</code> — מערך משימות (אופציונלי)</li>
      </ul>

      <h4>פורמט משימה (Task)</h4>
      <ul>
        <li><code>t</code> — שם המשימה</li>
        <li><code>p</code> — תעדוף: <code>must</code> (חובה) או <code>should</code> (חשוב)</li>
        <li><code>d</code> — משך משוער (טקסט חופשי: "3 ימים", "שבוע")</li>
        <li><code>s</code> — סטטוס: <code>todo</code> · <code>progress</code> · <code>done</code></li>
      </ul>

      <h4>פורמט מודול (Module)</h4>
      <ul>
        <li><code>name</code> — שם המודול</li>
        <li><code>icon</code> — אחד מ: <code>users · heart · scale · shield · sparkles · wallet · activity · flag · list · grid</code></li>
        <li><code>color</code> — אותם 7 צבעים כמו בשלב</li>
        <li><code>desc</code> — תיאור</li>
        <li><code>features</code> — מערך תכונות, כל אחת עם <code>name</code> ו-<code>status</code> (<code>todo · spec · progress · done</code>)</li>
      </ul>

      <h4>פורמט סיכון (Risk)</h4>
      <ul>
        <li><code>level</code> — <code>high · med · low</code></li>
        <li><code>title</code>, <code>impact</code>, <code>mitigation</code>, <code>owner</code></li>
      </ul>

      <p className="format-note">
        💡 אחרי שתיצור/י פרויקט מתבנית, את/ה יכול/ה לערוך כל פרט במצב עריכה (כפתור העפרון), או להוסיף/למחוק שלבים, משימות, מודולים וסיכונים ישירות.
      </p>
    </div>
  );
}

window.ProjectSwitcher = ProjectSwitcher;
window.ProjectsHub = ProjectsHub;
