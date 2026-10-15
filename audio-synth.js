/**
 * ZenAudio: Resilient Dual-Layer Audio Engine
 * Primary: Real PCM WAV audio files (bell.wav, timeout.wav) for 100% reliable browser playback.
 * Secondary: Web Audio API synthesis fallback.
 */

class ZenAudio {
  constructor() {
    this.isMuted = false;
    this.isPlayingAmbient = false;
    this.audioContext = null;
    this.ambientGain = null;
    this.ambientNodes = null;

    // Preload audio objects
    this.bellSrc = 'bell.wav';
    this.timeoutSrc = 'timeout.wav';

    // Auto unlock on first user interaction anywhere
    this.initUnlock();
  }

  initUnlock() {
    const unlock = () => {
      this.ensureContext();
      ['click', 'touchstart', 'keydown'].forEach(evt => {
        document.removeEventListener(evt, unlock);
      });
    };
    ['click', 'touchstart', 'keydown'].forEach(evt => {
      document.addEventListener(evt, unlock, { once: true, passive: true });
    });
  }

  ensureContext() {
    if (!this.audioContext) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.audioContext = new AudioCtx();
      }
    }
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(() => {});
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted && this.isPlayingAmbient) {
      this.stopAmbient();
    }
    return this.isMuted;
  }

  /**
   * Play the resonant Tibetan Bronze Bowl Chime
   */
  async playBowl(pitch = 216, duration = 5.5) {
    if (this.isMuted) return;

    try {
      // 1. Primary: Play the high-fidelity WAV file
      const snd = new Audio(this.bellSrc);
      snd.volume = 1.0;
      const playPromise = snd.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.warn('HTML5 Audio play blocked or file unavailable, using synth fallback:', err);
          this.playSynthBowl(pitch, duration);
        });
      }
    } catch (e) {
      this.playSynthBowl(pitch, duration);
    }
  }

  /**
   * Play the grounding Time Out gong
   */
  async playTimeOutChime() {
    if (this.isMuted) return;

    try {
      const snd = new Audio(this.timeoutSrc);
      snd.volume = 1.0;
      const playPromise = snd.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          this.playSynthBowl(144, 4.0);
        });
      }
    } catch (e) {
      this.playSynthBowl(144, 4.0);
    }
  }

  /**
   * Complete sit fanfare
   */
  async playSuccessFanfare() {
    if (this.isMuted) return;
    this.playBowl(216, 5.5);
    setTimeout(() => this.playBowl(288, 5.5), 1200);
    setTimeout(() => this.playBowl(432, 6.0), 2400);
  }

  /**
   * Fallback Web Audio API synthesizer
   */
  playSynthBowl(freq, duration) {
    try {
      this.ensureContext();
      if (!this.audioContext) return;

      const now = this.audioContext.currentTime + 0.01;
      const master = this.audioContext.createGain();
      master.gain.setValueAtTime(0.9, now);
      master.connect(this.audioContext.destination);

      const harmonics = [
        { r: 1.0, g: 0.6, d: duration },
        { r: 1.012, g: 0.35, d: duration * 0.9 },
        { r: 2.76, g: 0.35, d: duration * 0.7 },
        { r: 5.42, g: 0.18, d: duration * 0.5 }
      ];

      harmonics.forEach(h => {
        const osc = this.audioContext.createOscillator();
        const g = this.audioContext.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq * h.r, now);

        g.gain.setValueAtTime(0.001, now);
        g.gain.linearRampToValueAtTime(h.g, now + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, now + h.d);

        osc.connect(g);
        g.connect(master);
        osc.start(now);
        osc.stop(now + h.d);
      });
    } catch (e) {
      console.warn('Synth error:', e);
    }
  }

  /**
   * 432Hz Om ambient drone
   */
  toggleAmbient(type = 'drone') {
    if (this.isPlayingAmbient) {
      this.stopAmbient();
      return false;
    } else {
      this.startAmbient(type);
      return true;
    }
  }

  startAmbient(type = 'drone') {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.audioContext) return;
    this.stopAmbient();

    try {
      this.ambientGain = this.audioContext.createGain();
      this.ambientGain.gain.setValueAtTime(0.001, this.audioContext.currentTime);
      this.ambientGain.gain.exponentialRampToValueAtTime(0.12, this.audioContext.currentTime + 2.0);
      this.ambientGain.connect(this.audioContext.destination);

      const freqs = [108, 162, 216, 324];
      this.ambientNodes = freqs.map((f, i) => {
        const osc = this.audioContext.createOscillator();
        const g = this.audioContext.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, this.audioContext.currentTime);
        g.gain.setValueAtTime(0.06 / (i + 1), this.audioContext.currentTime);
        osc.connect(g);
        g.connect(this.ambientGain);
        osc.start();
        return { osc, g };
      });

      this.isPlayingAmbient = true;
    } catch (e) {
      console.warn('Ambient drone error:', e);
    }
  }

  stopAmbient() {
    if (this.ambientGain && this.audioContext) {
      try {
        this.ambientGain.gain.exponentialRampToValueAtTime(0.0001, this.audioContext.currentTime + 1.0);
        setTimeout(() => {
          if (this.ambientNodes) {
            this.ambientNodes.forEach(n => {
              try { n.osc.stop(); } catch(e){}
            });
            this.ambientNodes = null;
          }
        }, 1100);
      } catch (e) {}
    }
    this.isPlayingAmbient = false;
  }
}

window.zenAudio = new ZenAudio();
