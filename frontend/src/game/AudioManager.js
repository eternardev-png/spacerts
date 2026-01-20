export class AudioManager {
    constructor() {
        this.ctx = null;
        this.masterVolume = 0.3;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        try {
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
            this.initialized = true;
            console.log("Audio Initialized");
        } catch (e) {
            console.error("Web Audio API not supported", e);
        }
    }

    play(soundId) {
        if (!this.initialized) this.init();
        if (!this.ctx) return;

        switch (soundId) {
            case 'shoot': this.playShoot(); break;
            case 'explode': this.playExplosion(); break;
            case 'select': this.playBlip(600, 0.1); break;
            case 'powerup': this.playPowerUp(); break;
            case 'warning': this.playAlarm(); break;
            case 'gamestart': this.playChord([261.63, 329.63, 392.00], 1.0); break; // C Major
            case 'gameover': this.playChord([220.00, 196.00, 185.00], 2.0); break; // Sad
        }
    }

    // --- Synths ---

    playShoot() {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.frequency.setValueAtTime(800, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.2);

        gain.gain.setValueAtTime(this.masterVolume * 0.5, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.2);
    }

    playExplosion() {
        const bufferSize = this.ctx.sampleRate * 0.5; // 0.5 sec
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, this.ctx.currentTime);
        filter.frequency.linearRampToValueAtTime(100, this.ctx.currentTime + 0.5);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        noise.start();
    }

    playBlip(freq, dur) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        osc.type = 'square';

        gain.gain.setValueAtTime(this.masterVolume * 0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + dur);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + dur);
    }

    playPowerUp() {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.frequency.setValueAtTime(400, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(1200, this.ctx.currentTime + 0.5);
        osc.type = 'sine';

        gain.gain.setValueAtTime(0, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(this.masterVolume, this.ctx.currentTime + 0.1);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.5);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.5);
    }

    playAlarm() {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.frequency.setValueAtTime(600, this.ctx.currentTime);
        osc.type = 'sawtooth';

        gain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
        gain.gain.setValueAtTime(0, this.ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0, this.ctx.currentTime + 0.3);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.3);
    }

    playChord(freqs, dur) {
        freqs.forEach(f => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.frequency.value = f;
            osc.type = 'triangle';
            gain.gain.setValueAtTime(this.masterVolume * 0.3, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + dur);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + dur);
        });
    }
}
