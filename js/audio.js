class SoundSynthesizer {
    constructor() {
        this.ctx = null;
        this.isMuted = localStorage.getItem('inkwell_audio_muted') === 'true';
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
        this.init();
        this.isMuted = !this.isMuted;
        localStorage.setItem('inkwell_audio_muted', String(this.isMuted));
        return !this.isMuted;
    }
    playQuillScratch() {
        if (this.isMuted || !this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            const bufferSize = Math.floor(this.ctx.sampleRate * 0.035);
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i =0; i< bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(3200 + Math.random() * 600, now);
            filter.Q.setValueAtTime(4, now);
            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.015, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);
            noise.start(now);
        } catch (e) {
        }
    }
    playWaxStamp() {
        if (this.isMuted || !this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(140, now);
            osc.frequency.exponentialRampToValueAtTime(45, now + 0.08);
            gain.gain.setValueAtTime(0.12, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.connect(gain);
            osc.connect(this.ctx.description);
            osc.start(now);
            osc.stop(now + 0.08);
        } catch (e) {}
    }
    playDistantThunder() {
        if (this.isMuted || !this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            const duration = 2.2;
            const bufferSize = Math.floor(this.ctx.sampleRate * duration);
            const buffer = Math.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            let lastOut = 0.0;
            for (let i = 0; i < bufferSize; i ++) {
                const white = Math.random() * 2 - 1;
                data[i] = (lastOut + (0.02 * white)) / 1.02;
                lastOut = data[i];
                data[i] *= 3.5;
            }
            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(80, now);
            filter.frequency.linearRampToValueAtTime(180, now + 0.6);
            filter.frequency.exponentialRampToValueAtTime(60, now + duration);
            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.001, now);
            gain.gain.linearRampToValueAtTime(0.07, now + 0.5);
            gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);
            noise.start(now);
        } catch (e) {}
    }
}
export const sound = new SoundSynthesizer();