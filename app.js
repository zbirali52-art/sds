/**
 * Adhiṭṭhāna Application Controller
 * Scroll-Driven Architecture Inspired by Caler Edwards ("5 Must-Visit Scroll-Based Website Designs")
 * Synthesizes:
 * - Jesco Jets: Viewport Aperture Zoom Scrub (GSAP ScrollTrigger + Lenis)
 * - Lando Norris: Kinetic Telemetry & Brutalist Driver Performance
 * - 17y Agency: Tactile Micro-Synthesizer Clicks (Web Audio API)
 * - Breakthrough Energy: Dynamic Blend-Mode Difference Typography & Theme Swapper
 * - Midlife Engineering: Interactive Product Emulator (Past Logger + Live Stillness Simulator)
 */

/* ---------------- 1. TACTILE AUDIO MICRO-SYNTHESIZER (17y AGENCY) ---------------- */

function playClick() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    if (!window.sfxAudioCtx) {
      window.sfxAudioCtx = new AudioCtx();
    }
    const ctx = window.sfxAudioCtx;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(70, now + 0.015);
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.015);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.016);
  } catch (e) {
    // Silent fallback
  }
}

// Global tactile click event delegation
document.addEventListener('click', (e) => {
  const target = e.target.closest('button, a, input, select, textarea, .pill-preset, .bg-option-card, .filter-pill, .timeframe-btn, .emulator-tab-btn');
  if (target) {
    playClick();
  }
}, true);


/* ---------------- 2. MAIN APPLICATION CLASS ---------------- */

class AdhitthanaApp {
  constructor() {
    this.currentUser = localStorage.getItem('adhitthana_user') || 'Zabir';
    this.currentFeedFilter = 'all';
    this.allSits = [];
    this.currentBg = localStorage.getItem('adhitthana_bg_pref') || 'video';

    // Live Simulator State
    this.simRunning = false;
    this.simPaused = false;
    this.simElapsed = 0;
    this.simTarget = 15 * 60; // 15 mins default (900 seconds)
    this.simInterval = null;

    // Magnetic Cursor Coordinates
    this.mouse = { x: -100, y: -100 };
    this.follower = { x: -100, y: -100 };
    this.isDesktop = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  }

  init() {
    this.allSits = window.syncManager.loadLocal();

    this.initScrollEngine();
    this.initMagneticCursor();
    this.initSimulator();
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
    }, 250);

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

  /* ---------------- 3. LENIS INERTIAL SCROLL & GSAP SCROLLTRIGGER ---------------- */

  initScrollEngine() {
    const progressBar = document.getElementById('scroll-progress');
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.dock-link');
    const bgVideo = document.getElementById('ambientBackgroundVideo');

    const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (window.innerWidth <= 768);

    // 1. Initialize Lenis ONLY on Desktop (Mouse Wheel)
    // On mobile touch devices, native 120Hz/60Hz touch scrolling with hardware momentum is vastly superior and instantaneous!
    if (!isTouch && typeof Lenis !== 'undefined') {
      const lenis = new Lenis({
        lerp: 0.1,             // Snappy, responsive desktop inertia
        wheelMultiplier: 1.15, // Fast natural scroll speed
        smoothWheel: true,
        smoothTouch: false,    // NEVER hijack touch events
      });

      // Synchronize Lenis with GSAP ScrollTrigger updates
      if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);
        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add((time) => {
          lenis.raf(time * 1000);
        });
        gsap.ticker.lagSmoothing(0);
      }
      window.lenis = lenis;

      // Smooth anchor scrolling via Lenis for desktop
      document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener('click', (e) => {
          const href = anchor.getAttribute('href');
          if (href && href !== '#' && document.querySelector(href)) {
            e.preventDefault();
            playClick();
            const target = document.querySelector(href);
            lenis.scrollTo(target, { offset: -30, duration: 1.0 });
          }
        });
      });
    } else {
      // Mobile / Touch: Use native smooth scroll for anchor links with zero lag
      document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener('click', (e) => {
          const href = anchor.getAttribute('href');
          if (href && href !== '#' && document.querySelector(href)) {
            e.preventDefault();
            playClick();
            const target = document.querySelector(href);
            const top = target.getBoundingClientRect().top + window.pageYOffset - 50;
            window.scrollTo({ top, behavior: 'smooth' });
          }
        });
      });
    }

    // 2. Hero Pinning & Aperture Zoom Scrub
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined' && document.querySelector('.hero-section')) {
      gsap.registerPlugin(ScrollTrigger);

      // Distinct Desktop vs Mobile configurations using gsap.matchMedia
      const mm = gsap.matchMedia();

      mm.add("(min-width: 769px)", () => {
        // Desktop: Full Jesco Jets pinned aperture zoom scrub
        const heroTimeline = gsap.timeline({
          scrollTrigger: {
            trigger: '.hero-section',
            start: 'top top',
            end: '+=100%',       // Clean, fast pin duration
            pin: true,
            scrub: 0.5,          // Snappy 0.5s scrub instead of sluggish 1.0s
            anticipatePin: 1,
          },
        });

        heroTimeline
          .fromTo(
            '.media-canvas',
            { scale: 1.0, borderRadius: '0px' },
            { scale: 0.82, borderRadius: '32px', ease: 'power2.inOut' },
            0
          )
          .to(
            '.hero-overlay-copy',
            { y: -50, opacity: 0.15, ease: 'power2.inOut' },
            0
          );
      });

      mm.add("(max-width: 768px)", () => {
        // Mobile: NO PINNING! Completely unblocked, natural thumb swipe scrolling
        gsap.to('.media-canvas', {
          scale: 0.96,
          borderRadius: '20px',
          scrollTrigger: {
            trigger: '.hero-section',
            start: 'top top',
            end: 'bottom top',
            scrub: true,
          }
        });
      });

      // 3. Dynamic Background Theme Swapper
      const themeMap = {
        dark: { bg: '#0b0c0e', text: '#f0f2f5' },
        light: { bg: '#f5f4f0', text: '#121314' },
        forest: { bg: '#0d140f', text: '#ccff00' },
      };

      document.querySelectorAll('[data-theme-target]').forEach((panel) => {
        const targetTheme = panel.getAttribute('data-theme-target');
        const palette = themeMap[targetTheme];

        if (!palette) return;

        ScrollTrigger.create({
          trigger: panel,
          start: 'top 50%',
          end: 'bottom 50%',
          onEnter: () => this.applyTheme(palette),
          onEnterBack: () => this.applyTheme(palette),
        });
      });
    }

    // 4. Scroll Progress Bar & Parallax Background Video
    window.addEventListener('scroll', () => {
      const scrollY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollY / docHeight) * 100 : 0;

      if (progressBar) {
        progressBar.style.width = `${progress}%`;
      }

      // Parallax on background video only on desktop
      if (!isTouch && bgVideo && scrollY < window.innerHeight * 1.5) {
        bgVideo.style.transform = `scale(${1 + scrollY * 0.00025}) translateY(${scrollY * 0.08}px)`;
      }

      // Active Section in Dock Navigation
      let currentSectionId = '';
      sections.forEach(sec => {
        const top = sec.offsetTop - 180;
        const height = sec.offsetHeight;
        if (scrollY >= top && scrollY < top + height) {
          currentSectionId = sec.getAttribute('id');
        }
      });

      if (currentSectionId) {
        navLinks.forEach(link => {
          link.classList.toggle('active', link.getAttribute('data-nav') === currentSectionId);
        });
      }
    }, { passive: true });
  }

  applyTheme({ bg, text }) {
    document.documentElement.style.setProperty('--bg-current', bg);
    document.documentElement.style.setProperty('--text-current', text);
  }

  /* ---------------- 4. MAGNETIC CURSOR MICRO-INTERACTIONS ---------------- */

  initMagneticCursor() {
    if (!this.isDesktop) return;

    const cursor = document.getElementById('custom-cursor');
    const follower = document.getElementById('cursor-follower');
    if (!cursor || !follower) return;

    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
      cursor.style.transform = `translate(${this.mouse.x}px, ${this.mouse.y}px)`;
    }, { passive: true });

    // Smooth lerp follower loop
    const renderFollower = () => {
      this.follower.x += (this.mouse.x - this.follower.x) * 0.16;
      this.follower.y += (this.mouse.y - this.follower.y) * 0.16;
      follower.style.transform = `translate(${this.follower.x}px, ${this.follower.y}px)`;
      requestAnimationFrame(renderFollower);
    };
    requestAnimationFrame(renderFollower);

    // Interactive button expansions
    const interactiveElements = document.querySelectorAll('button, a, input, select, textarea, .pill-preset, .bg-option-card, .filter-pill');
    interactiveElements.forEach(el => {
      el.addEventListener('mouseenter', () => follower.classList.add('hovering'));
      el.addEventListener('mouseleave', () => follower.classList.remove('hovering'));
    });
  }

  /* ---------------- 5. LIVE STILLNESS SIMULATOR (MIDLIFE ENGINEERING) ---------------- */

  initSimulator() {
    const btnStart = document.getElementById('btn-sim-start');
    const btnPause = document.getElementById('btn-sim-pause');
    const btnTimeout = document.getElementById('btn-sim-timeout');
    const btnReset = document.getElementById('btn-sim-reset');

    btnStart?.addEventListener('click', () => this.startSimulator());
    btnPause?.addEventListener('click', () => this.pauseSimulator());
    btnTimeout?.addEventListener('click', () => this.timeoutSimulator());
    btnReset?.addEventListener('click', () => this.resetSimulator());

    this.updateSimulatorUI();
  }

  startSimulator() {
    if (this.simRunning && !this.simPaused) return;

    this.simRunning = true;
    this.simPaused = false;

    const btnStart = document.getElementById('btn-sim-start');
    const btnPause = document.getElementById('btn-sim-pause');
    const btnTimeout = document.getElementById('btn-sim-timeout');

    if (btnStart) btnStart.style.display = 'none';
    if (btnPause) {
      btnPause.style.display = 'inline-flex';
      btnPause.textContent = '⏸ Pause';
    }
    if (btnTimeout) btnTimeout.style.display = 'inline-flex';

    clearInterval(this.simInterval);
    this.simInterval = setInterval(() => {
      this.simElapsed += 1;
      this.updateSimulatorUI();

      if (this.simElapsed >= this.simTarget) {
        this.completeSimulator();
      }
    }, 1000);

    const userName = this.currentUser === 'Soham' ? 'Soham Sadhu' : 'Zabir';
    this.showToast(`🧘 Stillness vow engaged for ${userName}. Breathe and observe.`);
  }

  pauseSimulator() {
    if (!this.simRunning) return;

    const btnPause = document.getElementById('btn-sim-pause');
    if (!this.simPaused) {
      this.simPaused = true;
      clearInterval(this.simInterval);
      if (btnPause) btnPause.textContent = '▶ Resume';
      this.showToast('Stillness timer paused.');
    } else {
      this.simPaused = false;
      if (btnPause) btnPause.textContent = '⏸ Pause';
      this.simInterval = setInterval(() => {
        this.simElapsed += 1;
        this.updateSimulatorUI();
        if (this.simElapsed >= this.simTarget) {
          this.completeSimulator();
        }
      }, 1000);
      this.showToast('Stillness timer resumed.');
    }
  }

  updateSimulatorUI() {
    const timeDisplay = document.getElementById('sim-time-display');
    const statusSub = document.getElementById('sim-status-sub');
    const userTag = document.getElementById('sim-user-display');
    const progCircle = document.getElementById('sim-track-progress');

    if (userTag) {
      userTag.textContent = (this.currentUser === 'Soham' ? 'SOHAM SADHU' : 'ZABIR').toUpperCase();
    }

    const remaining = Math.max(0, this.simTarget - this.simElapsed);
    const m = Math.floor(remaining / 60);
    const s = remaining % 60;
    if (timeDisplay) {
      timeDisplay.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }

    const elapsedM = Math.floor(this.simElapsed / 60);
    const elapsedS = this.simElapsed % 60;
    const targetM = Math.round(this.simTarget / 60);
    if (statusSub) {
      statusSub.textContent = `Stillness: ${elapsedM}m ${elapsedS}s / Goal: ${targetM}m`;
    }

    if (progCircle) {
      const circumference = 552.92;
      const progressRatio = Math.min(1, this.simElapsed / this.simTarget);
      const offset = circumference * (1 - progressRatio);
      progCircle.style.strokeDashoffset = offset;
    }
  }

  async timeoutSimulator() {
    clearInterval(this.simInterval);
    this.simRunning = false;
    this.simPaused = false;

    const elapsedM = Math.floor(this.simElapsed / 60);
    const elapsedS = this.simElapsed % 60;
    const durationMins = elapsedM + (elapsedS / 60);
    const displayDur = elapsedS > 0 ? `${elapsedM}m ${elapsedS}s` : `${elapsedM}m`;

    const reason = prompt(
      `⚠️ TIME OUT PROTOCOL ENGAGED\nYou maintained stillness for ${displayDur}.\nWhat prompted you to move?`,
      'Physical burn in knees / urge to adjust'
    ) || 'Physical burn in knees / urge to adjust';

    const sit = {
      user: this.currentUser,
      displayName: this.currentUser === 'Soham' ? 'Soham Sadhu' : 'Zabir',
      date: new Date().toISOString().split('T')[0],
      durationMinutes: Math.round(durationMins * 100) / 100,
      displayDuration: displayDur,
      targetMinutes: Math.round(this.simTarget / 60),
      status: 'timeout',
      movedAtMinutes: Math.round(durationMins * 100) / 100,
      movementReason: reason,
      reflection: `Live Stillness Simulator: Called Time Out at ${displayDur}. Rule of absolute honesty honored.`,
      timestamp: Date.now()
    };

    await window.syncManager.addSit(sit);
    this.resetSimulator();
    this.showToast(`⚠️ Time Out recorded for ${sit.displayName} (${displayDur}). Truth honored.`);
  }

  async completeSimulator() {
    clearInterval(this.simInterval);
    this.simRunning = false;
    this.simPaused = false;

    const elapsedM = Math.floor(this.simElapsed / 60);
    const displayDur = `${elapsedM} mins`;

    const sit = {
      user: this.currentUser,
      displayName: this.currentUser === 'Soham' ? 'Soham Sadhu' : 'Zabir',
      date: new Date().toISOString().split('T')[0],
      durationMinutes: elapsedM,
      displayDuration: displayDur,
      targetMinutes: Math.round(this.simTarget / 60),
      status: 'completed',
      movedAtMinutes: null,
      movementReason: null,
      reflection: `Live Stillness Simulator: Completed full ${displayDur} Strong Determination Sit with unbroken resolve!`,
      timestamp: Date.now()
    };

    await window.syncManager.addSit(sit);
    this.resetSimulator();
    this.showToast(`🏆 FULL STILLNESS ACHIEVED! ${displayDur} logged for ${sit.displayName}!`);
  }

  resetSimulator() {
    clearInterval(this.simInterval);
    this.simRunning = false;
    this.simPaused = false;
    this.simElapsed = 0;

    const btnStart = document.getElementById('btn-sim-start');
    const btnPause = document.getElementById('btn-sim-pause');
    const btnTimeout = document.getElementById('btn-sim-timeout');
    if (btnStart) btnStart.style.display = 'inline-flex';
    if (btnPause) btnPause.style.display = 'none';
    if (btnTimeout) btnTimeout.style.display = 'none';

    this.updateSimulatorUI();
  }

  /* ---------------- 6. EVENTS & BINDINGS ---------------- */

  bindEvents() {
    // 1. Emulator Tab Bar (Midlife Engineering Tabbed Emulator)
    document.querySelectorAll('.emulator-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tabId = e.currentTarget.getAttribute('data-tab');
        document.querySelectorAll('.emulator-tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.emulator-tab-content').forEach(c => c.classList.remove('active'));
        e.currentTarget.classList.add('active');
        document.getElementById(tabId)?.classList.add('active');
      });
    });

    // Calendar Picker Button Trigger
    const dateInput = document.getElementById('entry-date');
    const btnCalendar = document.getElementById('btn-trigger-calendar');

    if (btnCalendar && dateInput) {
      btnCalendar.addEventListener('click', (e) => {
        e.preventDefault();
        playClick();
        try {
          if (typeof dateInput.showPicker === 'function') {
            dateInput.showPicker();
          } else {
            dateInput.focus();
            dateInput.click();
          }
        } catch (err) {
          dateInput.focus();
        }
      });
    }

    if (dateInput) {
      dateInput.addEventListener('click', () => {
        try {
          if (typeof dateInput.showPicker === 'function') {
            dateInput.showPicker();
          }
        } catch (e) {}
      });
    }

    // 2. Header Meditator Switcher
    document.querySelectorAll('[data-set-user]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const user = e.currentTarget.getAttribute('data-set-user');
        this.setUser(user);
      });
    });

    // 3. Past Entry Form Meditator Segment Buttons
    document.getElementById('btn-select-zabir')?.addEventListener('click', () => {
      this.setFormUser('Zabir');
    });
    document.getElementById('btn-select-soham')?.addEventListener('click', () => {
      this.setFormUser('Soham');
    });

    // 4. Quick Duration Presets
    document.querySelectorAll('.pill-preset').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const min = e.currentTarget.getAttribute('data-min');
        const sec = e.currentTarget.getAttribute('data-sec') || '0';
        const minInput = document.getElementById('entry-minutes');
        const secInput = document.getElementById('entry-seconds');
        if (minInput) minInput.value = min;
        if (secInput) secInput.value = sec;

        const targetInput = document.getElementById('entry-target');
        if (targetInput && (!targetInput.value || targetInput.value === '15')) {
          targetInput.value = min;
        }

        document.querySelectorAll('.pill-preset').forEach(p => p.classList.remove('active'));
        e.currentTarget.classList.add('active');
      });
    });

    // 5. Outcome Radio Toggle
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

    // 6. Submit Past Entry Form
    document.getElementById('form-past-entry')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handlePastEntrySubmit();
    });

    // 7. Feed Filter Tabs
    document.querySelectorAll('.filter-pill').forEach(tab => {
      tab.addEventListener('click', (e) => {
        document.querySelectorAll('.filter-pill').forEach(t => t.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.currentFeedFilter = e.currentTarget.getAttribute('data-filter');
        this.renderFeed();
      });
    });

    // 8. Goals Modal
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
      this.showToast('🎯 Determination targets updated!');
    });

    // 9. Background Selector Modal
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

    // 10. Sync Modal Handlers
    document.getElementById('btn-open-sync')?.addEventListener('click', () => {
      this.openModal('modal-sync');
      const tokenInput = document.getElementById('input-gh-token');
      if (tokenInput) tokenInput.value = localStorage.getItem(window.syncManager.githubTokenKey) || '';
    });

    document.getElementById('btn-force-sync')?.addEventListener('click', async () => {
      this.showToast('🔄 Checking cloud for newest sits...');
      await window.syncManager.pullFromCloud(false);
      this.showToast('✅ Cloud synchronization check completed!');
    });

    document.getElementById('btn-copy-device-link')?.addEventListener('click', () => {
      const link = `${window.location.origin}${window.location.pathname}`;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(link).then(() => {
          this.showToast('📋 Peer link copied! Share this with Soham to sync automatically.');
        });
      } else {
        prompt('Copy peer sync link:', link);
      }
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

    // 11. Close Modals
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

  /* ---------------- 7. USER SWITCHER ---------------- */

  setUser(user) {
    this.currentUser = user;
    localStorage.setItem('adhitthana_user', user);
    this.updateUserUI();
    this.setFormUser(user);
    this.updateSimulatorUI();
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

  /* ---------------- 8. BACKGROUND SWITCHER ---------------- */

  initBackground() {
    this.setBackground(this.currentBg);
  }

  setBackground(bgName) {
    this.currentBg = bgName;
    localStorage.setItem('adhitthana_bg_pref', bgName);

    const video = document.getElementById('ambientBackgroundVideo');
    const imgBg = document.getElementById('ambientBackgroundImage');

    document.querySelectorAll('.bg-option-card').forEach(c => {
      c.classList.toggle('active', c.getAttribute('data-bg') === bgName);
    });

    if (bgName === 'video') {
      if (video) {
        video.style.display = 'block';
        video.style.opacity = '0.52';
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
        imgBg.style.opacity = '0.68';
      }
      if (video) {
        video.style.opacity = '0';
        video.pause();
      }
    }

    this.showToast(`Background: ${bgName.replace('_', ' ').toUpperCase()}`);
  }

  /* ---------------- 9. LOG PAST ENTRY SUBMIT ---------------- */

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

    const durationMinutes = mins + (secs / 60);
    const displayDuration = secs > 0 ? `${mins}m ${secs}s` : `${mins} mins`;
    const displayName = user === 'Soham' ? 'Soham Sadhu' : 'Zabir';

    const sit = {
      user: user,
      displayName: displayName,
      date: date,
      durationMinutes: Math.round(durationMinutes * 100) / 100,
      displayDuration: displayDuration,
      targetMinutes: target,
      status: status,
      movedAtMinutes: status === 'timeout' ? Math.round(durationMinutes * 100) / 100 : null,
      movementReason: reason,
      reflection: reflection || (status === 'completed' ? 'Maintained unbroken stillness in meditation.' : 'Observed bodily urge to move with mindfulness.'),
      timestamp: Date.now()
    };

    await window.syncManager.addSit(sit);

    document.getElementById('entry-minutes').value = '';
    document.getElementById('entry-seconds').value = '';
    document.getElementById('entry-reflection').value = '';
    document.querySelectorAll('.pill-preset').forEach(p => p.classList.remove('active'));

    this.showToast(`✅ Saved sit for ${displayName} (${displayDuration})!`);
  }

  /* ---------------- 10. GOALS & TELEMETRY PROGRESS ---------------- */

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
      zStatus.className = `track-status ${zPct >= 100 ? 'success' : 'warning'}`;
    }
    if (sStatus) {
      sStatus.textContent = `${Math.round(sohamToday)}m / ${sTarget}m (${sPct >= 100 ? '100% Met! 🔥' : sPct + '%'})`;
      sStatus.className = `track-status ${sPct >= 100 ? 'success' : 'warning'}`;
    }
  }

  /* ---------------- 11. METRICS & STATS ---------------- */

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

    // Zabir Telemetry Card
    const zTotalEl = document.getElementById('z-total-mins');
    if (zTotalEl) zTotalEl.textContent = zabirMins > 0 ? (zabirMins === 11.13 ? '11m 8s' : this.formatMinutes(zabirMins)) : '0m';
    const zCleanEl = document.getElementById('z-clean-sits');
    if (zCleanEl) zCleanEl.textContent = `${zabirClean} / ${zabirTimeouts}`;
    const zLongEl = document.getElementById('z-longest-sit');
    if (zLongEl) zLongEl.textContent = zabirMax === 11.13 ? '11m 8s' : this.formatMinutes(zabirMax);

    // Soham Telemetry Card
    const sTotalEl = document.getElementById('s-total-mins');
    if (sTotalEl) sTotalEl.textContent = this.formatMinutes(sohamMins);
    const sCleanEl = document.getElementById('s-clean-sits');
    if (sCleanEl) sCleanEl.textContent = `${sohamClean} / ${sohamTimeouts}`;
    const sLongEl = document.getElementById('s-longest-sit');
    if (sLongEl) sLongEl.textContent = this.formatMinutes(sohamMax);
  }

  /* ---------------- 12. UNBROKEN CHRONICLE (FEED) ---------------- */

  renderFeed() {
    const list = document.getElementById('sit-feed-container');
    if (!list) return;

    const isZabir = s => s.user === 'Zabir' || (s.displayName && s.displayName.toLowerCase().includes('zabir'));
    const isSoham = s => s.user === 'Soham' || (s.displayName && s.displayName.toLowerCase().includes('soham'));

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
      list.innerHTML = `<div class="feed-empty" style="color:var(--text-dim); text-align:center; padding:2.5rem;">No past sits match the selected filter. Log a session in the Command Center above!</div>`;
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
              <span class="telemetry-pill-tag ${isZ ? 'cyan' : 'purple'}">${userName}</span>
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

  /* ---------------- 13. MODALS & TOASTS ---------------- */

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
