// Re-Set dashboard — main app shell
const { useState, useEffect } = React;
const D3 = window.RESET_DATA;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "light",
  "density": "comfortable",
  "showWeeklyDigest": true
}/*EDITMODE-END*/;

const NAV = [
  { k: 'overview', label: 'סקירה כללית', icon: 'home' },
  { k: 'phases', label: 'שלבים וטיימליין', icon: 'gantt' },
  { k: 'tasks', label: 'משימות', icon: 'list' },
  { k: 'modules', label: 'מודולים', icon: 'grid' },
  { k: 'budget', label: 'תקציב', icon: 'wallet' },
];

const App = () => {
  const [view, setView] = useState('overview');
  const [showProjectsHub, setShowProjectsHub] = useState(false);
  const [tweaks, setTweak] = window.useTweaks(TWEAK_DEFAULTS);
  const [teamOpen, setTeamOpen] = useState(false);
  const [showNewMember, setShowNewMember] = useState(false);
  const store = window.useTaskStore();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', tweaks.theme);
  }, [tweaks.theme]);

  const allTasks = D3.PHASES.flatMap((p) => p.tasks);
  const navCounts = {
    overview: '',
    phases: D3.PHASES.length,
    tasks: allTasks.filter((t) => t.s !== 'done').length,
    modules: D3.MODULES.length,
    budget: '',
  };

  const today = (() => {
    const d = D3.PROJECT.today;
    const date = d instanceof Date ? d : new Date(d);
    return isNaN(date) ? new Date().toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })
      : date.toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' });
  })();

  // Headers computed each render so live edits flow through
  const startDateObj = D3.PROJECT.startDate
    ? (D3.PROJECT.startDate instanceof Date ? D3.PROJECT.startDate : new Date(D3.PROJECT.startDate))
    : new Date();
  const endDateObj = new Date(startDateObj.getTime() + (D3.PROJECT.durationWeeks - 1) * 7 * 24 * 60 * 60 * 1000 + 6 * 24 * 60 * 60 * 1000);
  const fmtRangeShort = (d) => d.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' });
  const dateRangeStr = fmtRangeShort(startDateObj) + ' – ' + fmtRangeShort(endDateObj);

  const HEADERS = {
    overview: { crumb: 'דשבורד', title: 'סקירת מצב הפרויקט', sub: (D3.PROJECT.tagline || '—') + ' · ' + (D3.PROJECT.methodology || ''), subPath: 'project.tagline' },
    phases:   { crumb: 'תכנון', title: 'שלבי הפרויקט', sub: D3.PHASES.length + ' שלבים · ' + D3.PROJECT.durationWeeks + ' שבועות · ' + dateRangeStr },
    tasks:    { crumb: 'ביצוע', title: 'רשימת משימות', sub: 'כל המשימות לפי שלב, תעדוף MoSCoW וסטטוס' },
    modules:  { crumb: 'מוצר', title: 'מודולי המוצר', sub: D3.MODULES.length + ' מודולים' },
    budget:   { crumb: 'פיננסי', title: 'תקציב', sub: window.currencySymbol() + window.fmtNum(D3.BUDGET.total) + ' לאורך ' + D3.PROJECT.durationWeeks + ' שבועות · קצב שריפה ופירוט קטגוריות' },
  };

  const ViewComponent = {
    overview: window.Overview,
    phases: window.Phases,
    tasks: window.Tasks,
    modules: window.Modules,
    budget: window.Budget,
  }[view];

  const h = HEADERS[view];
  const Editable = window.Editable;

  return (
    <div className="app">
      <aside className="sidebar">
        {/* Project switcher at top */}
        <window.ProjectSwitcher goToHub={() => setShowProjectsHub(true)}/>

        <div className="brand">
          <div className="brand-mark">{(D3.PROJECT.name || '?').trim().charAt(0) || 'P'}</div>
          <div className="brand-text">
            <div className="name"><Editable path="project.name" value={D3.PROJECT.name} inputStyle={{width:120,fontSize:'inherit'}}/></div>
            <div className="sub"><Editable path="project.subtitle" value={D3.PROJECT.subtitle || 'תוכנית עבודה'} inputStyle={{width:140}}/></div>
          </div>
          <button
            className={"brand-edit-toggle " + (store.editMode ? 'on' : '')}
            onClick={() => store.toggleEditMode()}
            title={store.editMode ? 'יציאה ממצב עריכה' : 'הפעל מצב עריכה — לחיצה על כל טקסט תאפשר עריכה'}
          >
            <Icon name="pencil" size={14}/>
          </button>
        </div>

        <div className="side-actions">
          <div className="side-week-chip">
            <Icon name="calendar" size={14}/>
            <div>
              <div className="wk">שבוע <Editable path="project.currentWeek" value={D3.PROJECT.currentWeek} numeric inputStyle={{width:42}}/><span>/<Editable path="project.durationWeeks" value={D3.PROJECT.durationWeeks} numeric inputStyle={{width:42}}/></span></div>
              <div className="dt">{today}</div>
            </div>
          </div>
          <button className="btn primary side-btn"><Icon name="sparkles" size={14} /> דו״ח שבועי</button>
          <button className="btn side-btn-ghost" onClick={() => setTweak('theme', tweaks.theme === 'light' ? 'dark' : 'light')}>
            <Icon name={tweaks.theme === 'light' ? 'moon' : 'sun'} size={14} />
            <span>{tweaks.theme === 'light' ? 'מצב כהה' : 'מצב בהיר'}</span>
          </button>
        </div>

        <div className="nav-label nav-label-tight">ניווט</div>
        <nav className="nav-list">
          {NAV.map((n) => (
            <button
              key={n.k}
              className={"nav-item " + (view === n.k ? 'active' : '')}
              onClick={() => setView(n.k)}
            >
              <Icon name={n.icon} size={17} className="icon" />
              <span>{n.label}</span>
              {navCounts[n.k] !== '' && <span className="badge">{navCounts[n.k]}</span>}
            </button>
          ))}
        </nav>

        <div className={"team-section team-section-foot " + (teamOpen ? 'open' : '')}>
          <button className="team-toggle" onClick={() => setTeamOpen(!teamOpen)}>
            <Icon name="users" size={15} />
            <span>צוות</span>
            <span className="team-count">{D3.TEAM.length}</span>
            <Icon name={teamOpen ? 'chevron-up' : 'chevron-down'} size={14} className="team-chev"/>
          </button>
          {teamOpen && (
            <div className="team-body">
              {D3.TEAM.map((m, i) => (
                <div key={i} className="team-row">
                  <div className={"avatar " + (i % 2 === 1 ? 'violet' : '')}>{m.initial}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 500 }}><Editable path={'team.'+i+'.name'} value={m.name} inputStyle={{width:'100%'}}/></div>
                    <div className="role"><Editable path={'team.'+i+'.role'} value={m.role}/> · <Editable path={'team.'+i+'.tasks'} value={m.tasks} numeric inputStyle={{width:40}}/> פעילות</div>
                  </div>
                  <window.DeleteBtn onDelete={() => store.deleteFrom('team', i)}/>
                </div>
              ))}
              {showNewMember ? (
                <NewTeamRow onCancel={() => setShowNewMember(false)} onSave={(d) => { store.addTeamMember(d); setShowNewMember(false); }}/>
              ) : (
                <button className="module-add-feature" style={{marginTop:6}} onClick={() => setShowNewMember(true)}>
                  <Icon name="plus" size={12}/> הוסף חבר/ת צוות
                </button>
              )}
            </div>
          )}
        </div>
      </aside>

      <main className="main">
        <div className="page-head">
          <div className="page-head-brand">
            <div className="brand-mark sm">{(D3.PROJECT.name || '?').trim().charAt(0) || 'P'}</div>
            <div className="page-head-brand-text">
              <div className="ph-name">{D3.PROJECT.name}</div>
              <div className="ph-sub">מערכת לניהול פרויקטים</div>
            </div>
          </div>
          <div className="page-head-divider"></div>
          <div className="page-head-crumb">{h.crumb}</div>
        </div>
        <div className="topbar">
          <div className="topbar-title">
            <h1>{h.title}</h1>
            <p>{view === 'overview'
              ? <span><Editable path="project.tagline" value={D3.PROJECT.tagline} inputStyle={{minWidth:300}}/> · <Editable path="project.methodology" value={D3.PROJECT.methodology}/></span>
              : h.sub}
            </p>
          </div>
        </div>

        {ViewComponent && <ViewComponent goTo={setView} />}
      </main>

      {showProjectsHub && (
        <div className="projects-overlay">
          <window.ProjectsHub onClose={() => setShowProjectsHub(false)}/>
        </div>
      )}

      <DashboardTweaks tweaks={tweaks} setTweak={setTweak} setView={setView} store={store} onProjectsHub={() => setShowProjectsHub(true)}/>
    </div>
  );
};

const NewTeamRow = ({ onCancel, onSave }) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  return (
    <div style={{display:'flex',flexDirection:'column',gap:6,padding:'8px 4px'}}>
      <input autoFocus className="filter-search" placeholder="שם מלא" value={name} onChange={e => setName(e.target.value)}/>
      <input className="filter-search" placeholder="תפקיד" value={role} onChange={e => setRole(e.target.value)}/>
      <div style={{display:'flex',gap:6}}>
        <button className="btn primary" style={{flex:1}} onClick={() => name.trim() && onSave({name: name.trim(), role: role || '—'})}>הוסף</button>
        <button className="btn" onClick={onCancel}>ביטול</button>
      </div>
    </div>
  );
};

const DashboardTweaks = ({ tweaks, setTweak, setView, store, onProjectsHub }) => {
  const { TweaksPanel, TweakSection, TweakRadio, TweakToggle, TweakButton } = window;
  return (
    <TweaksPanel title="Tweaks">
      <TweakSection label="פרויקטים">
        <div style={{fontSize:11,color:'var(--ink-3)',lineHeight:1.5,marginBottom:8}}>
          נהלו מספר פרויקטים — כל פרויקט עם המשימות, המודולים והתקציב שלו.
        </div>
        <TweakButton label="📁 כל הפרויקטים" onClick={onProjectsHub}/>
      </TweakSection>

      <TweakSection label="ערכת נושא">
        <TweakRadio
          label="מצב"
          value={tweaks.theme}
          onChange={(v) => setTweak('theme', v)}
          options={[
            { value: 'light', label: 'בהיר' },
            { value: 'dark', label: 'כהה' },
          ]}
        />
      </TweakSection>

      <TweakSection label="קיצורי ניווט">
        <TweakButton label="סקירה כללית" onClick={() => setView('overview')} />
        <TweakButton label="טיימליין" onClick={() => setView('phases')} />
        <TweakButton label="משימות" onClick={() => setView('tasks')} />
        <TweakButton label="תקציב" onClick={() => setView('budget')} />
      </TweakSection>

      <TweakSection label="תצוגה">
        <TweakToggle
          label="סיכום שבועי"
          value={tweaks.showWeeklyDigest}
          onChange={(v) => setTweak('showWeeklyDigest', v)}
        />
      </TweakSection>

      <TweakSection label="ענן וסנכרון">
        <window.CloudSyncPanel/>
      </TweakSection>

      <TweakSection label="גיבוי ושיתוף">
        <div style={{fontSize:11,color:'var(--ink-3)',lineHeight:1.5,marginBottom:8}}>
          ייצא את כל השינויים שלך לקובץ — אפשר לשתף עם הצוות או להעלות במכשיר אחר.
        </div>
        <TweakButton label="📥 ייצא גיבוי (JSON)" onClick={() => store.exportData()}/>
        <TweakButton label="📤 ייבא קובץ גיבוי" onClick={() => document.getElementById('reset-import-input').click()}/>
        <input
          id="reset-import-input"
          type="file"
          accept=".json,application/json"
          style={{display:'none'}}
          onChange={(e) => {
            const f = e.target.files && e.target.files[0];
            if (!f) return;
            const mode = confirm(
              'איך לייבא?\n\nאישור = החלפה מלאה (מוחק את כל השינויים הקיימים ומחליף בקובץ)\nביטול = מיזוג (מוסיף את התוכן של הקובץ על השינויים הקיימים)'
            ) ? 'replace' : 'merge';
            const reader = new FileReader();
            reader.onload = (ev) => store.importData(ev.target.result, mode);
            reader.readAsText(f);
            e.target.value = '';
          }}
        />
      </TweakSection>

      <TweakSection label="עריכה ושינויים">
        <div style={{fontSize:11,color:'var(--ink-3)',lineHeight:1.5,marginBottom:8}}>
          לחץ על העפרון ליד הלוגו כדי להפעיל מצב עריכה. כל שינוי נשמר אוטומטית בדפדפן.
        </div>
        <TweakButton label="↺ אפס לערכי המקור" onClick={() => store.reset()}/>
      </TweakSection>
    </TweaksPanel>
  );
};

// ─── Root wrapper: shows login gate when Firebase config exists but user not signed in.
// Without config (pure-local mode), shows the dashboard immediately.
const Root = () => {
  const cs = window.__cloudSync;
  const [cfg, setCfg]   = useState(() => cs ? cs.getConfig() : null);
  const [user, setUser] = useState(() => cs ? cs.user : null);

  useEffect(() => {
    const onAuth = (e) => setUser(e.detail || (cs && cs.user) || null);
    window.addEventListener('cloud-auth-changed', onAuth);
    // Polling for config changes (set by CloudSyncPanel)
    const poll = setInterval(() => {
      if (cs) {
        const c = cs.getConfig();
        if (!!c !== !!cfg) setCfg(c);
        setUser(cs.user);
      }
    }, 800);
    return () => { window.removeEventListener('cloud-auth-changed', onAuth); clearInterval(poll); };
  }, [cfg]);

  // Cloud configured but no user signed in → gate the app behind LoginGate
  if (cs && cfg && !user) {
    return <LoginGate/>;
  }

  return <window.TaskStoreProvider><App/></window.TaskStoreProvider>;
};

// Standalone login screen — uses the existing CloudSyncPanel for actual sign-in UX.
const LoginGate = () => {
  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-brand">
          <div className="brand-mark" style={{width:48,height:48,borderRadius:12,fontSize:22}}>R</div>
          <div>
            <div className="login-title">Re-Set · לוח מצב הפרויקט</div>
            <div className="login-sub">התחבר/י כדי לגשת לנתונים שלך</div>
          </div>
        </div>
        <div className="login-cs-wrap">
          <window.CloudSyncPanel/>
        </div>
      </div>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<Root/>);
