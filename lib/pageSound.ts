"use client";

class PageSoundEngine {
  private ctx: AudioContext | null = null;
  private lastPlayTime = 0;

  private getAudioContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public playPageTurnSound() {
    try {
      const now = Date.now();
      // Debounce rapid clicks within 120ms to keep sound crisp
      if (now - this.lastPlayTime < 120) return;
      this.lastPlayTime = now;

      const ctx = this.getAudioContext();
      if (!ctx) return;

      const duration = 0.12; // 120ms subtle paper rustle
      const sampleRate = ctx.sampleRate;
      const bufferSize = Math.floor(sampleRate * duration);
      const buffer = ctx.createBuffer(1, bufferSize, sampleRate);
      const data = buffer.getChannelData(0);

      // Generate organic paper friction curve
      for (let i = 0; i < bufferSize; i++) {
        const t = i / bufferSize;
        const envelope = Math.sin(t * Math.PI) * (1 - t * 0.4);
        data[i] = (Math.random() * 2 - 1) * envelope;
      }

      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = buffer;

      // Bandpass filter tuned to crisp book paper rustle
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(1400, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(750, ctx.currentTime + duration);
      filter.Q.setValueAtTime(2.2, ctx.currentTime);

      // Subtle 12-15% volume gain
      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0.01, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.14, ctx.currentTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      noiseSource.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);

      noiseSource.start();
    } catch {
      // Silently continue if audio context is blocked
    }
  }
}

export const pageSound = new PageSoundEngine();

