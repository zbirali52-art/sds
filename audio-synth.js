/**
 * ZenAudio: Ultra-Reliable Audio Synthesizer & Fallback Chime Engine
 * Solves browser autoplay/AudioContext suspension restrictions in Chrome & mobile.
 * Features:
 * 1. Asynchronous context resume on user interaction
 * 2. Harmonic bronze Tibetan singing bowl synthesis
 * 3. In-memory procedural WAV chime fallback for instant playback
 * 4. Ambient 432Hz Om drone generator
 */
class ZenAudio {
  constructor() {
    this.ctx = null;
    this.ambientGain = null;
    this.ambientNodes = null;
    this.ambientSource = null;
    this.isMuted = false;
    this.isPlayingAmbient = false;
    this.isUnlocked = false;

    // Generate in-memory fallback WAV audio element
    this.fallbackAudio = this.createFallbackChimeAudio();

    // Auto-unlock on first user interaction anywhere on the document
    this.bindUnlockGesture();
  }

  bindUnlockGesture() {
    const unlock = async () => {
      await this.ensureContext();
      this.isUnlocked = true;
      ['click', 'touchstart', 'keydown'].forEach(evt => {
        document.removeEventListener(evt, unlock);
      });
    };

    ['click', 'touchstart', 'keydown'].forEach(evt => {
      document.addEventListener(evt, unlock, { once: true, passive: true });
    });
  }

  async ensureContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume();
      } catch (e) {
        console.warn('AudioContext resume deferred:', e);
      }
    }
    return this.ctx;
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted && this.isPlayingAmbient) {
      this.stopAmbient();
    }
    return this.isMuted;
  }

  /**
   * Primary Tibetan Singing Bowl Chime
   */
  async playBowl(pitch = 216, duration = 6.5) {
    if (this.isMuted) return;

    await this.ensureContext();

    if (this.ctx && this.ctx.state === 'running') {
      try {
        this.synthesizeBowl(pitch, duration);
        return;
      } catch (e) {
        console.warn('Web Audio synthesis error, falling back to audio element:', e);
      }
    }

    // Fallback: play synthesized HTML5 Audio
    this.playFallbackAudio();
  }

  /**
   * Synthesize harmonic bronze bowl with beating resonance
   */
  synthesizeBowl(pitch, duration) {
    const now = this.ctx.currentTime + 0.02;

    const masterGain = this.ctx.createGain();
    masterGain.gain.setValueAtTime(0.85, now);
    masterGain.connect(this.ctx.destination);

    // Initial strike metallic impulse
    this.playStrikeImpulse(now, masterGain);

    // Traditional hammered bronze harmonics (fundamental + overtones + beating)
    const harmonics = [
      { ratio: 1.0, gain: 0.60, decay: duration },
      { ratio: 1.008, gain: 0.35, decay: duration * 0.95 }, // Acoustic beating
      { ratio: 2.76, gain: 0.40, decay: duration * 0.75 },
      { ratio: 5.40, gain: 0.22, decay: duration * 0.55 },
      { ratio: 8.92, gain: 0.12, decay: duration * 0.35 }
    ];

    harmonics.forEach(h => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(pitch * h.ratio, now);

      // Warm metal vibrato
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.setValueAtTime(2.2, now);
      lfoGain.gain.setValueAtTime(pitch * 0.005, now);
      lfo.connect(osc.frequency);
      lfo.start(now);
      lfo.stop(now + h.decay);

      // Volume envelope: instant strike, slow exponential decay
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(h.gain, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + h.decay);

      osc.connect(gain);
      gain.connect(masterGain);

      osc.start(now);
      osc.stop(now + h.decay);
    });
  }

  playStrikeImpulse(startTime, destination) {
    try {
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.03);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(750, startTime);
      filter.Q.setValueAtTime(4, startTime);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.25, startTime);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.03);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(destination);

      noise.start(startTime);
    } catch (e) {}
  }

  /**
   * Sound effect for the "Time Out / Moved" action
   */
  async playTimeOutChime() {
    if (this.isMuted) return;
    await this.playBowl(144, 4.5); // Deep grounding tone
  }

  /**
   * Sound effect for completing a full Strong Determination Sit without moving
   */
  async playSuccessFanfare() {
    if (this.isMuted) return;
    await this.playBowl(216, 6);
    setTimeout(() => this.playBowl(288, 7), 1000);
    setTimeout(() => this.playBowl(432, 9), 2000);
  }

  /**
   * Generates a 4-second WAV chime Data URI in memory for bulletproof fallback
   */
  createFallbackChimeAudio() {
    try {
      const sampleRate = 22050;
      const duration = 3.5;
      const totalSamples = Math.floor(sampleRate * duration);
      const data = new Int16Array(totalSamples);

      for (let i = 0; i < totalSamples; i++) {
        const t = i / sampleRate;
        const decay = Math.exp(-t * 1.4);
        const s1 = Math.sin(2 * Math.PI * 216 * t) * 0.5;
        const s2 = Math.sin(2 * Math.PI * 218 * t) * 0.3;
        const s3 = Math.sin(2 * Math.PI * 588 * t) * 0.25;
        const s4 = Math.sin(2 * Math.PI * 1084 * t) * 0.15;
        const val = Math.max(-1, Math.min(1, (s1 + s2 + s3 + s4) * decay));
        data[i] = val < 0 ? val * 0x8000 : val * 0x7FFF;
      }

      // WAV Header
      const buffer = new ArrayBuffer(44 + data.length * 2);
      const view = new DataView(buffer);
      const writeStr = (offset, str) => {
        for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
      };

      writeStr(0, 'RIFF');
      view.setUint32(4, 36 + data.length * 2, true);
      writeStr(8, 'WAVE');
      writeStr(12, 'fmt ');
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true); // PCM
      view.setUint16(22, 1, true); // Mono
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate * 2, true);
      view.setUint16(32, 2, true);
      view.setUint16(34, 16, true);
      writeStr(36, 'data');
      view.setUint32(40, data.length * 2, true);

      // Samples
      for (let i = 0; i < data.length; i++) {
        view.setInt16(44 + i * 2, data[i], true);
      }

      const blob = new Blob([buffer], { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      audio.volume = 0.9;
      return audio;
    } catch (e) {
      return null;
    }
  }

  playFallbackAudio() {
    if (this.fallbackAudio) {
      try {
        this.fallbackAudio.currentTime = 0;
        this.fallbackAudio.play().catch(e => console.warn('Fallback play prevented:', e));
      } catch (e) {}
    }
  }

  /**
   * 432Hz Om / Zen ambient drone
   */
  async toggleAmbient(type = 'drone') {
    if (this.isPlayingAmbient) {
      this.stopAmbient();
      return false;
    } else {
      await this.startAmbient(type);
      return true;
    }
  }

  async startAmbient(type = 'drone') {
    if (this.isMuted) return;
    await this.ensureContext();
    if (!this.ctx) return;
    this.stopAmbient();

    try {
      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      this.ambientGain.gain.exponentialRampToValueAtTime(0.12, this.ctx.currentTime + 2.5);
      this.ambientGain.connect(this.ctx.destination);

      const freqs = [108, 162, 216, 324];
      this.ambientNodes = freqs.map((f, i) => {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, this.ctx.currentTime);
        g.gain.setValueAtTime(0.06 / (i + 1), this.ctx.currentTime);
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
    if (this.ambientGain && this.ctx) {
      try {
        this.ambientGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 1.2);
        setTimeout(() => {
          if (this.ambientNodes) {
            this.ambientNodes.forEach(n => {
              try { n.osc.stop(); } catch(e){}
            });
            this.ambientNodes = null;
          }
        }, 1300);
      } catch (e) {}
    }
    this.isPlayingAmbient = false;
  }
}

window.zenAudio = new ZenAudio();
