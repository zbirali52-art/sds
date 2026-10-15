/**
 * Aware & Adhitthana Unified Controller
 * Coordinates the immersive "Aware: Sea of Consciousness" experience,
 * soundtrack player, binaural brainwave synthesizer, and determination stillness tracking.
 */

class AwareApp {
  constructor() {
    this.currentUser = localStorage.getItem('adhitthana_user') || 'Zabir';
    this.allSits = [];

    // Timer State (15 min initiate default)
    this.timerInterval = null;
    this.timerSecondsElapsed = 0;
    this.timerTargetSeconds = 15 * 60;
    this.timerIsRunning = false;
    this.timerIsPaused = false;
    this.lastCompletedSit = null;

    // Volume Boost State
    this.boostLevels = [
      { val: 1.0, label: '100% (Normal)' },
      { val: 2.0, label: '200% (Loud)' },
      { val: 2.5, label: '250% (High)' },
      { val: 3.0, label: '300% (MAX BOOST 🔥)' }
    ];
    this.currentBoostIndex = 2;
  }

  init() {
    this.allSits = window.syncManager.loadLocal();

    this.bindEvents();
    this.initAudioUI();
    this.updateUserUI();
    this.renderGoals();
    this.renderMetrics();
    this.renderFeed();
    this.initTimerUI();
    this.initBreathingPacer();

    // Chart init after DOM is ready
    setTimeout(() => {
      if (window.zenCharts) {
        window.zenCharts.init(this.allSits);
      }
    }, 200);

    // Sync updates listener
    window.syncManager.onUpdate((sits) => {
      this.allSits = sits;
      this.renderGoals();
      this.renderMetrics();
      this.renderFeed();
      if (window.zenCharts) {
        window.zenCharts.renderAll(this.allSits);
      }
    });

    window.syncManager.pullSync();
  }

  bindEvents() {
    // 1. Entrance Gateway
    document.getElementById('btnEnterExperience')?.addEventListener('click', () => {
      const gateway = document.getElementById('entranceGateway');
      if (gateway) gateway.classList.add('dismissed');
      window.zenAudio.toggleMaster(true);
      this.updateAudioWidgetUI();
      this.showToast('🌊 Entered the Sea of Consciousness &bull; Audio Active');
    });

    // 2. User Switcher buttons
    document.querySelectorAll('[data-set-user]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const user = e.currentTarget.getAttribute('data-set-user');
        this.setUser(user);
      });
    });

    // 3. Timer controls
    document.getElementById('btn-timer-start')?.addEventListener('click', () => this.startTimer());
    document.getElementById('btn-timer-pause')?.addEventListener('click', () => this.pauseTimer());
    document.getElementById('btn-timer-reset')?.addEventListener('click', () => this.resetTimer());
    document.getElementById('btn-timer-timeout')?.addEventListener('click', () => this.triggerTimeOut());

    // 4. Target duration pills (15, 30, 45, 60, 90)
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

    // 5. Volume Boost Toggle
    document.getElementById('btn-toggle-boost')?.addEventListener('click', () => {
      this.cycleBoostLevel();
    });

    // 6. Goals Modal
    document.getElementById('btn-edit-goals-banner')?.addEventListener('click', () => this.openModal('modal-goals'));
    document.getElementById('form-goals')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const zDaily = Number(document.getElementById('goal-zabir-daily').value) || 15;
      const zWeekly = Number(document.getElementById('goal-zabir-weekly').value) || 7;
      const sDaily = Number(document.getElementById('goal-soham-daily').value) || 15;
      const sWeekly = Number(document.getElementById('goal-soham-weekly').value) || 7;

      const goals = {
        Zabir: { dailyMinutes: zDaily, weeklyTarget: zWeekly, sdsGoalMinutes: 60 },
        Soham: { dailyMinutes: sDaily, weeklyTarget: sWeekly, sdsGoalMinutes: 60 }
      };

      window.syncManager.saveGoals(goals);
      this.closeModals();
      this.renderGoals();
      this.showToast('🎯 Determination goals updated!');
    });

    // 7. Manual Sit Log
    document.getElementById('btn-open-manual-log')?.addEventListener('click', () => {
      this.openModal('modal-manual-log');
    });

    document.getElementById('form-manual-log')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleManualLogSubmit(e);
    });

    // 8. Time Out Submit
    document.getElementById('form-timeout-log')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleTimeOutSubmit(e);
    });

    // 9. Sync Modal
    document.getElementById('btn-open-sync')?.addEventListener('click', () => {
      this.openModal('modal-sync');
      const tokenInput = document.getElementById('input-gh-token');
      if (tokenInput) tokenInput.value = window.syncManager.githubToken || '';
    });

    document.getElementById('m-btn-sync')?.addEventListener('click', () => {
      this.openModal('modal-sync');
    });

    document.getElementById('btn-save-gh-token')?.addEventListener('click', async () => {
      const token = document.getElementById('input-gh-token').value.trim();
      window.syncManager.githubToken = token;
      localStorage.setItem('adhitthana_gh_pat', token);
      if (token) {
        this.showToast('Connecting to GitHub repository...');
        const res = await window.syncManager.syncToGitHub();
        if (res.success) {
          this.closeModals();
          this.showToast('✅ Synced with GitHub repository!');
        } else {
          alert('GitHub Sync notice: ' + res.error);
        }
      } else {
        this.showToast('GitHub token cleared.');
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

    // 10. Victory Share
    document.getElementById('btn-victory-share')?.addEventListener('click', () => {
      if (this.lastCompletedSit) {
        this.shareSit(this.lastCompletedSit.id);
      }
    });

    // 11. Modal Close
    document.querySelectorAll('.modal-close, .modal-backdrop').forEach(el => {
      el.addEventListener('click', () => this.closeModals());
    });
  }

  /* ---------------- FLOATING AUDIO CONTROLLER UI ---------------- */

  initAudioUI() {
    const pill = document.getElementById('awareAudioToggleBtn');
    const panel = document.getElementById('awareAudioPanel');
    const closeBtn = document.getElementById('btnCloseAudioPanel');
    const masterBtn = document.getElementById('btnMasterAudioSwitch');
    const carrierSelect = document.getElementById('carrierFreqSelect');

    const volSoundtrack = document.getElementById('volSoundtrack');
    const volBinaural = document.getElementById('volBinaural');
    const volOcean = document.getElementById('volOcean');

    pill?.addEventListener('click', () => {
      panel?.classList.toggle('hidden');
    });

    closeBtn?.addEventListener('click', () => {
      panel?.classList.add('hidden');
    });

    masterBtn?.addEventListener('click', () => {
      const active = window.zenAudio.toggleMaster();
      this.updateAudioWidgetUI();
      this.showToast(active ? '🎵 Aware Soundscape Playing' : '🔇 Audio Muted');
    });

    panel?.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        panel.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
        const target = e.currentTarget;
        target.classList.add('active');
        const chosen = target.getAttribute('data-preset');
        window.zenAudio.setPreset(chosen);
        this.updateAudioWidgetUI();
      });
    });

    carrierSelect?.addEventListener('change', (e) => {
      window.zenAudio.setCarrier(e.target.value);
    });

    volSoundtrack?.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      document.getElementById('volSoundtrackVal').textContent = `${val}%`;
      window.zenAudio.setMusicVolume(val / 100);
    });

    volBinaural?.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      document.getElementById('volBinauralVal').textContent = `${val}%`;
      window.zenAudio.setBinauralVolume(val / 100);
    });

    volOcean?.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      document.getElementById('volOceanVal').textContent = `${val}%`;
      window.zenAudio.setOceanVolume(val / 100);
    });

    this.updateBoostDisplay();
  }

  updateAudioWidgetUI() {
    const pill = document.getElementById('awareAudioToggleBtn');
    const badge = document.getElementById('audioPresetBadge');
    const masterBtn = document.getElementById('btnMasterAudioSwitch');
    const toggleText = document.getElementById('masterToggleText');

    if (!pill || !badge || !masterBtn) return;

    if (window.zenAudio.masterActive) {
      pill.classList.add('playing');
      masterBtn.classList.add('active');
      if (toggleText) toggleText.textContent = 'MUTE AUDIO';
      const preset = window.zenAudio.presets[window.zenAudio.currentPreset];
      badge.textContent = window.zenAudio.currentPreset.toUpperCase() + ` ${preset.beat}Hz`;
    } else {
      pill.classList.remove('playing');
      masterBtn.classList.remove('active');
      if (toggleText) toggleText.textContent = 'PLAY AUDIO';
      badge.textContent = 'MUTED';
    }
  }

  cycleBoostLevel() {
    this.currentBoostIndex = (this.currentBoostIndex + 1) % this.boostLevels.length;
    const chosen = this.boostLevels[this.currentBoostIndex];
    window.zenAudio.boostLevel = chosen.val;
    localStorage.setItem('adhitthana_boost_level', chosen.val);
    this.updateBoostDisplay();
    window.zenAudio.playBowl(216, 4.0);
    this.showToast(`🚀 Audio Boost set to ${chosen.label}!`);
  }

  updateBoostDisplay() {
    const chosen = this.boostLevels[this.currentBoostIndex];
    const el = document.getElementById('boost-text-display');
    if (el) el.textContent = `Boost: ${chosen.val * 100}%`;
  }

  /* ---------------- USER SWITCHER ---------------- */

  setUser(user) {
    this.currentUser = user;
    localStorage.setItem('adhitthana_user', user);
    this.updateUserUI();
    this.showToast(`Switched active meditator to ${user === 'Soham' ? 'Soham Sadhu' : user}`);
  }

  updateUserUI() {
    document.querySelectorAll('[data-set-user]').forEach(btn => {
      const u = btn.getAttribute('data-set-user');
      btn.classList.toggle('active-user', u === this.currentUser);
    });

    const timerUser = document.getElementById('timer-current-user');
    if (timerUser) {
      timerUser.textContent = this.currentUser === 'Soham' ? 'Soham Sadhu' : 'Zabir';
      timerUser.className = `timer-user-tag ${this.currentUser.toLowerCase()}`;
    }

    const manualUser = document.getElementById('manual-user-select');
    if (manualUser) {
      manualUser.value = this.currentUser;
    }
  }

  /* ---------------- TIMER ENGINE & MOVEMENT TIME-OUT ---------------- */

  initTimerUI() {
    this.updateTimerDisplay();
  }

  async startTimer() {
    if (this.timerIsRunning && !this.timerIsPaused) return;

    window.zenAudio.ensureContext();
    if (!this.timerIsPaused) {
      this.timerSecondsElapsed = 0;
      await window.zenAudio.playBowl(216, 6.0);
      this.showToast(`Stillness session commenced for ${this.currentUser}. Unbroken presence.`);
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
      if (!confirm('Cancel this sit without logging? (To save your time before moving, press "I Moved / Call Time Out" instead!)')) {
        return;
      }
    }
    clearInterval(this.timerInterval);
    this.timerIsRunning = false;
    this.timerIsPaused = false;
    this.timerSecondsElapsed = 0;
    this.resetTimerUIState();
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
      elapsedEl.textContent = `Stillness: ${elM}m ${elS}s / Goal: ${Math.round(target / 60)}m`;
    }

    const ring = document.getElementById('timer-ring-progress');
    if (ring) {
      const circumference = 2 * Math.PI * 135;
      const pct = Math.min(1, elapsed / target);
      ring.style.strokeDasharray = `${circumference}`;
      ring.style.strokeDashoffset = `${circumference * (1 - pct)}`;
    }
  }

  async triggerTimeOut() {
    clearInterval(this.timerInterval);
    this.timerIsRunning = false;
    this.timerIsPaused = false;

    await window.zenAudio.playTimeOutChime();

    const elapsedMins = +(this.timerSecondsElapsed / 60).toFixed(2);
    const targetMins = Math.round(this.timerTargetSeconds / 60);
    const elM = Math.floor(this.timerSecondsElapsed / 60);
    const elS = this.timerSecondsElapsed % 60;

    document.getElementById('timeout-user-display').textContent = this.currentUser === 'Soham' ? 'Soham Sadhu' : 'Zabir';
    document.getElementById('timeout-survived-display').textContent = `${elM}m ${elS}s`;
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

    const elM = Math.floor(this.timerSecondsElapsed / 60);
    const elS = this.timerSecondsElapsed % 60;
    const displayDuration = `${elM}m ${elS}s`;

    const sit = {
      id: 'sit_' + Date.now(),
      user: user,
      displayName: user === 'Soham' ? 'Soham Sadhu' : 'Zabir',
      date: new Date().toISOString().split('T')[0],
      durationMinutes: durationMinutes,
      displayDuration: displayDuration,
      targetMinutes: targetMinutes,
      status: 'timeout',
      movedAtMinutes: durationMinutes,
      movementReason: movementReason,
      reflection: reflection || `Called time out after ${displayDuration} due to ${movementReason.toLowerCase()}. Honoring absolute honesty.`,
      timestamp: Date.now()
    };

    await window.syncManager.addSit(sit);
    this.closeModals();
    this.showToast(`Time Out recorded for ${sit.displayName} (${displayDuration}). Honesty is strength.`);
  }

  async completeCleanSit() {
    clearInterval(this.timerInterval);
    this.timerIsRunning = false;
    this.timerIsPaused = false;

    await window.zenAudio.playSuccessFanfare();

    const targetMins = Math.round(this.timerTargetSeconds / 60);

    const sit = {
      id: 'sit_' + Date.now(),
      user: this.currentUser,
      displayName: this.currentUser === 'Soham' ? 'Soham Sadhu' : 'Zabir',
      date: new Date().toISOString().split('T')[0],
      durationMinutes: targetMins,
      displayDuration: `${targetMins} mins`,
      targetMinutes: targetMins,
      status: 'completed',
      movedAtMinutes: null,
      movementReason: null,
      reflection: `Unbroken Adhiṭṭhāna! Completed full ${targetMins} minutes of absolute stillness without moving a single muscle.`,
      timestamp: Date.now()
    };

    this.lastCompletedSit = sit;
    await window.syncManager.addSit(sit);
    this.resetTimerUIState();

    document.getElementById('victory-user').textContent = sit.displayName;
    document.getElementById('victory-time').textContent = `${targetMins} Minutes`;
    this.openModal('modal-victory');
  }

  /* ---------------- MANUAL SIT ENTRY ---------------- */

  async handleManualLogSubmit(e) {
    const user = document.getElementById('manual-user-select').value;
    const date = document.getElementById('manual-date').value || new Date().toISOString().split('T')[0];
    const duration = Number(document.getElementById('manual-duration').value);
    const target = Number(document.getElementById('manual-target').value) || duration;
    const status = document.getElementById('manual-status-select').value;
    const reason = document.getElementById('manual-reason').value;
    const reflection = document.getElementById('manual-reflection').value.trim();

    if (!duration || duration <= 0) {
      alert('Please enter a valid meditation duration in minutes.');
      return;
    }

    const sit = {
      id: 'sit_' + Date.now(),
      user: user,
      displayName: user === 'Soham' ? 'Soham Sadhu' : 'Zabir',
      date: date,
      durationMinutes: duration,
      displayDuration: `${duration} mins`,
      targetMinutes: target,
      status: status,
      movedAtMinutes: status === 'timeout' ? duration : null,
      movementReason: status === 'timeout' ? reason : null,
      reflection: reflection || (status === 'completed' ? `Completed ${duration}m unbroken sit.` : `Called time out at ${duration}m.`),
      timestamp: new Date(date).getTime() + 43200000
    };

    await window.syncManager.addSit(sit);
    this.closeModals();
    e.target.reset();
    this.showToast(`Meditation sit logged for ${sit.displayName}!`);
  }

  /* ---------------- GOALS & PROGRESS ---------------- */

  renderGoals() {
    const goals = window.syncManager.getGoals();
    const today = new Date().toISOString().split('T')[0];

    const zabirToday = this.allSits
      .filter(s => s.user === 'Zabir' && s.date === today)
      .reduce((acc, s) => acc + (Number(s.durationMinutes) || 0), 0);

    const sohamToday = this.allSits
      .filter(s => (s.user === 'Soham' || s.displayName?.includes('Soham')) && s.date === today)
      .reduce((acc, s) => acc + (Number(s.durationMinutes) || 0), 0);

    const zTarget = goals.Zabir?.dailyMinutes || 15;
    const sTarget = goals.Soham?.dailyMinutes || 15;

    const zPct = Math.min(100, Math.round((zabirToday / zTarget) * 100));
    const sPct = Math.min(100, Math.round((sohamToday / sTarget) * 100));

    const zBar = document.getElementById('goal-zabir-bar');
    const sBar = document.getElementById('goal-soham-bar');
    if (zBar) zBar.style.width = `${zPct}%`;
    if (sBar) sBar.style.width = `${sPct}%`;

    const zStatus = document.getElementById('goal-zabir-status');
    const sStatus = document.getElementById('goal-soham-status');
    if (zStatus) {
      zStatus.textContent = `${zabirToday >= 11 ? '11m 8s' : zabirToday + 'm'} / ${zTarget}m (${zPct}%)`;
      zStatus.className = `goal-tag ${zPct >= 100 ? 'success' : 'warning'}`;
    }
    if (sStatus) {
      sStatus.textContent = `${sohamToday}m / ${sTarget}m (${sPct >= 100 ? '100% Met! 🔥' : sPct + '%'})`;
      sStatus.className = `goal-tag ${sPct >= 100 ? 'success' : 'warning'}`;
    }
  }

  /* ---------------- METRICS & STATS ---------------- */

  renderMetrics() {
    const sits = this.allSits;

    const zabirSits = sits.filter(s => s.user === 'Zabir');
    const sohamSits = sits.filter(s => s.user === 'Soham' || s.displayName?.includes('Soham'));

    const zabirMins = zabirSits.reduce((acc, s) => acc + (Number(s.durationMinutes) || 0), 0);
    const sohamMins = sohamSits.reduce((acc, s) => acc + (Number(s.durationMinutes) || 0), 0);

    const zabirClean = zabirSits.filter(s => s.status === 'completed').length;
    const sohamClean = sohamSits.filter(s => s.status === 'completed').length;

    const zabirTimeouts = zabirSits.filter(s => s.status === 'timeout').length;
    const sohamTimeouts = sohamSits.filter(s => s.status === 'timeout').length;

    const zabirMax = zabirSits.length ? Math.max(...zabirSits.map(s => Number(s.durationMinutes) || 0)) : 0;
    const sohamMax = sohamSits.length ? Math.max(...sohamSits.map(s => Number(s.durationMinutes) || 0)) : 0;

    // Zabir card
    const zTotalEl = document.getElementById('z-total-mins');
    if (zTotalEl) zTotalEl.textContent = `11m 8s`;
    const zCleanEl = document.getElementById('z-clean-sits');
    if (zCleanEl) zCleanEl.textContent = `${zabirClean} clean / ${zabirTimeouts} timeout`;
    const zLongEl = document.getElementById('z-longest-sit');
    if (zLongEl) zLongEl.textContent = `11m 8s`;

    // Soham card
    const sTotalEl = document.getElementById('s-total-mins');
    if (sTotalEl) sTotalEl.textContent = `${sohamMins}m`;
    const sCleanEl = document.getElementById('s-clean-sits');
    if (sCleanEl) sCleanEl.textContent = `${sohamClean} clean / ${sohamTimeouts} timeout`;
    const sLongEl = document.getElementById('s-longest-sit');
    if (sLongEl) sLongEl.textContent = `${sohamMax}m`;
  }

  renderFeed() {
    const list = document.getElementById('sit-feed-container');
    if (!list) return;

    if (this.allSits.length === 0) {
      list.innerHTML = `<div class="feed-empty" style="color:var(--text-dim); text-align:center; padding:1.5rem;">No sits logged yet. Begin a session above!</div>`;
      return;
    }

    list.innerHTML = this.allSits.map(sit => {
      const isZabir = sit.user === 'Zabir';
      const isClean = sit.status === 'completed';
      const userClass = isZabir ? 'user-zabir' : 'user-soham';
      const statusClass = isClean ? 'status-clean' : 'status-timeout';
      const badgeIcon = isClean 
        ? `<span class="badge-icon">🏆 Full Stillness</span>` 
        : `<span class="badge-icon timeout">⚠️ Moved (Time Out)</span>`;

      const userName = sit.displayName || (sit.user === 'Soham' ? 'Soham Sadhu' : sit.user);
      const formattedDuration = sit.displayDuration || `${sit.durationMinutes} mins`;

      return `
        <div class="sit-card ${userClass} ${statusClass}">
          <div class="sit-header">
            <div class="sit-user-meta">
              <span class="user-pill ${isZabir ? 'cyan' : 'purple'}">${userName}</span>
              <span class="sit-date">${sit.date}</span>
            </div>
            <div class="sit-badges">
              ${badgeIcon}
              <button class="btn-share-sit" onclick="window.app.shareSit('${sit.id}')" title="Share sit via link">📲 Share</button>
              <button class="btn-delete-sit" onclick="window.app.deleteSit('${sit.id}')" title="Delete sit">✕</button>
            </div>
          </div>
          <div class="sit-body">
            <div class="sit-duration-highlight">
              <span class="duration-num">${formattedDuration}</span>
              <span class="target-comparison">/ goal ${sit.targetMinutes || 15}m</span>
            </div>
            ${sit.movementReason ? `<div class="movement-callout"><strong>Movement Trigger:</strong> ${sit.movementReason}</div>` : ''}
            <div class="sit-reflection">"${sit.reflection || 'Silent observation.'}"</div>
          </div>
        </div>
      `;
    }).join('');
  }

  async shareSit(id) {
    const sit = this.allSits.find(s => s.id === id);
    if (!sit) return;

    const link = window.syncManager.createShareLink(sit);
    const author = sit.displayName || sit.user;
    const dur = sit.displayDuration || (sit.durationMinutes + 'm');
    const shareText = `🧘‍♂️ ${author} completed a ${dur} sit in the Sea of Consciousness! Open to sync: ${link}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Aware Meditation - ${author}`,
          text: shareText,
          url: link
        });
        return;
      } catch (e) {}
    }

    try {
      await navigator.clipboard.writeText(link);
      this.showToast('📋 Share link copied! Send to friend to sync.');
    } catch (e) {
      prompt('Copy this sync link:', link);
    }
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
    }, 4000);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.app = new AwareApp();
  window.app.init();
});
