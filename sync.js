/**
 * SyncEngine v3: Universal Multi-Device Synchronization & Goal Persistence
 * - Day 1 Official Sits Preserved (Soham: 15m, Zabir: 11m 8s)
 * - Auto-fetch from data/sits.json
 * - One-Click Share Link (?importSit=...) for instant WhatsApp/phone sync
 * - Direct GitHub API Committer (optional token in settings)
 * - Goal Settings (Daily Minutes, Weekly Target, 60m SDS Goal)
 */

class SyncManager {
  constructor() {
    this.storageKey = 'adhitthana_sits_v3';
    this.goalsKey = 'adhitthana_user_goals_v1';
    this.roomKey = 'adhitthana_room_code';
    this.githubTokenKey = 'adhitthana_gh_pat';
    
    this.activeRoom = localStorage.getItem(this.roomKey) || 'zabir-soham';
    this.githubToken = localStorage.getItem(this.githubTokenKey) || '';
    this.repo = 'zbirali52-art/sds';

    this.syncStatus = 'local';
    this.subscribers = [];
    this.isSyncing = false;

    // Boot sync: check URL params for shared sit & pull latest
    this.initBootSync();
  }

  onUpdate(callback) {
    this.subscribers.push(callback);
  }

  notify(data) {
    this.subscribers.forEach(cb => {
      try { cb(data); } catch (e) { console.error('Sync subscriber error:', e); }
    });
  }

  getDefaultData() {
    return [
      {
        id: 'sit_soham_20261015',
        user: 'Soham',
        displayName: 'Soham Sadhu',
        date: '2026-10-15',
        durationMinutes: 15,
        displayDuration: '15 mins',
        targetMinutes: 15,
        status: 'completed',
        movedAtMinutes: null,
        movementReason: null,
        reflection: '15-minute Strong Determination Sit completed. Maintained unbroken stillness on the path to enlightenment.',
        timestamp: 1792072000000
      },
      {
        id: 'sit_zabir_20261015',
        user: 'Zabir',
        displayName: 'Zabir',
        date: '2026-10-15',
        durationMinutes: 11.13,
        displayDuration: '11m 8s',
        targetMinutes: 15,
        status: 'timeout',
        movedAtMinutes: 11.13,
        movementReason: 'Physical burn & urge to move',
        reflection: 'Called Time Out after 11m 8s of unbroken stillness. Honoring the rule of absolute honesty.',
        timestamp: 1792072100000
      }
    ];
  }

  getDefaultGoals() {
    return {
      Zabir: { dailyMinutes: 15, weeklyTarget: 7, sdsGoalMinutes: 60, currentStreak: 1 },
      Soham: { dailyMinutes: 15, weeklyTarget: 7, sdsGoalMinutes: 60, currentStreak: 1 }
    };
  }

  getGoals() {
    try {
      const raw = localStorage.getItem(this.goalsKey);
      if (raw) return { ...this.getDefaultGoals(), ...JSON.parse(raw) };
    } catch (e) {}
    return this.getDefaultGoals();
  }

  saveGoals(goals) {
    try {
      localStorage.setItem(this.goalsKey, JSON.stringify(goals));
      this.notify(this.loadLocal());
    } catch (e) {
      console.error('Error saving goals:', e);
    }
  }

  loadLocal() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) {
        const defaults = this.getDefaultData();
        this.saveLocal(defaults);
        return defaults;
      }
      let parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure Day 1 sits exist
        const hasSoham = parsed.some(s => s.user === 'Soham' || (s.displayName && s.displayName.includes('Soham')));
        const hasZabir = parsed.some(s => s.user === 'Zabir');
        if (!hasSoham || !hasZabir) {
          this.mergeAndSave(this.getDefaultData());
          return this.loadLocal();
        }
        return parsed;
      }
      return this.getDefaultData();
    } catch (e) {
      console.error('Error reading localStorage:', e);
      return this.getDefaultData();
    }
  }

  saveLocal(data) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
      this.notify(data);
    } catch (e) {
      console.error('Error writing to localStorage:', e);
    }
  }

  async addSit(sit) {
    const data = this.loadLocal();
    if (!sit.id) sit.id = 'sit_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    if (!sit.timestamp) sit.timestamp = Date.now();
    data.unshift(sit);
    this.saveLocal(data);

    // Auto push sync
    this.pushSync(data);
    return sit;
  }

  async deleteSit(id) {
    let data = this.loadLocal();
    data = data.filter(s => s.id !== id);
    this.saveLocal(data);
    this.pushSync(data);
  }

  mergeAndSave(incoming) {
    if (!Array.isArray(incoming) || incoming.length === 0) return false;
    const current = this.loadLocal();
    const map = new Map();
    // Index existing
    current.forEach(s => map.set(s.id, s));
    // Merge incoming
    let hasNew = false;
    incoming.forEach(s => {
      if (!s.id) s.id = 'sit_' + (s.timestamp || Date.now()) + '_' + Math.random().toString(36).substr(2, 4);
      if (!map.has(s.id)) {
        map.set(s.id, s);
        hasNew = true;
      } else if (s.timestamp && map.get(s.id).timestamp < s.timestamp) {
        map.set(s.id, s);
        hasNew = true;
      }
    });

    const merged = Array.from(map.values()).sort((a, b) => b.timestamp - a.timestamp);
    this.saveLocal(merged);
    return hasNew;
  }

  /**
   * Boot synchronization:
   * 1. Inspect URL for ?importSit=... (from friend link)
   * 2. Auto-pull data/sits.json from live repository
   */
  async initBootSync() {
    // 1. Check for shared sit in URL parameter
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const sharedBase64 = urlParams.get('importSit');
      if (sharedBase64) {
        const decoded = decodeURIComponent(escape(atob(sharedBase64)));
        const sitObj = JSON.parse(decoded);
        if (sitObj && (sitObj.user || sitObj.durationMinutes)) {
          this.mergeAndSave([sitObj]);
          // Clean URL without page reload
          window.history.replaceState({}, document.title, window.location.pathname);
          const author = sitObj.displayName || sitObj.user;
          const dur = sitObj.displayDuration || (sitObj.durationMinutes + 'm');
          this.showSyncToast('✨ Synced new sit from ' + author + ' (' + dur + ')!');
        }
      }
    } catch (e) {
      console.warn('URL sit import notice:', e);
    }

    // 2. Fetch repo seed data/sits.json
    try {
      const resp = await fetch('data/sits.json?cacheBust=' + Date.now());
      if (resp.ok) {
        const repoSits = await resp.json();
        if (Array.isArray(repoSits)) {
          this.mergeAndSave(repoSits);
        }
      }
    } catch (e) {
      // Local or offline
    }

    this.pullSync();
  }

  showSyncToast(msg) {
    const toast = document.createElement('div');
    toast.className = 'sync-toast';
    toast.innerHTML = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('visible'), 50);
    setTimeout(() => {
      toast.classList.remove('visible');
      setTimeout(() => toast.remove(), 400);
    }, 4500);
  }

  /**
   * Create an instant shareable link for a sit that can be opened on Soham or Zabir's phone
   */
  createShareLink(sit) {
    const jsonStr = JSON.stringify(sit);
    const b64 = btoa(unescape(encodeURIComponent(jsonStr)));
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}?importSit=${b64}`;
  }

  /**
   * Sync to GitHub directly if PAT is provided
   */
  async syncToGitHub() {
    const token = this.githubToken || localStorage.getItem(this.githubTokenKey);
    if (!token) return { success: false, error: 'No GitHub Token provided. Set it in Sync Settings.' };

    try {
      this.isSyncing = true;
      this.updateSyncUI();
      const currentData = this.loadLocal();
      const url = `https://api.github.com/repos/${this.repo}/contents/data/sits.json`;

      // 1. Get current file sha
      let sha = null;
      try {
        const getRes = await fetch(url, {
          headers: { 'Authorization': `token ${token}` }
        });
        if (getRes.ok) {
          const fileInfo = await getRes.json();
          sha = fileInfo.sha;
        }
      } catch (e) {}

      // 2. Push updated sits
      const contentBase64 = btoa(unescape(encodeURIComponent(JSON.stringify(currentData, null, 2))));
      const body = {
        message: `Sync meditation sits [${new Date().toISOString()}]`,
        content: contentBase64,
        branch: 'main'
      };
      if (sha) body.sha = sha;

      const putRes = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      this.isSyncing = false;
      if (putRes.ok) {
        this.syncStatus = 'cloud-synced';
        this.updateSyncUI();
        return { success: true };
      } else {
        const err = await putRes.json();
        return { success: false, error: err.message || 'GitHub update failed' };
      }
    } catch (e) {
      this.isSyncing = false;
      this.updateSyncUI();
      return { success: false, error: e.message };
    }
  }

  async pushSync(data) {
    if (this.githubToken) {
      this.syncToGitHub();
    }
    this.updateSyncUI();
  }

  async pullSync() {
    this.updateSyncUI();
  }

  updateSyncUI() {
    const el = document.getElementById('sync-indicator');
    if (!el) return;
    if (this.isSyncing) {
      el.innerHTML = '<span class="dot amber"></span> Syncing...';
      el.className = 'sync-pill syncing';
    } else if (this.githubToken) {
      el.innerHTML = '<span class="dot green"></span> GitHub Synced';
      el.className = 'sync-pill synced';
    } else {
      el.innerHTML = '<span class="dot green"></span> Data Saved';
      el.className = 'sync-pill synced';
    }
  }

  exportJSON() {
    const data = this.loadLocal();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `adhitthana_sits_zabir_soham_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  importJSON(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (Array.isArray(parsed)) {
        this.mergeAndSave(parsed);
        return { success: true, count: parsed.length };
      }
      return { success: false, error: 'JSON is not an array of meditation sits' };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
}

window.syncManager = new SyncManager();
