class AudioManager {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;

  private init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
  }

  public setMuted(muted: boolean) {
    this.muted = muted;
  }

  public play(name: 'bow_draw' | 'bow_shoot' | 'target_hit' | 'target_miss' | 'ui_click') {
    if (this.muted) return;
    try {
      this.init();
      if (!this.ctx) return;
      
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      
      const t = this.ctx.currentTime;

      switch(name) {
        case 'ui_click': {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(600, t);
          osc.frequency.exponentialRampToValueAtTime(800, t + 0.05);
          
          gain.gain.setValueAtTime(0, t);
          gain.gain.linearRampToValueAtTime(0.2, t + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
          
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(t);
          osc.stop(t + 0.1);
          break;
        }
        case 'bow_shoot': {
          // White noise whoosh
          const bufferSize = this.ctx.sampleRate * 0.3; // 300ms
          const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
          const data = buffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
          }
          const noise = this.ctx.createBufferSource();
          noise.buffer = buffer;
          
          const filter = this.ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(100, t);
          filter.frequency.exponentialRampToValueAtTime(1200, t + 0.1);
          filter.frequency.exponentialRampToValueAtTime(100, t + 0.3);

          const gain = this.ctx.createGain();
          gain.gain.setValueAtTime(0, t);
          gain.gain.linearRampToValueAtTime(0.4, t + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);

          noise.connect(filter);
          filter.connect(gain);
          gain.connect(this.ctx.destination);
          noise.start(t);
          break;
        }
        case 'bow_draw': {
          // Creaking / drawing sound
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(40, t);
          osc.frequency.linearRampToValueAtTime(60, t + 0.5);
          
          gain.gain.setValueAtTime(0, t);
          gain.gain.linearRampToValueAtTime(0.1, t + 0.1);
          gain.gain.linearRampToValueAtTime(0.1, t + 0.4);
          gain.gain.linearRampToValueAtTime(0, t + 0.5);
          
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(t);
          osc.stop(t + 0.5);
          break;
        }
        case 'target_hit': {
          // Satisfying correct thud + chime
          const osc1 = this.ctx.createOscillator();
          const osc2 = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          
          osc1.type = 'triangle';
          osc1.frequency.setValueAtTime(400, t);
          osc1.frequency.exponentialRampToValueAtTime(800, t + 0.1);
          
          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(800, t + 0.1);
          osc2.frequency.exponentialRampToValueAtTime(1200, t + 0.3);

          gain.gain.setValueAtTime(0, t);
          gain.gain.linearRampToValueAtTime(0.3, t + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);

          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(this.ctx.destination);
          osc1.start(t);
          osc1.stop(t + 0.1);
          osc2.start(t + 0.1);
          osc2.stop(t + 0.3);
          break;
        }
        case 'target_miss': {
          // Dull thud
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(150, t);
          osc.frequency.exponentialRampToValueAtTime(40, t + 0.2);
          
          gain.gain.setValueAtTime(0, t);
          gain.gain.linearRampToValueAtTime(0.3, t + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
          
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(t);
          osc.stop(t + 0.2);
          break;
        }
      }
    } catch (e) {
      console.warn('Audio play failed', e);
    }
  }
}

export const audioManager = new AudioManager();
