// Cloud Sync UI — settings panel that lives inside the Tweaks panel.
// Talks to window.__cloudSync.

const { useState: useStateC, useEffect: useEffectC } = React;

const SETUP_INSTRUCTIONS = (
  <ol className="cs-steps">
    <li>היכנס/י ל-<a href="https://console.firebase.google.com" target="_blank" rel="noopener">Firebase Console</a> וצור/י פרויקט חדש (חינמי).</li>
    <li>בפרויקט החדש: <strong>Build → Authentication</strong>. הפעל ספק <em>Google</em> (או Email/Password).</li>
    <li><strong>Build → Firestore Database</strong> → Create database → Test mode (אפשר בהמשך לעדכן Security Rules).</li>
    <li><strong>Project settings ⚙ → General → Your apps</strong>. הוסף/י Web App, וקבל/י את אובייקט ההגדרות <code>firebaseConfig</code>.</li>
    <li>הדבק/י את <code>firebaseConfig</code> בתיבה למטה, ולחץ/י <strong>חבר/י</strong>.</li>
    <li>לאחר חיבור — לחץ/י על <strong>התחבר/י עם Google</strong>. הנתונים שלך ייסנכרנו אוטומטית בכל מכשיר.</li>
  </ol>
);

function CloudSyncPanel() {
  const [config, setConfig] = useStateC(() => window.__cloudSync.getConfig());
  const [configText, setConfigText] = useStateC('');
  const [user, setUser] = useStateC(window.__cloudSync.user);
  const [syncState, setSyncState] = useStateC('idle');
  const [lastSync, setLastSync] = useStateC(window.__cloudSync.lastSync);
  const [showSetup, setShowSetup] = useStateC(!config);
  const [email, setEmail] = useStateC('');
  const [password, setPassword] = useStateC('');
  const [signInMode, setSignInMode] = useStateC('google'); // 'google' | 'email'
  const [error, setError] = useStateC(null);

  useEffectC(() => {
    const onAuth  = (e) => { setUser(e.detail); setError(null); };
    const onState = (e) => { setSyncState(e.detail); if (e.detail === 'saved' || e.detail === 'loaded') setLastSync(window.__cloudSync.lastSync); };
    const onErr   = (e) => setError(e.detail && e.detail.message ? e.detail.message : String(e.detail));
    window.addEventListener('cloud-auth-changed', onAuth);
    window.addEventListener('cloud-sync-state',   onState);
    window.addEventListener('cloud-sync-error',   onErr);
    return () => {
      window.removeEventListener('cloud-auth-changed', onAuth);
      window.removeEventListener('cloud-sync-state',   onState);
      window.removeEventListener('cloud-sync-error',   onErr);
    };
  }, []);

  // Parse the pasted config — allow either JSON, the `const firebaseConfig = {...}` snippet, or just the object literal
  const parseConfig = (text) => {
    let t = text.trim();
    // strip `const firebaseConfig = ` or `firebase.initializeApp({...})` wrappers
    t = t.replace(/^const\s+firebaseConfig\s*=\s*/i, '');
    t = t.replace(/^firebase\.initializeApp\s*\(/i, '').replace(/\)\s*;?\s*$/, '');
    t = t.replace(/;\s*$/, '');
    // Try as JSON first
    try { return JSON.parse(t); } catch (e) {}
    // Then as JS object literal — wrap in parentheses and eval (only locally, user input)
    try { return Function('"use strict";return (' + t + ');')(); } catch (e) { throw new Error('לא ניתן לפענח את האובייקט. ודא/י שהוא בפורמט JSON או JS object.'); }
  };

  const onConnect = () => {
    setError(null);
    try {
      const cfg = parseConfig(configText);
      if (!cfg || !cfg.apiKey || !cfg.projectId) {
        throw new Error('חסרים שדות חיוניים: apiKey ו-projectId');
      }
      window.__cloudSync.saveConfig(cfg);
      setConfig(cfg);
      window.__cloudSync.initFirebase(cfg);
      setShowSetup(false);
    } catch (e) {
      setError(e.message || String(e));
    }
  };

  const onSignInGoogle = async () => {
    setError(null);
    try { await window.__cloudSync.signInWithGoogle(); }
    catch (e) { setError(e.message || String(e)); }
  };

  const onSignInEmail = async () => {
    setError(null);
    if (!email || !password) { setError('הזן/י מייל וסיסמה'); return; }
    try { await window.__cloudSync.signInWithEmail(email.trim(), password); }
    catch (e) { setError((e.code === 'auth/wrong-password' ? 'סיסמה שגויה. ' : '') + (e.message || String(e))); }
  };

  const onSignOut = async () => {
    if (!confirm('להתנתק? הנתונים יישארו בענן ותוכל/י להתחבר שוב מאוחר יותר.')) return;
    await window.__cloudSync.signOut();
  };

  const onForget = () => {
    if (!confirm('להסיר את הגדרות ה-Firebase מהמכשיר הזה? תצטרך/י להזין אותן שוב.')) return;
    window.__cloudSync.clearConfig();
    setConfig(null);
    setShowSetup(true);
    location.reload();
  };

  // ──────── render ────────
  if (!config) {
    return (
      <div className="cs-panel">
        <div className="cs-status off">
          <Icon name="x" size={12}/> לא מחובר לענן — הנתונים נשמרים רק במכשיר הזה
        </div>
        <button className="cs-toggle" onClick={() => setShowSetup(s => !s)}>
          {showSetup ? '← הסתר/י הוראות הגדרה' : 'איך להגדיר ←'}
        </button>
        {showSetup && SETUP_INSTRUCTIONS}
        <label className="cs-label">הדבק/י כאן את firebaseConfig:</label>
        <textarea
          className="cs-textarea"
          placeholder={'{\n  "apiKey": "...",\n  "authDomain": "...",\n  "projectId": "...",\n  "appId": "..."\n}'}
          value={configText}
          onChange={e => setConfigText(e.target.value)}
          rows={6}
        />
        {error && <div className="cs-error">{error}</div>}
        <button className="btn primary" onClick={onConnect} disabled={!configText.trim()}>חבר/י</button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="cs-panel">
        <div className="cs-status pending">
          <Icon name="activity" size={12}/> Firebase מחובר · התחבר/י כדי לסנכרן
        </div>
        <div className="cs-signin-tabs">
          <button className={"cs-tab " + (signInMode === 'google' ? 'active' : '')} onClick={() => setSignInMode('google')}>Google</button>
          <button className={"cs-tab " + (signInMode === 'email'  ? 'active' : '')} onClick={() => setSignInMode('email')}>Email</button>
        </div>
        {signInMode === 'google' ? (
          <button className="btn primary cs-google-btn" onClick={onSignInGoogle}>
            🔓 התחבר/י עם Google
          </button>
        ) : (
          <React.Fragment>
            <input className="filter-search cs-input" type="email" placeholder="מייל"
              value={email} onChange={e => setEmail(e.target.value)}/>
            <input className="filter-search cs-input" type="password" placeholder="סיסמה (חדשה? תיווצר אוטומטית)"
              value={password} onChange={e => setPassword(e.target.value)}/>
            <button className="btn primary" onClick={onSignInEmail}>התחבר/י / הירשם/י</button>
          </React.Fragment>
        )}
        {error && <div className="cs-error">{error}</div>}
        <button className="cs-link" onClick={onForget}>הסר/י הגדרות Firebase מהמכשיר</button>
      </div>
    );
  }

  // Signed in
  const lastSyncStr = lastSync ? new Date(lastSync).toLocaleString('he-IL', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' }) : '—';
  return (
    <div className="cs-panel">
      <div className="cs-status on">
        <Icon name="check" size={12}/> מסונכרן עם הענן
      </div>
      <div className="cs-user">
        <div className="cs-avatar">{(user.email || '?')[0].toUpperCase()}</div>
        <div className="cs-user-info">
          <div className="cs-email">{user.email || 'משתמש'}</div>
          <div className="cs-last">סנכרון אחרון: {lastSyncStr}{syncState === 'saving' ? ' · שומר…' : syncState === 'loading' ? ' · טוען…' : ''}</div>
        </div>
      </div>
      {error && <div className="cs-error">{error}</div>}
      <div className="cs-actions">
        <button className="btn" onClick={() => window.__cloudSync.saveToCloud()}>סנכרן עכשיו</button>
        <button className="btn" onClick={() => window.__cloudSync.loadFromCloud()}>טען מהענן</button>
        <button className="btn" onClick={onSignOut}>התנתק/י</button>
      </div>
    </div>
  );
}

window.CloudSyncPanel = CloudSyncPanel;
