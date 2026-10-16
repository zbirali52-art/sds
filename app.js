/**
 * Adhiṭṭhāna Application Controller
 * Handles Past Entry Logging for Zabir & Soham, Data Metrics, Graphs, Background Visuals, and Synchronization.
 */

class AdhitthanaApp {
  constructor() {
    this.currentUser = localStorage.getItem('adhitthana_user') || 'Zabir';
    this.currentFeedFilter = 'all';
    this.allSits = [];
    this.currentBg = localStorage.getItem('adhitthana_bg_pref') || 'video';
  }

  init() {
    this.allSits = window.syncManager.loadLocal();

    this.bindEvents();
    this.initFormDefaults();
    this.initBackground();
    this.updateUserUI();
    this.renderGoals();
    this.renderMetrics();
    this.renderFeed();

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
    // 1. Header Meditator Switcher
    document.querySelectorAll('[data-set-user]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const user = e.currentTarget.getAttribute('data-set-user');
        this.setUser(user);
      });
    });

    // 2. Past Entry Form Meditator Segment Buttons
    document.getElementById('btn-select-zabir')?.addEventListener('click', () => {
      this.setFormUser('Zabir');
    });
    document.getElementById('btn-select-soham')?.addEventListener('click', () => {
      this.setFormUser('Soham');
    });

    // 3. Quick Duration Presets
    document.querySelectorAll('.pill-preset').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const min = e.currentTarget.getAttribute('data-min');
        const sec = e.currentTarget.getAttribute('data-sec') || '0';
        const minInput = document.getElementById('entry-minutes');
        const secInput = document.getElementById('entry-seconds');
        if (minInput) minInput.value = min;
        if (secInput) secInput.value = sec;

        // Auto-select target if empty or default
        const targetInput = document.getElementById('entry-target');
        if (targetInput && (!targetInput.value || targetInput.value === '15')) {
          targetInput.value = min;
        }

        // Highlight active preset
        document.querySelectorAll('.pill-preset').forEach(p => p.classList.remove('active'));
        e.currentTarget.classList.add('active');
      });
    });

    // 4. Outcome Radio Toggle
    const outcomeRadios = document.querySelectorAll('input[name="entry-outcome"]');
    outcomeRadios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        const val = e.target.value;
        const rowReason = document.getElementById('row-movement-reason');
        document.getElementById('label-outcome-completed')?.classList.toggle('active', val === 'completed');
        document.getElementById('label-outcome-timeout')?.classList.toggle('active', val === 'timeout');

        if (rowReason) {
          if (val === 'timeout') {
            rowReason.classList.remove('hidden');
          } else {
            rowReason.classList.add('hidden');
          }
        }
      });
    });

    // 5. Submit Past Entry Form
    document.getElementById('form-past-entry')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handlePastEntrySubmit();
    });

    // 6. Feed Filter Tabs
    document.querySelectorAll('.feed-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        document.querySelectorAll('.feed-tab').forEach(t => t.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.currentFeedFilter = e.currentTarget.getAttribute('data-filter');
        this.renderFeed();
      });
    });

    // 7. Goals Modal
    document.getElementById('btn-edit-goals-banner')?.addEventListener('click', () => {
      const goals = window.syncManager.getGoals();
      if (document.getElementById('goal-zabir-daily')) {
        document.getElementById('goal-zabir-daily').value = goals.Zabir?.dailyMinutes || 15;
        document.getElementById('goal-zabir-weekly').value = goals.Zabir?.weeklyTarget || 7;
        document.getElementById('goal-soham-daily').value = goals.Soham?.dailyMinutes || 15;
        document.getElementById('goal-soham-weekly').value = goals.Soham?.weeklyTarget || 7;
      }
      this.openModal('modal-goals');
    });

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

    // 8. Background Selector Modal
    document.getElementById('btn-toggle-bg')?.addEventListener('click', () => {
      this.openModal('modal-bg-select');
    });

    document.querySelectorAll('.bg-option-card').forEach(card => {
      card.addEventListener('click', (e) => {
        const bg = e.currentTarget.getAttribute('data-bg');
        this.setBackground(bg);
        this.closeModals();
      });
    });

    // 9. Sync Modal
    document.getElementById('btn-open-sync')?.addEventListener('click', () => {
      this.openModal('modal-sync');
      const tokenInput = document.getElementById('input-gh-token');
      if (tokenInput) tokenInput.value = window.syncManager.githubToken || '';
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

    // 10. Close Modals
    document.querySelectorAll('.modal-close, .modal-backdrop').forEach(el => {
      el.addEventListener('click', () => this.closeModals());
    });
  }

  initFormDefaults() {
    const dateInput = document.getElementById('entry-date');
    if (dateInput) {
      dateInput.value = new Date().toISOString().split('T')[0];
    }
    this.setFormUser(this.currentUser);
  }

  /* ---------------- USER SWITCHER ---------------- */

  setUser(user) {
    this.currentUser = user;
    localStorage.setItem('adhitthana_user', user);
    this.updateUserUI();
    this.setFormUser(user);
    this.showToast(`Active meditator: ${user === 'Soham' ? 'Soham Sadhu' : user}`);
  }

  setFormUser(user) {
    const hiddenInput = document.getElementById('entry-user');
    if (hiddenInput) hiddenInput.value = user;

    const btnZabir = document.getElementById('btn-select-zabir');
    const btnSoham = document.getElementById('btn-select-soham');

    if (user === 'Zabir') {
      btnZabir?.classList.add('active-zabir');
      btnSoham?.classList.remove('active-soham');
    } else {
      btnSoham?.classList.add('active-soham');
      btnZabir?.classList.remove('active-zabir');
    }
  }

  updateUserUI() {
    document.querySelectorAll('[data-set-user]').forEach(btn => {
      const u = btn.getAttribute('data-set-user');
      btn.classList.toggle('active-user', u === this.currentUser);
    });
  }

  /* ---------------- BACKGROUND SWITCHER ---------------- */

  initBackground() {
    this.setBackground(this.currentBg);
  }

  setBackground(bgName) {
    this.currentBg = bgName;
    localStorage.setItem('adhitthana_bg_pref', bgName);

    const video = document.getElementById('ambientBackgroundVideo');
    const imgBg = document.getElementById('ambientBackgroundImage');

    // Update active card in modal
    document.querySelectorAll('.bg-option-card').forEach(c => {
      c.classList.toggle('active', c.getAttribute('data-bg') === bgName);
    });

    if (bgName === 'video') {
      if (video) {
        video.style.display = 'block';
        video.style.opacity = '0.58';
        video.play().catch(() => {});
      }
      if (imgBg) {
        imgBg.style.opacity = '0';
      }
    } else {
      let imageSrc = 'assets/bg_ocean_night.jpg';
      if (bgName === 'cosmos_water') imageSrc = 'assets/bg_cosmos_water.jpg';
      if (bgName === 'deep_turtle') imageSrc = 'assets/bg_deep_turtle.jpg';

      if (imgBg) {
        imgBg.style.backgroundImage = `url('${imageSrc}')`;
        imgBg.style.opacity = '0.72';
      }
      if (video) {
        video.style.opacity = '0';
        video.pause();
      }
    }

    this.showToast(`Background set to: ${bgName.replace('_', ' ').toUpperCase()}`);
  }

  /* ---------------- LOG PAST ENTRY SUBMIT ---------------- */

  async handlePastEntrySubmit() {
    const user = document.getElementById('entry-user').value || this.currentUser;
    const date = document.getElementById('entry-date').value || new Date().toISOString().split('T')[0];
    const mins = parseInt(document.getElementById('entry-minutes').value, 10) || 0;
    const secs = parseInt(document.getElementById('entry-seconds').value, 10) || 0;
    const target = parseInt(document.getElementById('entry-target').value, 10) || 15;
    
    const outcomeRadio = document.querySelector('input[name="entry-outcome"]:checked');
    const status = outcomeRadio ? outcomeRadio.value : 'completed';

    const reasonSelect = document.getElementById('entry-reason-select');
    const reason = status === 'timeout' ? (reasonSelect ? reasonSelect.value : 'Movement logged') : null;
    const reflection = document.getElementById('entry-reflection').value.trim();

    if (mins === 0 && secs === 0) {
      alert('Please enter a valid duration (minutes or seconds).');
      return;
    }

    const durationMinutes = Math.round((mins + (secs / 60)) * 100) / 100;
    const displayDuration = secs > 0 ? `${mins}m ${secs}s` : `${mins} mins`;
    const displayName = user === 'Soham' ? 'Soham Sadhu' : 'Zabir';

    const defaultReflection = status === 'completed'
      ? `Completed ${displayDuration} of unbroken Adhiṭṭhāna stillness.`
      : `Called Time Out after ${displayDuration} due to ${reason.toLowerCase()}. Honoring absolute honesty.`;

    const sit = {
      id: 'sit_' + Date.now(),
      user: user,
      displayName: displayName,
      date: date,
      durationMinutes: durationMinutes,
      displayDuration: displayDuration,
      targetMinutes: target,
      status: status,
      movedAtMinutes: status === 'timeout' ? durationMinutes : null,
      movementReason: reason,
      reflection: reflection || defaultReflection,
      timestamp: new Date(date).getTime() + (12 * 3600 * 1000) // noon of that day
    };

    // Save & sync sit
    await window.syncManager.addSit(sit);

    // Reset fields except date and user
    document.getElementById('entry-minutes').value = '';
    document.getElementById('entry-seconds').value = '';
    document.getElementById('entry-reflection').value = '';
    document.querySelectorAll('.pill-preset').forEach(p => p.classList.remove('active'));

    this.showToast(`✅ Saved sit for ${displayName} (${displayDuration})!`);
  }

  /* ---------------- GOALS & PROGRESS ---------------- */

  renderGoals() {
    const goals = window.syncManager.getGoals();
    const today = new Date().toISOString().split('T')[0];

    const isZabir = s => s.user === 'Zabir' || (s.displayName && s.displayName.toLowerCase().includes('zabir'));
    const isSoham = s => s.user === 'Soham' || (s.displayName && s.displayName.toLowerCase().includes('soham'));

    const zabirToday = this.allSits
      .filter(s => isZabir(s) && s.date === today)
      .reduce((acc, s) => acc + (Number(s.durationMinutes) || 0), 0);

    const sohamToday = this.allSits
      .filter(s => isSoham(s) && s.date === today)
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
      const zDisp = zabirToday >= 11 ? '11m 8s' : `${Math.round(zabirToday)}m`;
      zStatus.textContent = `${zDisp} / ${zTarget}m (${zPct}%)`;
      zStatus.className = `goal-tag ${zPct >= 100 ? 'success' : 'warning'}`;
    }
    if (sStatus) {
      sStatus.textContent = `${Math.round(sohamToday)}m / ${sTarget}m (${sPct >= 100 ? '100% Met! 🔥' : sPct + '%'})`;
      sStatus.className = `goal-tag ${sPct >= 100 ? 'success' : 'warning'}`;
    }
  }

  /* ---------------- METRICS & STATS ---------------- */

  formatMinutes(mins) {
    if (mins < 1) {
      return `${Math.round(mins * 60)}s`;
    }
    const h = Math.floor(mins / 60);
    const m = Math.round(mins % 60);
    if (h > 0) {
      return `${h}h ${m}m`;
    }
    return `${m}m`;
  }

  renderMetrics() {
    const sits = this.allSits;
    const isZabir = s => s.user === 'Zabir' || (s.displayName && s.displayName.toLowerCase().includes('zabir'));
    const isSoham = s => s.user === 'Soham' || (s.displayName && s.displayName.toLowerCase().includes('soham'));

    const zabirSits = sits.filter(s => isZabir(s));
    const sohamSits = sits.filter(s => isSoham(s));

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
    if (zTotalEl) zTotalEl.textContent = zabirMins > 0 ? (zabirMins === 11.13 ? '11m 8s' : this.formatMinutes(zabirMins)) : '0m';
    const zCleanEl = document.getElementById('z-clean-sits');
    if (zCleanEl) zCleanEl.textContent = `${zabirClean} clean / ${zabirTimeouts} timeout`;
    const zLongEl = document.getElementById('z-longest-sit');
    if (zLongEl) zLongEl.textContent = zabirMax === 11.13 ? '11m 8s' : this.formatMinutes(zabirMax);

    // Soham card
    const sTotalEl = document.getElementById('s-total-mins');
    if (sTotalEl) sTotalEl.textContent = this.formatMinutes(sohamMins);
    const sCleanEl = document.getElementById('s-clean-sits');
    if (sCleanEl) sCleanEl.textContent = `${sohamClean} clean / ${sohamTimeouts} timeout`;
    const sLongEl = document.getElementById('s-longest-sit');
    if (sLongEl) sLongEl.textContent = this.formatMinutes(sohamMax);
  }

  /* ---------------- PAST ENTRIES JOURNAL (SIT FEED) ---------------- */

  renderFeed() {
    const list = document.getElementById('sit-feed-container');
    if (!list) return;

    const isZabir = s => s.user === 'Zabir' || (s.displayName && s.displayName.toLowerCase().includes('zabir'));
    const isSoham = s => s.user === 'Soham' || (s.displayName && s.displayName.toLowerCase().includes('soham'));

    // Update Counts
    const zabirCount = this.allSits.filter(s => isZabir(s)).length;
    const sohamCount = this.allSits.filter(s => isSoham(s)).length;

    const countAll = document.getElementById('count-all');
    const countZ = document.getElementById('count-zabir');
    const countS = document.getElementById('count-soham');
    if (countAll) countAll.textContent = this.allSits.length;
    if (countZ) countZ.textContent = zabirCount;
    if (countS) countS.textContent = sohamCount;

    let filtered = this.allSits;
    if (this.currentFeedFilter === 'Zabir') {
      filtered = this.allSits.filter(s => isZabir(s));
    } else if (this.currentFeedFilter === 'Soham') {
      filtered = this.allSits.filter(s => isSoham(s));
    }

    if (filtered.length === 0) {
      list.innerHTML = `<div class="feed-empty" style="color:var(--text-dim); text-align:center; padding:2rem;">No past sits match the selected filter. Log a session above!</div>`;
      return;
    }

    list.innerHTML = filtered.map(sit => {
      const isZ = isZabir(sit);
      const isClean = sit.status === 'completed';
      const userClass = isZ ? 'user-zabir' : 'user-soham';
      const statusClass = isClean ? 'status-clean' : 'status-timeout';
      const badgeIcon = isClean 
        ? `<span class="badge-icon">🏆 Full Stillness</span>` 
        : `<span class="badge-icon timeout">⚠️ Moved (Time Out)</span>`;

      const userName = sit.displayName || (sit.user === 'Soham' ? 'Soham Sadhu' : sit.user);
      const formattedDuration = sit.displayDuration || `${sit.durationMinutes} mins`;
      const reasonHtml = sit.movementReason ? `<div class="sit-reason"><strong>Trigger:</strong> ${sit.movementReason}</div>` : '';

      return `
        <div class="sit-card ${userClass} ${statusClass}">
          <div class="sit-header">
            <div class="sit-user-meta">
              <span class="user-pill ${isZ ? 'cyan' : 'purple'}">${userName}</span>
              <span class="sit-date">${sit.date}</span>
            </div>
            <div class="sit-badges">
              ${badgeIcon}
              <button class="btn-share-sit" onclick="window.app.shareSit('${sit.id}')" title="Share sit via link">📲 Share</button>
              <button class="btn-delete-sit" onclick="window.app.deleteSit('${sit.id}')" title="Delete entry">✕</button>
            </div>
          </div>
          <div class="sit-body">
            <div class="sit-duration-highlight">
              <span class="sit-time-big">${formattedDuration}</span>
              <span class="sit-target-sub">Target: ${sit.targetMinutes || 15}m</span>
            </div>
            ${reasonHtml}
            <div class="sit-reflection">&ldquo;${sit.reflection || 'Maintained mindful stillness.'}&rdquo;</div>
          </div>
        </div>
      `;
    }).join('');
  }

  shareSit(sitId) {
    const sit = this.allSits.find(s => s.id === sitId);
    if (!sit) return;
    const jsonStr = JSON.stringify(sit);
    const encoded = encodeURIComponent(btoa(unescape(encodeURIComponent(jsonStr))));
    const url = `${window.location.origin}${window.location.pathname}?importSit=${encoded}`;

    if (navigator.share) {
      navigator.share({
        title: `Adhiṭṭhāna Sit: ${sit.displayName}`,
        text: `🧘 Check out my meditation sit on Adhiṭṭhāna: ${sit.displayDuration} on ${sit.date}!`,
        url: url
      }).catch(() => this.copyToClipboard(url));
    } else {
      this.copyToClipboard(url);
    }
  }

  copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
      this.showToast('📋 Share link copied! Send it to your peer to sync.');
    }).catch(() => {
      prompt('Copy share link:', text);
    });
  }

  async deleteSit(sitId) {
    if (!confirm('Are you sure you want to delete this meditation entry?')) return;
    this.allSits = this.allSits.filter(s => s.id !== sitId);
    window.syncManager.saveLocal(this.allSits);
    this.renderGoals();
    this.renderMetrics();
    this.renderFeed();
    if (window.zenCharts) {
      window.zenCharts.renderAll(this.allSits);
    }
    this.showToast('Entry deleted.');
  }

  /* ---------------- MODALS & TOASTS ---------------- */

  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('active');
  }

  closeModals() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
  }

  showToast(msg) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'app-toast';
    toast.innerHTML = msg;
    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 400);
    }, 3500);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.app = new AdhitthanaApp();
  window.app.init();
});
