// Cloud sync for the Re-Set dashboard via Firebase Auth + Firestore.
// Exposes window.__cloudSync.
//
// User flow:
//   1. User pastes their Firebase project config (apiKey/projectId/...) into the Tweaks panel.
//   2. cloudSync.initFirebase(config) → wires up Auth + Firestore.
//   3. User signs in (Google or Email/Password).
//   4. After sign-in, the cloud doc is fetched and merged with local; future changes are
//      debounced and pushed back to Firestore.

(function () {
  // ---- Snapshot helpers: capture/restore ALL project-related localStorage keys ----
  const SYNC_KEY_PREFIX = 'reset-';
  // These keys are LOCAL ONLY — never sync them to cloud
  const NEVER_SYNC = new Set([
    'reset-firebase-config',
  ]);

  function captureAllLocal() {
    const out = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || !k.startsWith(SYNC_KEY_PREFIX)) continue;
      if (NEVER_SYNC.has(k)) continue;
      out[k] = localStorage.getItem(k);
    }
    return out;
  }

  function restoreAllLocal(blob) {
    if (!blob || typeof blob !== 'object') return false;
    // Remove existing reset-* keys (except never-sync)
    const toRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(SYNC_KEY_PREFIX) && !NEVER_SYNC.has(k)) toRemove.push(k);
    }
    toRemove.forEach(k => localStorage.removeItem(k));
    Object.keys(blob).forEach(k => {
      if (!NEVER_SYNC.has(k)) {
        const v = blob[k];
        localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
      }
    });
    return true;
  }

  // Legacy individual keys (older saves used these as top-level fields)
  const LEGACY_KEYS = [
    'reset-task-status', 'reset-additions', 'reset-task-notes',
    'reset-edits', 'reset-deletes', 'reset-task-layout', 'reset-widgets',
  ];

  const CFG_KEY = 'reset-firebase-config';
  const LAST_SYNC_KEY = 'reset-last-cloud-sync';

  let app = null;
  let auth = null;
  let db = null;
  let user = null;
  let initialized = false;
  let saveTimer = null;
  let lastSync = null;
  let listenersRegistered = false;

  function getConfig() {
    try { return JSON.parse(localStorage.getItem(CFG_KEY) || 'null'); } catch (e) { return null; }
  }
  function saveConfig(c) {
    localStorage.setItem(CFG_KEY, JSON.stringify(c));
  }
  function clearConfig() {
    localStorage.removeItem(CFG_KEY);
  }

  function emit(type, detail) {
    try { window.dispatchEvent(new CustomEvent('cloud-' + type, { detail })); } catch (e) {}
  }

  function initFirebase(config) {
    if (initialized) return;
    if (typeof firebase === 'undefined') {
      console.warn('Firebase SDK not loaded');
      return;
    }
    try {
      app  = firebase.initializeApp(config);
      auth = firebase.auth();
      db   = firebase.firestore();
      initialized = true;

      auth.onAuthStateChanged(u => {
        user = u;
        emit('auth-changed', u);
        if (u && !listenersRegistered) {
          // After sign-in: bootstrap from cloud
          loadFromCloud();
          // Listen for local data changes → debounced cloud save
          window.addEventListener('reset-data-changed', () => scheduleSave());
          listenersRegistered = true;
        }
      });
    } catch (e) {
      console.error('Firebase init failed', e);
      emit('init-error', e);
    }
  }

  async function signInWithGoogle() {
    if (!auth) throw new Error('Firebase not initialized');
    const provider = new firebase.auth.GoogleAuthProvider();
    return auth.signInWithPopup(provider);
  }

  async function signInWithEmail(email, password) {
    if (!auth) throw new Error('Firebase not initialized');
    try {
      return await auth.signInWithEmailAndPassword(email, password);
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        return auth.createUserWithEmailAndPassword(email, password);
      }
      throw err;
    }
  }

  async function signOutUser() {
    if (!auth) return;
    await auth.signOut();
  }

  function userDocRef() {
    if (!user) return null;
    return db.collection('users').doc(user.uid).collection('dashboard').doc('state');
  }

  async function loadFromCloud() {
    if (!user) return;
    try {
      emit('sync-state', 'loading');
      const ref = userDocRef();
      const snap = await ref.get();
      if (!snap.exists) {
        await saveToCloud();
        return;
      }
      const data = snap.data();
      let changed = false;
      // NEW format: all data lives under `all_data`
      if (data.all_data && typeof data.all_data === 'object') {
        const localBlob = captureAllLocal();
        // Detect actual changes (any key differs)
        const remoteKeys = Object.keys(data.all_data);
        const localKeys  = Object.keys(localBlob);
        if (remoteKeys.length !== localKeys.length ||
            remoteKeys.some(k => data.all_data[k] !== localBlob[k])) {
          changed = true;
        }
        if (changed) restoreAllLocal(data.all_data);
      } else {
        // LEGACY format: top-level keys
        LEGACY_KEYS.forEach(k => {
          if (data[k] !== undefined && data[k] !== null) {
            const next = JSON.stringify(data[k]);
            const cur  = localStorage.getItem(k);
            if (next !== cur) {
              localStorage.setItem(k, next);
              changed = true;
            }
          }
        });
      }
      lastSync = data._updatedAt || new Date().toISOString();
      try { localStorage.setItem(LAST_SYNC_KEY, lastSync); } catch (e) {}
      emit('sync-state', 'loaded');
      if (changed) {
        if (confirm('נטענו נתוני ענן עדכניים (כולל כל הפרויקטים שלך). רענן את הדף כדי להציג?')) location.reload();
      }
    } catch (e) {
      console.error('loadFromCloud', e);
      emit('sync-error', e);
    }
  }

  async function saveToCloud() {
    if (!user) return;
    try {
      emit('sync-state', 'saving');
      const payload = {
        all_data: captureAllLocal(),
        _updatedAt: new Date().toISOString(),
        _userEmail: user.email || null,
        _schemaVersion: 2,
      };
      await userDocRef().set(payload);
      lastSync = payload._updatedAt;
      try { localStorage.setItem(LAST_SYNC_KEY, lastSync); } catch (e) {}
      emit('sync-state', 'saved');
    } catch (e) {
      console.error('saveToCloud', e);
      emit('sync-error', e);
    }
  }

  function scheduleSave() {
    if (!user) return;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveToCloud, 1500);
  }

  // Public API
  window.__cloudSync = {
    initFirebase,
    signInWithGoogle,
    signInWithEmail,
    signOut: signOutUser,
    getConfig, saveConfig, clearConfig,
    saveToCloud, loadFromCloud, scheduleSave,
    get user()  { return user; },
    get ready() { return initialized; },
    get lastSync() { return lastSync || localStorage.getItem(LAST_SYNC_KEY); },
  };

  // Auto-init if config saved
  const cfg = getConfig();
  if (cfg) {
    // Wait one tick — Firebase compat SDK initialises on next tick after the script tag.
    setTimeout(() => initFirebase(cfg), 0);
  }
})();
