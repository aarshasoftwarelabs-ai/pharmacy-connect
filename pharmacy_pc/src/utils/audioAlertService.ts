// Web Audio API based Alert Sound Engine for Pharmacy PC
// Works completely offline with zero external audio assets required.

class AudioAlertEngine {
  private audioCtx: AudioContext | null = null;
  private ringIntervalId: any = null;
  private isRinging: boolean = false;

  private getAudioContext(): AudioContext | null {
    try {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          this.audioCtx = new AudioContextClass();
        }
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      return this.audioCtx;
    } catch (e) {
      console.warn('Web Audio API not supported or permitted', e);
      return null;
    }
  }

  public getSettings() {
    return {
      enabled: localStorage.getItem('sound_alert_enabled') !== 'false', // default true
      volume: parseFloat(localStorage.getItem('sound_alert_volume') || '0.8'),
      tone: localStorage.getItem('sound_alert_tone') || 'BELL_CHIME', // 'BELL_CHIME' | 'URGENT_RING' | 'DIGITAL_ALERT'
      repeat: localStorage.getItem('sound_alert_repeat') !== 'false', // repeat until answered
    };
  }

  public updateSettings(settings: Partial<{ enabled: boolean; volume: number; tone: string; repeat: boolean }>) {
    if (settings.enabled !== undefined) localStorage.setItem('sound_alert_enabled', String(settings.enabled));
    if (settings.volume !== undefined) localStorage.setItem('sound_alert_volume', String(settings.volume));
    if (settings.tone !== undefined) localStorage.setItem('sound_alert_tone', settings.tone);
    if (settings.repeat !== undefined) localStorage.setItem('sound_alert_repeat', String(settings.repeat));
  }

  // Play a single ring chime sequence
  public playChime(customTone?: string) {
    const settings = this.getSettings();
    if (!settings.enabled) return;

    const ctx = this.getAudioContext();
    if (!ctx) return;

    const tone = customTone || settings.tone;
    const vol = Math.max(0.1, Math.min(1.0, settings.volume));

    if (tone === 'BELL_CHIME') {
      // Pleasant, loud dual-tone store chime (Ding-Dong ~ 880Hz then 659.25Hz)
      this.playToneSequence(ctx, [
        { freq: 880, duration: 0.35, delay: 0, gain: vol },
        { freq: 659.25, duration: 0.65, delay: 0.3, gain: vol }
      ]);
    } else if (tone === 'URGENT_RING') {
      // Urgent repeating telephone / shop alarm ring
      this.playToneSequence(ctx, [
        { freq: 950, duration: 0.12, delay: 0, gain: vol },
        { freq: 1200, duration: 0.12, delay: 0.14, gain: vol },
        { freq: 950, duration: 0.12, delay: 0.28, gain: vol },
        { freq: 1200, duration: 0.25, delay: 0.42, gain: vol }
      ]);
    } else {
      // High-pitch digital tri-tone alert
      this.playToneSequence(ctx, [
        { freq: 587.33, duration: 0.15, delay: 0, gain: vol },
        { freq: 880, duration: 0.15, delay: 0.15, gain: vol },
        { freq: 1174.66, duration: 0.4, delay: 0.3, gain: vol }
      ]);
    }
  }

  private playToneSequence(ctx: AudioContext, notes: Array<{ freq: number; duration: number; delay: number; gain: number }>) {
    const startTime = ctx.currentTime;
    notes.forEach(note => {
      try {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(note.freq, startTime + note.delay);

        // Envelope: quick attack, smooth exponential decay
        const noteStart = startTime + note.delay;
        const noteEnd = noteStart + note.duration;
        gainNode.gain.setValueAtTime(0.001, noteStart);
        gainNode.gain.exponentialRampToValueAtTime(note.gain, noteStart + 0.03);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, noteEnd);

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.start(noteStart);
        osc.stop(noteEnd);
      } catch (err) {
        console.error('Audio playback error', err);
      }
    });
  }

  // Start repeating alert ring until stopped
  public startOrderRing() {
    this.stopOrderRing();
    const settings = this.getSettings();
    if (!settings.enabled) return;

    this.isRinging = true;
    this.playChime();

    if (settings.repeat) {
      this.ringIntervalId = setInterval(() => {
        if (this.isRinging) {
          this.playChime();
        }
      }, 2500); // Ring every 2.5 seconds
    }
  }

  // Stop any active ringing
  public stopOrderRing() {
    this.isRinging = false;
    if (this.ringIntervalId) {
      clearInterval(this.ringIntervalId);
      this.ringIntervalId = null;
    }
  }

  public getIsRinging() {
    return this.isRinging;
  }

  // Quick crisp barcode scanner beep (50ms sharp high beep at 1800Hz)
  public playBarcodeBeep() {
    const ctx = this.getAudioContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(1760, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch (e) {}
  }

  // Success chime for billing complete
  public playSuccessChime() {
    const ctx = this.getAudioContext();
    if (!ctx) return;
    this.playToneSequence(ctx, [
      { freq: 523.25, duration: 0.12, delay: 0, gain: 0.4 },
      { freq: 659.25, duration: 0.12, delay: 0.12, gain: 0.4 },
      { freq: 783.99, duration: 0.35, delay: 0.24, gain: 0.5 },
    ]);
  }
}

export const AudioAlert = new AudioAlertEngine();
