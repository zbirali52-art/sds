/**
 * Adhitthana App: Main Controller
 * Coordinates Zabir & Soham profiles, timer state, time-out protocol,
 * manual entry, guidance modal, and synchronization.
 */

class AdhitthanaApp {
  constructor() {
    this.currentUser = localStorage.getItem('adhitthana_user') || 'Zabir';
    this.viewMode = 'both'; // 'both' | 'Zabir' | 'Soham'
    this.allSits = [];

    // Timer State
    this.timerInterval = null;
    this.timerSecondsElapsed = 0;
    this.timerTargetSeconds = 60 * 60; // 60 minutes default
    this.timerIsRunning = false;
    this.timerIsPaused = false;
    this.timerStartTime = null;

    // Breath Pacer
    this.breathInterval = null;
    this.breathState = 'Inhale'; // 'Inhale' | 'Hold' | 'Exhale'
  }

  init() {
    this.allSits = window.syncManager.loadLocal();

    this.bindEvents();
    this.updateUserUI();
    this.renderMetrics();
    this.renderFeed();
    this.initTimerUI();
    this.initBreathingPacer();

    // Chart init after DOM is ready
    setTimeout(() => {
      window.zenCharts.init(this.allSits);
    }, 100);

    // Subscribe to sync updates
    window.syncManager.onUpdate((sits) => {
      this.allSits = sits;
      this.renderMetrics();
      this.renderFeed();
      window.zenCharts.renderAll(this.allSits);
    });

    // Try background cloud/server pull
    window.syncManager.pullSync();
  }

  bindEvents() {
    // User Switcher buttons
    document.querySelectorAll('[data-set-user]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const user = e.currentTarget.getAttribute('data-set-user');
        this.setUser(user);
      });
    });

    // View Filter buttons (Both / Zabir / Soham)
    document.querySelectorAll('[data-view-filter]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('[data-view-filter]').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.viewMode = e.currentTarget.getAttribute('data-view-filter');
        this.renderMetrics();
        this.renderFeed();
      });
    });

    // Tab Navigation
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const target = e.currentTarget.getAttribute('data-target');
        this.switchTab(target);
      });
    });

    // Timer controls
    document.getElementById('btn-timer-start')?.addEventListener('click', () => this.startTimer());
    document.getElementById('btn-timer-pause')?.addEventListener('click', () => this.pauseTimer());
    document.getElementById('btn-timer-reset')?.addEventListener('click', () => this.resetTimer());
    
    // THE CORE STRONG DETERMINATION MOVEMENT BUTTON
    document.getElementById('btn-timer-timeout')?.addEventListener('click', () => this.triggerTimeOut());

    // Target duration buttons
    document.querySelectorAll('[data-target-duration]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        if (this.timerIsRunning) return;
        document.querySelectorAll('[data-target-duration]').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        const mins = Number(e.currentTarget.getAttribute('data-target-duration'));
        this.timerTargetSeconds = mins * 60;
        this.updateTimerDisplay();
      });
    });

    // Audio Toggles
    document.getElementById('btn-toggle-sound')?.addEventListener('click', (e) => {
      const isMuted = window.zenAudio.toggleMute();
      e.currentTarget.classList.toggle('muted', isMuted);
      e.currentTarget.innerHTML = isMuted 
        ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg> Unmute`
        : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg> Audio On`;
    });

    document.getElementById('btn-toggle-drone')?.addEventListener('click', (e) => {
      const playing = window.zenAudio.toggleAmbient('drone');
      e.currentTarget.classList.toggle('active', playing);
      e.currentTarget.innerHTML = playing ? `✨ 432Hz Om Drone Active` : `🎵 Play 432Hz Drone`;
    });

    // Test Bell button
    document.getElementById('btn-test-bell')?.addEventListener('click', async () => {
      await window.zenAudio.playBowl(216, 7);
      this.showToast('🔔 Singing bowl chime sounded');
    });

    // Manual Sit Entry Modal
    document.getElementById('btn-open-manual-log')?.addEventListener('click', () => {
      this.openModal('modal-manual-log');
    });

    document.getElementById('form-manual-log')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleManualLogSubmit(e);
    });

    // Time Out Form Submit
    document.getElementById('form-timeout-log')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleTimeOutSubmit(e);
    });

    // Sync & Backup Modal
    document.getElementById('btn-open-sync')?.addEventListener('click', () => {
      this.openModal('modal-sync');
      document.getElementById('input-room-code').value = window.syncManager.activeRoom;
    });

    document.getElementById('btn-save-room')?.addEventListener('click', () => {
      const code = document.getElementById('input-room-code').value.trim();
      if (code) {
        window.syncManager.setRoomCode(code);
        this.closeModals();
        this.showToast(`Sync Room set to "${code}"! Connecting...`);
      }
    });

    document.getElementById('btn-export-json')?.addEventListener('click', () => {
      window.syncManager.exportJSON();
    });

    document.getElementById('input-import-json')?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        const res = window.syncManager.importJSON(event.target.result);
        if (res.success) {
          this.closeModals();
          this.showToast(`Successfully imported ${res.count} meditation sits!`);
        } else {
          alert('Import failed: ' + res.error);
        }
      };
      reader.readAsText(file);
    });

    // Modal Close buttons
    document.querySelectorAll('.modal-close, .modal-backdrop').forEach(el => {
      el.addEventListener('click', () => this.closeModals());
    });
  }

  setUser(user) {
    this.currentUser = user;
    localStorage.setItem('adhitthana_user', user);
    this.updateUserUI();
    this.showToast(`Switched active meditator to ${user}`);
  }

  updateUserUI() {
    document.querySelectorAll('[data-set-user]').forEach(btn => {
      const u = btn.getAttribute('data-set-user');
      btn.classList.toggle('active-user', u === this.currentUser);
    });

    const activeBadge = document.getElementById('current-user-badge');
    if (activeBadge) {
      activeBadge.textContent = this.currentUser;
      activeBadge.className = `user-badge ${this.currentUser.toLowerCase()}`;
    }

    const timerUser = document.getElementById('timer-current-user');
    if (timerUser) {
      timerUser.textContent = this.currentUser;
      timerUser.className = `timer-user-tag ${this.currentUser.toLowerCase()}`;
    }

    const manualUser = document.getElementById('manual-user-select');
    if (manualUser) {
      manualUser.value = this.currentUser;
    }
  }

  switchTab(targetId) {
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.view-panel').forEach(p => p.classList.remove('active'));

    const tab = document.querySelector(`.nav-tab[data-target="${targetId}"]`);
    const panel = document.getElementById(targetId);

    if (tab) tab.classList.add('active');
    if (panel) panel.classList.add('active');

    // Re-render charts if switching to dashboard
    if (targetId === 'tab-dashboard') {
      setTimeout(() => window.zenCharts.renderAll(this.allSits), 50);
    }
  }

  /* ---------------- TIMER ENGINE & TIME OUT PROTOCOL ---------------- */

  initTimerUI() {
    this.updateTimerDisplay();
  }

  async startTimer() {
    if (this.timerIsRunning && !this.timerIsPaused) return;

    await window.zenAudio.ensureContext();
    if (!this.timerIsPaused) {
      // Starting new session
      this.timerSecondsElapsed = 0;
      await window.zenAudio.playBowl(216, 7); // Start gong
      this.showToast(`Strong Determination Sit started for ${this.currentUser}! Do not move.`);
    }

    this.timerIsRunning = true;
    this.timerIsPaused = false;
    document.getElementById('timer-container')?.classList.add('timer-active');
    document.getElementById('btn-timer-start').style.display = 'none';
    document.getElementById('btn-timer-pause').style.display = 'inline-flex';
    document.getElementById('btn-timer-timeout').style.display = 'inline-flex';

    this.timerInterval = setInterval(() => {
      this.timerSecondsElapsed++;
      this.updateTimerDisplay();

      // Check if goal reached!
      if (this.timerSecondsElapsed >= this.timerTargetSeconds) {
        this.completeCleanSit();
      }
    }, 1000);
  }

  pauseTimer() {
    if (!this.timerIsRunning) return;
    clearInterval(this.timerInterval);
    this.timerIsPaused = true;
    document.getElementById('btn-timer-start').style.display = 'inline-flex';
    document.getElementById('btn-timer-start').textContent = 'Resume Sit';
    document.getElementById('btn-timer-pause').style.display = 'none';
  }

  resetTimer() {
    if (this.timerIsRunning) {
      if (!confirm('Are you sure you want to cancel this sit without logging? (To record your time before moving, press "I Moved / Call Time Out" instead!)')) {
        return;
      }
    }
    clearInterval(this.timerInterval);
    this.timerIsRunning = false;
    this.timerIsPaused = false;
    this.timerSecondsElapsed = 0;
    document.getElementById('timer-container')?.classList.remove('timer-active');
    document.getElementById('btn-timer-start').style.display = 'inline-flex';
    document.getElementById('btn-timer-start').textContent = 'Enter Stillness (Start)';
    document.getElementById('btn-timer-pause').style.display = 'none';
    document.getElementById('btn-timer-timeout').style.display = 'none';
    this.updateTimerDisplay();
  }

  updateTimerDisplay() {
    const elapsed = this.timerSecondsElapsed;
    const target = this.timerTargetSeconds;
    const remaining = Math.max(0, target - elapsed);

    const m = Math.floor(remaining / 60);
    const s = remaining % 60;
    const timeStr = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

    const displayEl = document.getElementById('timer-time');
    if (displayEl) displayEl.textContent = timeStr;

    const elapsedEl = document.getElementById('timer-elapsed-sub');
    if (elapsedEl) {
      const elM = Math.floor(elapsed / 60);
      const elS = elapsed % 60;
      elapsedEl.textContent = `Stillness Survived: ${elM}m ${elS}s / Goal: ${Math.round(target / 60)}m`;
    }

    // Circular progress ring
    const ring = document.getElementById('timer-ring-progress');
    if (ring) {
      const circumference = 2 * Math.PI * 135; // r=135
      const pct = Math.min(1, elapsed / target);
      ring.style.strokeDasharray = `${circumference}`;
      ring.style.strokeDashoffset = `${circumference * (1 - pct)}`;
    }
  }

  /**
   * The Crucial Strong Determination Sitting "Time Out" Rule:
   * Called when the meditator moves, scratches, or shifts posture before target is reached.
   */
  async triggerTimeOut() {
    clearInterval(this.timerInterval);
    this.timerIsRunning = false;
    this.timerIsPaused = false;

    await window.zenAudio.playTimeOutChime();

    const elapsedMins = +(this.timerSecondsElapsed / 60).toFixed(1);
    const targetMins = Math.round(this.timerTargetSeconds / 60);

    // Populate Time Out modal
    document.getElementById('timeout-user-display').textContent = this.currentUser;
    document.getElementById('timeout-survived-display').textContent = `${Math.floor(this.timerSecondsElapsed / 60)}m ${this.timerSecondsElapsed % 60}s`;
    document.getElementById('timeout-target-display').textContent = `${targetMins} minutes`;
    document.getElementById('timeout-user-input').value = this.currentUser;
    document.getElementById('timeout-minutes-input').value = elapsedMins;
    document.getElementById('timeout-target-input').value = targetMins;

    this.openModal('modal-timeout');
    this.resetTimerUIState();
  }

  resetTimerUIState() {
    document.getElementById('timer-container')?.classList.remove('timer-active');
    document.getElementById('btn-timer-start').style.display = 'inline-flex';
    document.getElementById('btn-timer-start').textContent = 'Enter Stillness (Start)';
    document.getElementById('btn-timer-pause').style.display = 'none';
    document.getElementById('btn-timer-timeout').style.display = 'none';
  }

  async handleTimeOutSubmit(e) {
    const user = document.getElementById('timeout-user-input').value;
    const durationMinutes = Number(document.getElementById('timeout-minutes-input').value);
    const targetMinutes = Number(document.getElementById('timeout-target-input').value);
    const movementReason = document.getElementById('timeout-reason-select').value;
    const reflection = document.getElementById('timeout-notes').value.trim();

    const sit = {
      id: 'sit_' + Date.now(),
      user: user,
      date: new Date().toISOString().split('T')[0],
      durationMinutes: durationMinutes,
      targetMinutes: targetMinutes,
      status: 'timeout',
      movedAtMinutes: durationMinutes,
      movementReason: movementReason,
      reflection: reflection || `Called time out after ${durationMinutes} minutes due to ${movementReason.toLowerCase()}.`,
      timestamp: Date.now()
    };

    await window.syncManager.addSit(sit);
    this.closeModals();
    this.showToast(`Time Out recorded for ${user} (${durationMinutes}m survived). Honesty is strength.`);
    this.switchTab('tab-dashboard');
  }

  /**
   * Called when the meditator completes the full sit without a single movement!
   */
  async completeCleanSit() {
    clearInterval(this.timerInterval);
    this.timerIsRunning = false;
    this.timerIsPaused = false;

    await window.zenAudio.playSuccessFanfare();

    const targetMins = Math.round(this.timerTargetSeconds / 60);

    const sit = {
      id: 'sit_' + Date.now(),
      user: this.currentUser,
      date: new Date().toISOString().split('T')[0],
      durationMinutes: targetMins,
      targetMinutes: targetMins,
      status: 'completed',
      movedAtMinutes: null,
      movementReason: null,
      reflection: `Unbroken Adhiṭṭhāna! Completed full ${targetMins} minutes of absolute stillness.`,
      timestamp: Date.now()
    };

    await window.syncManager.addSit(sit);
    this.resetTimerUIState();

    // Show celebratory modal
    document.getElementById('victory-user').textContent = this.currentUser;
    document.getElementById('victory-time').textContent = `${targetMins} Minutes`;
    this.openModal('modal-victory');
  }

  /* ---------------- MANUAL SIT ENTRY ---------------- */

  async handleManualLogSubmit(e) {
    const user = document.getElementById('manual-user-select').value;
    const date = document.getElementById('manual-date').value || new Date().toISOString().split('T')[0];
    const duration = Number(document.getElementById('manual-duration').value);
    const target = Number(document.getElementById('manual-target').value) || duration;
    const status = document.getElementById('manual-status-select').value; // 'completed' | 'timeout'
    const reason = document.getElementById('manual-reason').value;
    const reflection = document.getElementById('manual-reflection').value.trim();

    if (!duration || duration <= 0) {
      alert('Please enter a valid meditation duration in minutes.');
      return;
    }

    const sit = {
      id: 'sit_' + Date.now(),
      user: user,
      date: date,
      durationMinutes: duration,
      targetMinutes: target,
      status: status,
      movedAtMinutes: status === 'timeout' ? duration : null,
      movementReason: status === 'timeout' ? reason : null,
      reflection: reflection || (status === 'completed' ? `Completed ${duration}m unbroken sit.` : `Called time out at ${duration}m.`),
      timestamp: new Date(date).getTime() + 43200000 // midday
    };

    await window.syncManager.addSit(sit);
    this.closeModals();
    e.target.reset();
    this.showToast(`Meditation sit logged for ${user}!`);
    this.switchTab('tab-dashboard');
  }

  /* ---------------- METRICS & STATS ---------------- */

  renderMetrics() {
    const sits = this.allSits;

    const zabirSits = sits.filter(s => s.user === 'Zabir');
    const sohamSits = sits.filter(s => s.user === 'Soham');

    const zabirMins = zabirSits.reduce((acc, s) => acc + (Number(s.durationMinutes) || 0), 0);
    const sohamMins = sohamSits.reduce((acc, s) => acc + (Number(s.durationMinutes) || 0), 0);

    const zabirClean = zabirSits.filter(s => s.status === 'completed').length;
    const sohamClean = sohamSits.filter(s => s.status === 'completed').length;

    const zabirTimeouts = zabirSits.filter(s => s.status === 'timeout').length;
    const sohamTimeouts = sohamSits.filter(s => s.status === 'timeout').length;

    const zabirMax = zabirSits.length ? Math.max(...zabirSits.map(s => Number(s.durationMinutes) || 0)) : 0;
    const sohamMax = sohamSits.length ? Math.max(...sohamSits.map(s => Number(s.durationMinutes) || 0)) : 0;

    // Brotherhood Combined
    const totalMins = zabirMins + sohamMins;
    const totalHours = (totalMins / 60).toFixed(1);

    document.getElementById('metric-total-hours').textContent = `${totalHours} hrs`;
    document.getElementById('metric-total-sits').textContent = `${sits.length} sits`;

    // Zabir card
    document.getElementById('z-total-mins').textContent = `${(zabirMins / 60).toFixed(1)}h (${zabirMins}m)`;
    document.getElementById('z-clean-sits').textContent = `${zabirClean} clean / ${zabirTimeouts} timeout`;
    document.getElementById('z-longest-sit').textContent = `${zabirMax}m`;
    const zRate = zabirSits.length ? Math.round((zabirClean / zabirSits.length) * 100) : 0;
    document.getElementById('z-completion-rate').textContent = `${zRate}% stillness rate`;

    // Soham card
    document.getElementById('s-total-mins').textContent = `${(sohamMins / 60).toFixed(1)}h (${sohamMins}m)`;
    document.getElementById('s-clean-sits').textContent = `${sohamClean} clean / ${sohamTimeouts} timeout`;
    document.getElementById('s-longest-sit').textContent = `${sohamMax}m`;
    const sRate = sohamSits.length ? Math.round((sohamClean / sohamSits.length) * 100) : 0;
    document.getElementById('s-completion-rate').textContent = `${sRate}% stillness rate`;
  }

  renderFeed() {
    const list = document.getElementById('sits-feed-list');
    if (!list) return;

    let filtered = this.allSits;
    if (this.viewMode === 'Zabir') filtered = filtered.filter(s => s.user === 'Zabir');
    else if (this.viewMode === 'Soham') filtered = filtered.filter(s => s.user === 'Soham');

    if (filtered.length === 0) {
      list.innerHTML = `<div class="feed-empty">No meditation sits logged yet. Start a session or log one manually!</div>`;
      return;
    }

    list.innerHTML = filtered.map(sit => {
      const isZabir = sit.user === 'Zabir';
      const isClean = sit.status === 'completed';
      const userClass = isZabir ? 'user-zabir' : 'user-soham';
      const statusClass = isClean ? 'status-clean' : 'status-timeout';
      const badgeIcon = isClean 
        ? `<span class="badge-icon" title="Unbroken Stillness">🏆 Full Stillness</span>` 
        : `<span class="badge-icon timeout" title="Movement - Time Out">⚠️ Moved (Time Out)</span>`;

      return `
        <div class="sit-card ${userClass} ${statusClass}">
          <div class="sit-header">
            <div class="sit-user-meta">
              <span class="user-pill ${isZabir ? 'cyan' : 'purple'}">${sit.user}</span>
              <span class="sit-date">${sit.date}</span>
            </div>
            <div class="sit-badges">
              ${badgeIcon}
              <button class="btn-delete-sit" onclick="window.app.deleteSit('${sit.id}')" title="Delete sit">✕</button>
            </div>
          </div>
          <div class="sit-body">
            <div class="sit-duration-highlight">
              <span class="duration-num">${sit.durationMinutes}</span>
              <span class="duration-unit">mins</span>
              <span class="target-comparison">/ goal ${sit.targetMinutes || sit.durationMinutes}m</span>
            </div>
            ${sit.movementReason ? `<div class="movement-callout"><strong>Movement Trigger:</strong> ${sit.movementReason}</div>` : ''}
            <div class="sit-reflection">"${sit.reflection || 'Silent observation.'}"</div>
          </div>
        </div>
      `;
    }).join('');
  }

  async deleteSit(id) {
    if (confirm('Delete this meditation sit record?')) {
      await window.syncManager.deleteSit(id);
      this.showToast('Record deleted.');
    }
  }

  /* ---------------- BREATHING PACER ---------------- */

  initBreathingPacer() {
    const pacerCircle = document.getElementById('breathing-circle');
    const pacerText = document.getElementById('breathing-instruction');
    if (!pacerCircle || !pacerText) return;

    const cycle = [
      { text: 'Inhale through nose', state: 'inhale', duration: 4000 },
      { text: 'Hold with stillness', state: 'hold', duration: 4000 },
      { text: 'Exhale with release', state: 'exhale', duration: 6000 }
    ];

    let step = 0;
    const runCycle = () => {
      const cur = cycle[step];
      pacerText.textContent = cur.text;
      pacerCircle.className = `breath-orb ${cur.state}`;
      step = (step + 1) % cycle.length;
      setTimeout(runCycle, cur.duration);
    };

    runCycle();
  }

  /* ---------------- MODALS & TOASTS ---------------- */

  openModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.add('visible');
  }

  closeModals() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('visible'));
  }

  showToast(message) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'zen-toast';
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 20);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 400);
    }, 3800);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.app = new AdhitthanaApp();
  window.app.init();
});
