/**
 * Aware & Adhitthana Unified Sound Engine
 * Features:
 * - "Aware: Glimpses of Consciousness" original meditative soundtrack player with crossfade
 * - Stereo Web Audio API Binaural Beats synthesizer (Alpha 10Hz, Theta 5.5Hz, Beta 15Hz, Delta 2.5Hz)
 * - Procedural Oceanic Wave Swell (Brownian noise + tidal LFO)
 * - Tibetan Singing Bowl Chime & Gong (bell.wav, timeout.wav) with high-gain loudness booster
 */

class AwareSoundEngine {
  constructor() {
    this.audioContext = null;
    this.musicElement = null;

    // Binaural nodes
    this.binauralGain = null;
    this.oscLeft = null;
    this.oscRight = null;
    this.isBinauralActive = false;

    // Ocean swell nodes
    this.oceanGain = null;
    this.oceanSource = null;
    this.oceanFilter = null;
    this.isOceanActive = false;

    // State
    this.masterActive = false;
    this.isMuted = false;
    this.currentPreset = 'theta'; // Default to Theta 5.5Hz (The Aware Motif)
    this.carrierFreq = 216; // 216Hz deep oceanic bass

    this.volumes = {
      soundtrack: parseFloat(localStorage.getItem('aware_vol_music')) || 0.55,
      binaural: parseFloat(localStorage.getItem('aware_vol_binaural')) || 0.35,
      ocean: parseFloat(localStorage.getItem('aware_vol_ocean')) || 0.30
    };

    this.boostLevel = parseFloat(localStorage.getItem('adhitthana_boost_level')) || 2.5;

    this.presets = {
      alpha: {
        name: '🧘 Alpha Flow (10.0 Hz)',
        desc: 'Relaxed focus, calm technical clarity & anxiety dissolution',
        beat: 10.0,
        carrier: 216
      },
      theta: {
        name: '🌊 Theta Awareness (5.5 Hz)',
        desc: 'Deep intuition, oceanic boundary dissolution & the Aware motif',
        beat: 5.5,
        carrier: 432
      },
      beta: {
        name: '⚡ Beta Alertness (15.0 Hz)',
        desc: 'Sharp cognitive presence, rapid perception & focus',
        beat: 15.0,
        carrier: 432
      },
      delta: {
        name: '🌙 Delta Restoration (2.5 Hz)',
        desc: 'Deep stillness, mental reset & restorative peace',
        beat: 2.5,
        carrier: 136.1
      }
    };

    // Preload audio
    this.bellBuffer = null;
    this.timeoutBuffer = null;
    this.bellSrc = 'bell.wav';
    this.timeoutSrc = 'timeout.wav';
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

  // --- SOUNDTRACK PLAYER ---
  initSoundtrack() {
    if (this.musicElement) return;
    this.musicElement = new Audio('audio/aware_theme_music.mp3');
    this.musicElement.loop = true;
    this.musicElement.volume = this.volumes.soundtrack;
  }

  playMusic() {
    this.initSoundtrack();
    if (!this.musicElement) return;
    this.musicElement.volume = this.isMuted ? 0 : this.volumes.soundtrack;
    this.musicElement.play().catch(e => {
      console.warn('Autoplay waiting for user gesture:', e);
    });
  }

  pauseMusic() {
    if (this.musicElement) {
      this.musicElement.pause();
    }
  }

  setMusicVolume(vol) {
    this.volumes.soundtrack = Math.max(0, Math.min(1, vol));
    localStorage.setItem('aware_vol_music', this.volumes.soundtrack);
    if (this.musicElement && !this.isMuted) {
      this.musicElement.volume = this.volumes.soundtrack;
    }
  }

  // --- BINAURAL BEATS ENGINE ---
  startBinaural() {
    this.ensureContext();
    if (!this.audioContext) return;
    this.stopBinaural();

    const config = this.presets[this.currentPreset] || this.presets.theta;
    const carrier = this.carrierFreq || config.carrier;
    const beat = config.beat;

    const freqLeft = carrier - (beat / 2);
    const freqRight = carrier + (beat / 2);

    const now = this.audioContext.currentTime;

    this.binauralGain = this.audioContext.createGain();
    this.binauralGain.gain.setValueAtTime(0.001, now);
    const targetGain = this.isMuted ? 0.001 : (this.volumes.binaural * 0.18);
    this.binauralGain.gain.exponentialRampToValueAtTime(targetGain, now + 1.5);
    this.binauralGain.connect(this.audioContext.destination);

    const merger = this.audioContext.createChannelMerger(2);

    // Left Ear
    this.oscLeft = this.audioContext.createOscillator();
    this.oscLeft.type = 'sine';
    this.oscLeft.frequency.setValueAtTime(freqLeft, now);
    const gainLeft = this.audioContext.createGain();
    gainLeft.gain.value = 1.0;
    this.oscLeft.connect(gainLeft);
    gainLeft.connect(merger, 0, 0);

    // Right Ear
    this.oscRight = this.audioContext.createOscillator();
    this.oscRight.type = 'sine';
    this.oscRight.frequency.setValueAtTime(freqRight, now);
    const gainRight = this.audioContext.createGain();
    gainRight.gain.value = 1.0;
    this.oscRight.connect(gainRight);
    gainRight.connect(merger, 0, 1);

    merger.connect(this.binauralGain);

    this.oscLeft.start(now);
    this.oscRight.start(now);
    this.isBinauralActive = true;
  }

  stopBinaural() {
    if (!this.isBinauralActive) return;
    try {
      const now = this.audioContext.currentTime;
      if (this.binauralGain) {
        this.binauralGain.gain.setValueAtTime(Math.max(0.0001, this.binauralGain.gain.value), now);
        this.binauralGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
      }
      setTimeout(() => {
        if (this.oscLeft) { try { this.oscLeft.stop(); this.oscLeft.disconnect(); } catch(e){} }
        if (this.oscRight) { try { this.oscRight.stop(); this.oscRight.disconnect(); } catch(e){} }
        this.isBinauralActive = false;
      }, 650);
    } catch (e) {
      this.isBinauralActive = false;
    }
  }

  setBinauralVolume(vol) {
    this.volumes.binaural = Math.max(0, Math.min(1, vol));
    localStorage.setItem('aware_vol_binaural', this.volumes.binaural);
    if (this.binauralGain && this.audioContext && this.isBinauralActive && !this.isMuted) {
      this.binauralGain.gain.setTargetAtTime(this.volumes.binaural * 0.18, this.audioContext.currentTime, 0.1);
    }
  }

  // --- PROCEDURAL OCEAN TIDAL SWELL ---
  startOceanSwell() {
    this.ensureContext();
    if (!this.audioContext) return;
    this.stopOceanSwell();

    const bufferSize = 3 * this.audioContext.sampleRate;
    const noiseBuffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = output[i];
      output[i] *= 3.2;
    }

    this.oceanSource = this.audioContext.createBufferSource();
    this.oceanSource.buffer = noiseBuffer;
    this.oceanSource.loop = true;

    this.oceanFilter = this.audioContext.createBiquadFilter();
    this.oceanFilter.type = 'lowpass';
    this.oceanFilter.frequency.setValueAtTime(340, this.audioContext.currentTime);

    const lfo = this.audioContext.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.08, this.audioContext.currentTime); // ~12 sec tide swell

    const lfoGain = this.audioContext.createGain();
    lfoGain.gain.value = 0.15;
    lfo.connect(lfoGain.gain);

    this.oceanGain = this.audioContext.createGain();
    const targetGain = this.isMuted ? 0.001 : (this.volumes.ocean * 0.22);
    this.oceanGain.gain.setValueAtTime(targetGain, this.audioContext.currentTime);

    this.oceanSource.connect(this.oceanFilter);
    this.oceanFilter.connect(this.oceanGain);
    this.oceanGain.connect(this.audioContext.destination);

    this.oceanSource.start();
    lfo.start();
    this.isOceanActive = true;
  }

  stopOceanSwell() {
    if (!this.isOceanActive) return;
    try {
      if (this.oceanSource) {
        this.oceanSource.stop();
        this.oceanSource.disconnect();
      }
      this.isOceanActive = false;
    } catch (e) {
      this.isOceanActive = false;
    }
  }

  setOceanVolume(vol) {
    this.volumes.ocean = Math.max(0, Math.min(1, vol));
    localStorage.setItem('aware_vol_ocean', this.volumes.ocean);
    if (this.oceanGain && this.audioContext && this.isOceanActive && !this.isMuted) {
      this.oceanGain.gain.setTargetAtTime(this.volumes.ocean * 0.22, this.audioContext.currentTime, 0.1);
    }
  }

  setPreset(presetKey) {
    if (this.presets[presetKey]) {
      this.currentPreset = presetKey;
      if (this.masterActive && this.isBinauralActive) {
        this.startBinaural();
      }
    }
  }

  setCarrier(freq) {
    this.carrierFreq = parseFloat(freq) || 216;
    if (this.masterActive && this.isBinauralActive) {
      this.startBinaural();
    }
  }

  toggleMaster(forceState) {
    this.masterActive = typeof forceState === 'boolean' ? forceState : !this.masterActive;
    this.ensureContext();

    if (this.masterActive) {
      this.playMusic();
      this.startBinaural();
      this.startOceanSwell();
    } else {
      this.pauseMusic();
      this.stopBinaural();
      this.stopOceanSwell();
    }
    return this.masterActive;
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.musicElement) {
      this.musicElement.volume = this.isMuted ? 0 : this.volumes.soundtrack;
    }
    if (this.binauralGain && this.audioContext) {
      this.binauralGain.gain.setValueAtTime(this.isMuted ? 0 : this.volumes.binaural * 0.18, this.audioContext.currentTime);
    }
    if (this.oceanGain && this.audioContext) {
      this.oceanGain.gain.setValueAtTime(this.isMuted ? 0 : this.volumes.ocean * 0.22, this.audioContext.currentTime);
    }
    return this.isMuted;
  }

  // --- STILLNESS BELL & GONG CHIMES ---
  async playBowl(pitch = 216, duration = 6.0) {
    if (this.isMuted) return;
    try {
      const snd = new Audio(this.bellSrc);
      snd.volume = 1.0;
      snd.play().catch(() => {});
    } catch (e) {}
  }

  async playTimeOutChime() {
    if (this.isMuted) return;
    try {
      const snd = new Audio(this.timeoutSrc);
      snd.volume = 1.0;
      snd.play().catch(() => {});
    } catch (e) {}
  }

  async playSuccessFanfare() {
    if (this.isMuted) return;
    this.playBowl(216, 5.5);
    setTimeout(() => this.playBowl(288, 5.5), 1400);
    setTimeout(() => this.playBowl(432, 6.5), 2800);
  }
}

window.zenAudio = new AwareSoundEngine();
