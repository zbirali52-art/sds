/**
 * ZenAudio: Resilient Audio Engine with Volume Booster & Procedural Soundscapes
 * - Dynamic Range Compressor + Gain Booster (up to 300% / Super Loud)
 * - Real PCM WAV files (bell.wav, timeout.wav) decoded for amplified playback
 * - Procedural Ambient Soundscapes:
 *     1. White Noise (broad-spectrum masking)
 *     2. Pink Noise (warm 1/f calming noise)
 *     3. Gentle Rain & Thunder (raindrops & rolling sub-bass)
 *     4. Forest Wind & Nature (gentle wind through leaves)
 *     5. Tibetan Temple Om Drone (108Hz/216Hz/432Hz sacred harmonic resonance)
 */

class ZenAudio {
  constructor() {
    this.isMuted = false;
    this.boostLevel = parseFloat(localStorage.getItem('adhitthana_boost_level')) || 2.5; // 1.0 (Normal), 2.0 (Loud), 3.0 (Max Boost)
    this.ambientType = localStorage.getItem('adhitthana_ambient_type') || 'none';
    this.ambientVolume = parseFloat(localStorage.getItem('adhitthana_ambient_vol')) || 0.4;
    this.autoPlayAmbient = localStorage.getItem('adhitthana_ambient_autoplay') !== 'false';

    this.audioContext = null;
    this.compressor = null;
    this.masterGain = null;

    // Buffer cache for preloaded WAVs
    this.bellBuffer = null;
    this.timeoutBuffer = null;
    this.bellSrc = 'bell.wav';
    this.timeoutSrc = 'timeout.wav';

    // Ambient player state
    this.isPlayingAmbient = false;
    this.currentAmbientType = null;
    this.ambientMasterGain = null;
    this.activeAmbientNodes = [];

    // Auto unlock on first user interaction anywhere
    this.initUnlock();
  }

  initUnlock() {
    const unlock = () => {
      this.ensureContext();
      this.preloadBuffers();
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

        // 1. Dynamics Compressor to prevent distortion when boosted
        this.compressor = this.audioContext.createDynamicsCompressor();
        this.compressor.threshold.setValueAtTime(-14, this.audioContext.currentTime);
        this.compressor.knee.setValueAtTime(25, this.audioContext.currentTime);
        this.compressor.ratio.setValueAtTime(12, this.audioContext.currentTime);
        this.compressor.attack.setValueAtTime(0.003, this.audioContext.currentTime);
        this.compressor.release.setValueAtTime(0.25, this.audioContext.currentTime);

        // 2. Master Gain with Boost Multiplier
        this.masterGain = this.audioContext.createGain();
        this.masterGain.gain.setValueAtTime(this.boostLevel, this.audioContext.currentTime);

        // Connect Compressor -> Master Gain -> Destination
        this.compressor.connect(this.masterGain);
        this.masterGain.connect(this.audioContext.destination);

        // Ambient Gain sub-bus
        this.ambientMasterGain = this.audioContext.createGain();
        this.ambientMasterGain.gain.setValueAtTime(this.ambientVolume, this.audioContext.currentTime);
        this.ambientMasterGain.connect(this.audioContext.destination);
      }
    }

    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(() => {});
    }
  }

  async preloadBuffers() {
    if (!this.audioContext) return;
    try {
      if (!this.bellBuffer) {
        const resp = await fetch(this.bellSrc);
        const arrayBuf = await resp.arrayBuffer();
        this.bellBuffer = await this.audioContext.decodeAudioData(arrayBuf);
      }
      if (!this.timeoutBuffer) {
        const resp2 = await fetch(this.timeoutSrc);
        const arrayBuf2 = await resp2.arrayBuffer();
        this.timeoutBuffer = await this.audioContext.decodeAudioData(arrayBuf2);
      }
    } catch (e) {
      console.warn('WAV predecode warning:', e);
    }
  }

  setBoostLevel(level) {
    this.boostLevel = Math.max(1.0, Math.min(3.5, level));
    localStorage.setItem('adhitthana_boost_level', this.boostLevel);
    if (this.masterGain && this.audioContext) {
      this.masterGain.gain.setValueAtTime(this.boostLevel, this.audioContext.currentTime);
    }
  }

  setAmbientVolume(vol) {
    this.ambientVolume = Math.max(0.0, Math.min(1.0, vol));
    localStorage.setItem('adhitthana_ambient_vol', this.ambientVolume);
    if (this.ambientMasterGain && this.audioContext) {
      this.ambientMasterGain.gain.linearRampToValueAtTime(this.ambientVolume, this.audioContext.currentTime + 0.1);
    }
  }

  setAmbientType(type) {
    this.ambientType = type;
    localStorage.setItem('adhitthana_ambient_type', type);
    if (this.isPlayingAmbient) {
      if (type === 'none') {
        this.stopAmbient();
      } else {
        this.startAmbient(type);
      }
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
   * Play the resonant Tibetan Bronze Bell (Super Loud with Booster)
   */
  async playBowl(pitch = 216, duration = 6.0) {
    if (this.isMuted) return;
    this.ensureContext();

    // 1. Web Audio API with Master Gain Booster (Super Loud)
    if (this.audioContext && this.bellBuffer) {
      try {
        const source = this.audioContext.createBufferSource();
        source.buffer = this.bellBuffer;
        
        // High-presence EQ boost in 1kHz-3kHz range
        const presenceFilter = this.audioContext.createBiquadFilter();
        presenceFilter.type = 'peaking';
        presenceFilter.frequency.value = 1728;
        presenceFilter.gain.value = 4.0;

        source.connect(presenceFilter);
        presenceFilter.connect(this.compressor);
        source.start();
        return;
      } catch (e) {
        console.warn('Buffer playback error, fallback to HTML5 Audio:', e);
      }
    }

    // 2. Fallback: Native HTML5 Audio
    try {
      const snd = new Audio(this.bellSrc);
      snd.volume = 1.0;
      snd.play().catch(() => this.playSynthBowl(pitch, duration));
    } catch (e) {
      this.playSynthBowl(pitch, duration);
    }
  }

  /**
   * Play the Time Out Gong (Super Loud with Booster)
   */
  async playTimeOutChime() {
    if (this.isMuted) return;
    this.ensureContext();

    if (this.audioContext && this.timeoutBuffer) {
      try {
        const source = this.audioContext.createBufferSource();
        source.buffer = this.timeoutBuffer;
        source.connect(this.compressor);
        source.start();
        return;
      } catch (e) {}
    }

    try {
      const snd = new Audio(this.timeoutSrc);
      snd.volume = 1.0;
      snd.play().catch(() => this.playSynthBowl(144, 4.0));
    } catch (e) {
      this.playSynthBowl(144, 4.0);
    }
  }

  /**
   * Complete sit fanfare: Ascending harmonic bowl triad
   */
  async playSuccessFanfare() {
    if (this.isMuted) return;
    this.playBowl(216, 5.5);
    setTimeout(() => this.playBowl(288, 5.5), 1400);
    setTimeout(() => this.playBowl(432, 6.5), 2800);
  }

  /**
   * Synthesizer fallback if WAV is unavailable
   */
  playSynthBowl(freq, duration) {
    try {
      this.ensureContext();
      if (!this.audioContext) return;

      const now = this.audioContext.currentTime + 0.01;
      const chimeGain = this.audioContext.createGain();
      chimeGain.gain.setValueAtTime(1.0, now);
      chimeGain.connect(this.compressor);

      const harmonics = [
        { r: 1.0, g: 0.8, d: duration },
        { r: 1.008, g: 0.5, d: duration * 0.95 },
        { r: 2.76, g: 0.5, d: duration * 0.75 },
        { r: 4.12, g: 0.35, d: duration * 0.6 },
        { r: 5.42, g: 0.25, d: duration * 0.5 }
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
        g.connect(chimeGain);
        osc.start(now);
        osc.stop(now + h.d);
      });
    } catch (e) {
      console.warn('Synth bowl error:', e);
    }
  }

  /* =====================================================================
     PROCEDURAL AMBIENT SOUNDSCAPES
     Zero MB, 100% Offline, Seamless Infinite Loop
     ===================================================================== */

  startAmbient(type = null) {
    if (this.isMuted) return;
    const soundType = type || this.ambientType;
    if (!soundType || soundType === 'none') {
      this.stopAmbient();
      return;
    }

    this.ensureContext();
    if (!this.audioContext) return;
    this.stopAmbient();

    try {
      // Fade in ambient master gain
      this.ambientMasterGain.gain.setValueAtTime(0.001, this.audioContext.currentTime);
      this.ambientMasterGain.gain.exponentialRampToValueAtTime(
        Math.max(0.01, this.ambientVolume),
        this.audioContext.currentTime + 1.2
      );

      switch (soundType) {
        case 'whitenoise':
          this.createWhiteNoise();
          break;
        case 'pinknoise':
          this.createPinkNoise();
          break;
        case 'rain':
          this.createRainSound();
          break;
        case 'forest':
          this.createForestWindSound();
          break;
        case 'om':
        case 'drone':
          this.createOmDroneSound();
          break;
        default:
          this.createPinkNoise();
      }

      this.isPlayingAmbient = true;
      this.currentAmbientType = soundType;
    } catch (e) {
      console.warn('Ambient start error:', e);
    }
  }

  stopAmbient(fadeDuration = 1.0) {
    if (this.isPlayingAmbient && this.ambientMasterGain && this.audioContext) {
      try {
        const now = this.audioContext.currentTime;
        this.ambientMasterGain.gain.setValueAtTime(Math.max(0.001, this.ambientMasterGain.gain.value), now);
        this.ambientMasterGain.gain.exponentialRampToValueAtTime(0.0001, now + fadeDuration);

        setTimeout(() => {
          this.activeAmbientNodes.forEach(item => {
            try {
              if (item.source && item.source.stop) item.source.stop();
              if (item.osc && item.osc.stop) item.osc.stop();
              if (item.interval) clearInterval(item.interval);
            } catch (e) {}
          });
          this.activeAmbientNodes = [];
        }, (fadeDuration + 0.1) * 1000);
      } catch (e) {}
    }
    this.isPlayingAmbient = false;
    this.currentAmbientType = null;
  }

  /**
   * 1. Pure White Noise Generator
   */
  createWhiteNoise() {
    const bufferSize = 4 * this.audioContext.sampleRate;
    const noiseBuffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.22;
    }

    const whiteNoise = this.audioContext.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    // Gentle low-pass filter to remove harsh ultra-high hiss
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 6500;

    whiteNoise.connect(filter);
    filter.connect(this.ambientMasterGain);
    whiteNoise.start();

    this.activeAmbientNodes.push({ source: whiteNoise });
  }

  /**
   * 2. Warm Pink Noise Generator (Paul Kellet's algorithm)
   */
  createPinkNoise() {
    const bufferSize = 4 * this.audioContext.sampleRate;
    const noiseBuffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.09;
      b6 = white * 0.115926;
    }

    const pinkNoise = this.audioContext.createBufferSource();
    pinkNoise.buffer = noiseBuffer;
    pinkNoise.loop = true;

    pinkNoise.connect(this.ambientMasterGain);
    pinkNoise.start();

    this.activeAmbientNodes.push({ source: pinkNoise });
  }

  /**
   * 3. Gentle Rain & Thunder Generator
   */
  createRainSound() {
    // Rain bed: pink noise with band-pass filter
    const bufferSize = 4 * this.audioContext.sampleRate;
    const rainBuffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const output = rainBuffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      output[i] = (b0 + b1 + b2 + b3 + b4 + white * 0.4) * 0.11;
    }

    const rainSource = this.audioContext.createBufferSource();
    rainSource.buffer = rainBuffer;
    rainSource.loop = true;

    // Filter rain frequencies: 600Hz to 3200Hz
    const rainFilter = this.audioContext.createBiquadFilter();
    rainFilter.type = 'lowpass';
    rainFilter.frequency.value = 2400;

    rainSource.connect(rainFilter);
    rainFilter.connect(this.ambientMasterGain);
    rainSource.start();

    // Occasional gentle rolling thunder rumble
    const thunderOsc = this.audioContext.createOscillator();
    const thunderGain = this.audioContext.createGain();
    thunderOsc.type = 'sine';
    thunderOsc.frequency.setValueAtTime(55, this.audioContext.currentTime);
    thunderGain.gain.setValueAtTime(0.015, this.audioContext.currentTime);

    thunderOsc.connect(thunderGain);
    thunderGain.connect(this.ambientMasterGain);
    thunderOsc.start();

    // Periodic thunder swelling LFO
    const lfo = this.audioContext.createOscillator();
    const lfoGain = this.audioContext.createGain();
    lfo.frequency.setValueAtTime(0.08, this.audioContext.currentTime); // every ~12 seconds
    lfoGain.gain.setValueAtTime(0.02, this.audioContext.currentTime);
    lfo.connect(thunderGain.gain);
    lfo.start();

    this.activeAmbientNodes.push({ source: rainSource }, { osc: thunderOsc }, { osc: lfo });
  }

  /**
   * 4. Forest Wind & Nature Generator
   */
  createForestWindSound() {
    const bufferSize = 4 * this.audioContext.sampleRate;
    const windBuffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const output = windBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.18;
    }

    const windSource = this.audioContext.createBufferSource();
    windSource.buffer = windBuffer;
    windSource.loop = true;

    // Wind filter: sweeping bandpass filter simulating gentle gusts through leaves
    const windFilter = this.audioContext.createBiquadFilter();
    windFilter.type = 'bandpass';
    windFilter.frequency.setValueAtTime(400, this.audioContext.currentTime);
    windFilter.Q.value = 1.8;

    // LFO to slowly sweep wind frequency
    const lfo = this.audioContext.createOscillator();
    const lfoGain = this.audioContext.createGain();
    lfo.frequency.setValueAtTime(0.15, this.audioContext.currentTime); // gentle breathing cycle
    lfoGain.gain.setValueAtTime(220, this.audioContext.currentTime);

    lfo.connect(windFilter.frequency);
    lfo.start();

    windSource.connect(windFilter);
    windFilter.connect(this.ambientMasterGain);
    windSource.start();

    this.activeAmbientNodes.push({ source: windSource }, { osc: lfo });
  }

  /**
   * 5. Tibetan Temple Om Drone (108Hz, 216Hz, 432Hz sacred harmony)
   */
  createOmDroneSound() {
    const now = this.audioContext.currentTime;
    const freqs = [
      { f: 108, g: 0.14 },  // Sacred Vedic 108Hz
      { f: 162, g: 0.08 },  // Fifth harmonic
      { f: 216, g: 0.10 },  // Octave
      { f: 432, g: 0.07 }   // Sacred 432Hz
    ];

    freqs.forEach((item, idx) => {
      const osc = this.audioContext.createOscillator();
      const oscGain = this.audioContext.createGain();
      osc.type = 'sine';
      // Slight detune for rich choral chorus effect
      const detune = (idx % 2 === 0 ? 0.8 : -0.8) * (idx + 1);
      osc.frequency.setValueAtTime(item.f + detune, now);
      oscGain.gain.setValueAtTime(item.g, now);

      osc.connect(oscGain);
      oscGain.connect(this.ambientMasterGain);
      osc.start(now);

      this.activeAmbientNodes.push({ osc });
    });
  }
}

window.zenAudio = new ZenAudio();
