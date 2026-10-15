/**
 * AudioSynth: Pure Web Audio API Synthesizer
 * Generates authentic multi-harmonic Tibetan singing bowl bells and ambient drones
 * Zero external audio files required. Works completely offline.
 */
class ZenAudio {
  constructor() {
    this.ctx = null;
    this.ambientGain = null;
    this.ambientSource = null;
    this.isMuted = false;
    this.isPlayingAmbient = false;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
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
   * Synthesize a multi-harmonic Tibetan Singing Bowl chime
   * @param {number} pitch - base frequency (default 216Hz)
   * @param {number} duration - decay length in seconds
   */
  playBowl(pitch = 216, duration = 8) {
    if (this.isMuted) return;
    this.init();

    const now = this.ctx.currentTime;

    // Frequencies of a traditional hammered bronze singing bowl
    const harmonics = [
      { ratio: 1.0, gain: 0.5, decay: duration },
      { ratio: 2.76, gain: 0.35, decay: duration * 0.8 },
      { ratio: 5.4, gain: 0.18, decay: duration * 0.6 },
      { ratio: 8.9, gain: 0.08, decay: duration * 0.4 },
      { ratio: 1.01, gain: 0.25, decay: duration * 0.9 } // Beating interference
    ];

    const masterGain = this.ctx.createGain();
    masterGain.gain.setValueAtTime(0.7, now);
    masterGain.connect(this.ctx.destination);

    // Initial strike noise impulse (striker hitting bronze)
    this.playStrikeImpulse(now, masterGain);

    harmonics.forEach(h => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(pitch * h.ratio, now);

      // Subtle pitch vibrato (subtle warmth of metal resonance)
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.setValueAtTime(1.8 + Math.random() * 0.8, now);
      lfoGain.gain.setValueAtTime(pitch * 0.004, now);
      lfo.connect(osc.frequency);
      lfo.start(now);
      lfo.stop(now + h.decay);

      // Envelope: instant strike, slow exponential decay
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(h.gain, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + h.decay);

      osc.connect(gain);
      gain.connect(masterGain);

      osc.start(now);
      osc.stop(now + h.decay);
    });
  }

  /**
   * Felt/wooden striker contact click
   */
  playStrikeImpulse(startTime, destination) {
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.04);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.15));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, startTime);
    filter.Q.setValueAtTime(3, startTime);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.2, startTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.04);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(destination);

    noise.start(startTime);
  }

  /**
   * Sound effect for the "Time Out / Moved" action
   * A gentle grounding deep chime
   */
  playTimeOutChime() {
    if (this.isMuted) return;
    this.playBowl(144, 5); // Low grounding tone
  }

  /**
   * Sound effect for completing a full Strong Determination Sit without moving
   * Three ascending golden chimes
   */
  playSuccessFanfare() {
    if (this.isMuted) return;
    this.playBowl(216, 7);
    setTimeout(() => this.playBowl(288, 8), 1200);
    setTimeout(() => this.playBowl(432, 10), 2400);
  }

  /**
   * Deep 432Hz Om / Zen ambient drone
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
    this.init();
    this.stopAmbient();

    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
    this.ambientGain.gain.exponentialRampToValueAtTime(0.10, this.ctx.currentTime + 2.5);
    this.ambientGain.connect(this.ctx.destination);

    if (type === 'drone') {
      const freqs = [108, 162, 216, 324];
      this.ambientNodes = freqs.map((f, i) => {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, this.ctx.currentTime);
        g.gain.setValueAtTime(0.05 / (i + 1), this.ctx.currentTime);
        osc.connect(g);
        g.connect(this.ambientGain);
        osc.start();
        return { osc, g };
      });
    } else {
      const bufferSize = this.ctx.sampleRate * 2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = data[i];
        data[i] *= 3.0;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, this.ctx.currentTime);

      noise.connect(filter);
      filter.connect(this.ambientGain);
      noise.start();
      this.ambientSource = noise;
    }

    this.isPlayingAmbient = true;
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
          if (this.ambientSource) {
            try { this.ambientSource.stop(); } catch(e){}
            this.ambientSource = null;
          }
        }, 1300);
      } catch (e) {}
    }
    this.isPlayingAmbient = false;
  }
}

window.zenAudio = new ZenAudio();
