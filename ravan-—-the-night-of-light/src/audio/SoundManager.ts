/**
 * Procedural Web Audio Sound Engine for "RAVAN — THE NIGHT OF LIGHT"
 * Zero external audio file dependencies. Rich, expressive, cinematic Indian festival soundscape.
 */

class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  
  // Continuous ambient loops / generators
  private ambienceOsc1: OscillatorNode | null = null;
  private ambienceOsc2: OscillatorNode | null = null;
  private fireGainNode: GainNode | null = null;
  private fireNoiseNode: AudioBufferSourceNode | null = null;
  private isFirePlaying: boolean = false;
  private musicInterval: number | null = null;
  private isMusicPlaying: boolean = false;
  private initialized: boolean = false;

  public init() {
    if (this.initialized && this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      // Master output
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.85, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Sub-busses
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(0.5, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      this.ambientGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.startAmbience();
      this.startFestivalMusic();
      this.initialized = true;
    } catch (e) {
      console.warn('Web Audio not supported or blocked:', e);
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.85, this.ctx.currentTime, 0.05);
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  // --- AMBIENT SOUNDSCAPE ---
  private startAmbience() {
    if (!this.ctx || !this.ambientGain) return;

    // Tanpura-like drone foundation (C# / G# root fifths)
    const droneFreq1 = 138.59; // C#3
    const droneFreq2 = 207.65; // G#3

    const osc1 = this.ctx.createOscillator();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(droneFreq1, this.ctx.currentTime);

    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(droneFreq2, this.ctx.currentTime);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, this.ctx.currentTime);

    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.15, this.ctx.currentTime);
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(0.04, this.ctx.currentTime);

    const droneGain = this.ctx.createGain();
    droneGain.gain.setValueAtTime(0.08, this.ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(droneGain.gain);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(droneGain);
    droneGain.connect(this.ambientGain);

    osc1.start();
    osc2.start();
    lfo.start();

    this.ambienceOsc1 = osc1;
    this.ambienceOsc2 = osc2;

    // Periodic gentle chimes / bell sprinkles
    setInterval(() => {
      if (Math.random() < 0.4 && !this.isMuted && this.ctx) {
        this.playWindChime();
      }
    }, 4500);
  }

  private playWindChime() {
    if (!this.ctx || !this.ambientGain) return;
    const chimeFreqs = [1108.73, 1318.51, 1661.22, 1975.53, 2217.46]; // Raag Yaman / Bhupali notes
    const freq = chimeFreqs[Math.floor(Math.random() * chimeFreqs.length)];

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    const t = this.ctx.currentTime;
    gain.gain.setValueAtTime(0.02, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 2.5);

    osc.connect(gain);
    gain.connect(this.ambientGain);

    osc.start(t);
    osc.stop(t + 2.6);
  }

  // --- PROCEDURAL FESTIVAL BANSURI & STRINGS MUSIC ---
  private startFestivalMusic() {
    if (this.isMusicPlaying || !this.ctx) return;
    this.isMusicPlaying = true;

    // Raag Bhupali pentatonic scale notes: C#4, D#4, F#4, G#4, A#4, C#5, D#5, F#5
    const notes = [277.18, 311.13, 369.99, 415.30, 466.16, 554.37, 622.25, 739.99];
    let step = 0;

    const melodyPhrase = [
      0, 1, 3, 4, 3, 1, 0, 2,
      4, 5, 4, 3, 4, 2, 1, 0,
      1, 3, 5, 6, 5, 3, 4, 3,
      7, 6, 5, 4, 3, 1, 0, 0
    ];

    this.musicInterval = window.setInterval(() => {
      if (!this.ctx || !this.musicGain || this.isMuted) return;

      const noteIdx = melodyPhrase[step % melodyPhrase.length];
      const freq = notes[noteIdx];
      this.playFluteNote(freq, 0.45);

      // Light rhythm pulse on even beats
      if (step % 4 === 0) {
        this.playTablaStroke(80, 0.25);
      } else if (step % 2 === 0) {
        this.playTablaStroke(140, 0.15);
      }

      step++;
    }, 480);
  }

  private playFluteNote(freq: number, duration: number) {
    if (!this.ctx || !this.musicGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    // Warm breathy flute with soft harmonics
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, t);
    // Subtle vibrato
    const vib = this.ctx.createOscillator();
    vib.frequency.setValueAtTime(5.5, t);
    const vibGain = this.ctx.createGain();
    vibGain.gain.setValueAtTime(freq * 0.015, t);
    vib.connect(osc.frequency);
    vib.start(t);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(freq * 3.5, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.08, t + 0.08); // Soft breath attack
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    osc.start(t);
    osc.stop(t + duration);
    vib.stop(t + duration);
  }

  private playTablaStroke(freq: number, decay: number) {
    if (!this.ctx || !this.musicGain) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq * 1.5, t);
    osc.frequency.exponentialRampToValueAtTime(freq, t + 0.06);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.05, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + decay);

    osc.connect(gain);
    gain.connect(this.musicGain);

    osc.start(t);
    osc.stop(t + decay);
  }

  // --- BOW INTERACTIONS ---
  private activeDrawOsc: OscillatorNode | null = null;
  private activeDrawGain: GainNode | null = null;

  public startBowDraw() {
    if (!this.ctx || !this.sfxGain || this.activeDrawOsc) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(90, t);
    osc.frequency.linearRampToValueAtTime(260, t + 1.2); // Tension rising

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(300, t);
    filter.frequency.linearRampToValueAtTime(800, t + 1.2);
    filter.Q.setValueAtTime(4.0, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(0.09, t + 0.6);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    this.activeDrawOsc = osc;
    this.activeDrawGain = gain;
  }

  public stopBowDraw() {
    if (this.activeDrawOsc && this.activeDrawGain && this.ctx) {
      const t = this.ctx.currentTime;
      this.activeDrawGain.gain.setTargetAtTime(0, t, 0.04);
      try {
        this.activeDrawOsc.stop(t + 0.1);
      } catch {
        // Ignored
      }
      this.activeDrawOsc = null;
      this.activeDrawGain = null;
    }
  }

  public playBowRelease() {
    this.stopBowDraw();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    // Crisp string snap
    const snapOsc = this.ctx.createOscillator();
    snapOsc.type = 'triangle';
    snapOsc.frequency.setValueAtTime(440, t);
    snapOsc.frequency.exponentialRampToValueAtTime(80, t + 0.12);

    const snapGain = this.ctx.createGain();
    snapGain.gain.setValueAtTime(0.35, t);
    snapGain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

    // Subtle twang harmonic
    const twangOsc = this.ctx.createOscillator();
    twangOsc.type = 'sine';
    twangOsc.frequency.setValueAtTime(180, t);
    twangOsc.frequency.linearRampToValueAtTime(120, t + 0.25);

    const twangGain = this.ctx.createGain();
    twangGain.gain.setValueAtTime(0.2, t);
    twangGain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

    snapOsc.connect(snapGain);
    snapGain.connect(this.sfxGain);
    twangOsc.connect(twangGain);
    twangGain.connect(this.sfxGain);

    snapOsc.start(t);
    snapOsc.stop(t + 0.15);
    twangOsc.start(t);
    twangOsc.stop(t + 0.3);
  }

  // --- ARROW FLIGHT ---
  public playArrowFlight() {
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    // Air whoosh
    const bufferSize = this.ctx.sampleRate * 1.5;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(400, t);
    filter.frequency.linearRampToValueAtTime(1200, t + 0.7);
    filter.frequency.linearRampToValueAtTime(300, t + 1.4);
    filter.Q.setValueAtTime(3.0, t);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.05, t);
    noiseGain.gain.linearRampToValueAtTime(0.18, t + 0.5);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 1.5);

    // Golden magical shimmer pitch
    const shimmer = this.ctx.createOscillator();
    shimmer.type = 'sine';
    shimmer.frequency.setValueAtTime(880, t);
    shimmer.frequency.linearRampToValueAtTime(1760, t + 1.4);

    const shimmerGain = this.ctx.createGain();
    shimmerGain.gain.setValueAtTime(0.03, t);
    shimmerGain.gain.linearRampToValueAtTime(0.08, t + 0.6);
    shimmerGain.gain.exponentialRampToValueAtTime(0.001, t + 1.4);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);

    shimmer.connect(shimmerGain);
    shimmerGain.connect(this.sfxGain);

    noise.start(t);
    noise.stop(t + 1.5);
    shimmer.start(t);
    shimmer.stop(t + 1.5);
  }

  // --- ARROW IMPACT ---
  public playImpact() {
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    // 1. Seismic Sub-bass drop (30Hz thundering punch)
    const subOsc = this.ctx.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(160, t);
    subOsc.frequency.exponentialRampToValueAtTime(28, t + 0.9);

    const subGain = this.ctx.createGain();
    subGain.gain.setValueAtTime(0.85, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 1.1);

    // 2. High-impact explosive thunder crack
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.4);
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      noiseData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.08));
    }
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(800, t);
    noiseFilter.frequency.exponentialRampToValueAtTime(120, t + 0.35);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.45, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);
    noiseSource.start(t);

    // 3. Sacred Temple Gong / Shankh Resonance
    const bellOsc = this.ctx.createOscillator();
    bellOsc.type = 'triangle';
    bellOsc.frequency.setValueAtTime(554.37, t); // C#5

    const bellGain = this.ctx.createGain();
    bellGain.gain.setValueAtTime(0.35, t);
    bellGain.gain.exponentialRampToValueAtTime(0.001, t + 2.4);

    // High celestial shimmer
    const chime2 = this.ctx.createOscillator();
    chime2.type = 'sine';
    chime2.frequency.setValueAtTime(1108.73, t); // C#6
    const chime2Gain = this.ctx.createGain();
    chime2Gain.gain.setValueAtTime(0.25, t);
    chime2Gain.gain.exponentialRampToValueAtTime(0.001, t + 2.0);

    subOsc.connect(subGain);
    subGain.connect(this.sfxGain);

    bellOsc.connect(bellGain);
    bellGain.connect(this.sfxGain);

    chime2.connect(chime2Gain);
    chime2Gain.connect(this.sfxGain);

    subOsc.start(t);
    subOsc.stop(t + 1.15);
    bellOsc.start(t);
    bellOsc.stop(t + 2.5);
    chime2.start(t);
    chime2.stop(t + 2.1);
  }

  // --- HEAD IGNITION BURST ---
  public playHeadIgnite(headIndex: number) {
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    // Ascending whoosh and crack
    const baseFreq = 220 + headIndex * 40;
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(baseFreq, t);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 2.2, t + 0.35);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(900, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.45);
  }

  // --- CONTINUOUS ROARING FLAME SOUND ---
  public startFireRoar() {
    if (this.isFirePlaying || !this.ctx || !this.sfxGain) return;
    this.isFirePlaying = true;

    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      // Brown/Pinkish noise for crackling fire
      data[i] = (Math.random() * 2 - 1) * 0.7;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(550, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.25, this.ctx.currentTime + 1.5);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start();
    this.fireNoiseNode = noise;
    this.fireGainNode = gain;

    // Periodic ember crackle pops
    const crackleInterval = setInterval(() => {
      if (!this.isFirePlaying || !this.ctx) {
        clearInterval(crackleInterval);
        return;
      }
      this.playEmberPop();
    }, 180);
  }

  private playEmberPop() {
    if (!this.ctx || !this.sfxGain || Math.random() > 0.6) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800 + Math.random() * 1200, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.04, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.05);
  }

  public stopFireRoar() {
    if (this.fireGainNode && this.fireNoiseNode && this.ctx) {
      const t = this.ctx.currentTime;
      this.fireGainNode.gain.setTargetAtTime(0, t, 0.5);
      setTimeout(() => {
        try {
          this.fireNoiseNode?.stop();
        } catch {
          // ignore
        }
        this.fireNoiseNode = null;
        this.fireGainNode = null;
        this.isFirePlaying = false;
      }, 600);
    } else {
      this.isFirePlaying = false;
    }
  }

  // --- FIREWORKS SOUNDS ---
  public playFireworkLaunch() {
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    // Rising whistle
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    const startFreq = 400 + Math.random() * 150;
    osc.frequency.setValueAtTime(startFreq, t);
    osc.frequency.exponentialRampToValueAtTime(startFreq * 2.8, t + 0.85);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(0.08, t + 0.4);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.85);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.9);
  }

  public playFireworkExplosion(type: 'large' | 'medium' | 'willow' | 'burst') {
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    // Deep boom
    const boomOsc = this.ctx.createOscillator();
    boomOsc.type = 'sine';
    const startF = type === 'large' ? 100 : 160;
    boomOsc.frequency.setValueAtTime(startF, t);
    boomOsc.frequency.exponentialRampToValueAtTime(30, t + 0.8);

    const boomGain = this.ctx.createGain();
    const volume = type === 'large' ? 0.5 : 0.35;
    boomGain.gain.setValueAtTime(volume, t);
    boomGain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);

    boomOsc.connect(boomGain);
    boomGain.connect(this.sfxGain);
    boomOsc.start(t);
    boomOsc.stop(t + 1.3);

    // Crackle burst tail
    const crackleCount = type === 'willow' ? 8 : 4;
    for (let i = 0; i < crackleCount; i++) {
      const delay = 0.15 + i * 0.12 + Math.random() * 0.08;
      setTimeout(() => {
        if (!this.ctx || !this.sfxGain) return;
        const ct = this.ctx.currentTime;
        const pop = this.ctx.createOscillator();
        pop.type = 'sawtooth';
        pop.frequency.setValueAtTime(600 + Math.random() * 800, ct);

        const popGain = this.ctx.createGain();
        popGain.gain.setValueAtTime(0.06, ct);
        popGain.gain.exponentialRampToValueAtTime(0.001, ct + 0.06);

        pop.connect(popGain);
        popGain.connect(this.sfxGain);
        pop.start(ct);
        pop.stop(ct + 0.07);
      }, delay * 1000);
    }
  }

  // --- VICTORY FANFARE ---
  public playVictoryFanfare() {
    if (!this.ctx || !this.musicGain) return;

    const t = this.ctx.currentTime;
    // Regal triumphant celebratory melody chords
    const chordNotes = [
      [277.18, 369.99, 415.30, 554.37], // C# chord
      [311.13, 369.99, 466.16, 622.25], // D#m chord
      [369.99, 466.16, 554.37, 739.99], // F# major
      [415.30, 554.37, 622.25, 830.61]  // G# peak victory
    ];

    chordNotes.forEach((chord, stepIdx) => {
      const stepTime = t + stepIdx * 0.55;
      chord.forEach((freq) => {
        if (!this.ctx || !this.musicGain) return;
        const osc = this.ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, stepTime);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.001, stepTime);
        gain.gain.linearRampToValueAtTime(0.08, stepTime + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, stepTime + 1.2);

        osc.connect(gain);
        gain.connect(this.musicGain);

        osc.start(stepTime);
        osc.stop(stepTime + 1.3);
      });
    });
  }

  public reset() {
    this.stopBowDraw();
    this.stopFireRoar();
  }

  public dispose() {
    this.reset();
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
    if (this.ctx) {
      try {
        this.ctx.close();
      } catch {
        // ignore
      }
      this.ctx = null;
    }
    this.initialized = false;
  }
}

export const soundManager = new SoundManager();
