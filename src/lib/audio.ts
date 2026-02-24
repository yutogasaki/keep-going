import { useAppStore } from '../store/useAppStore';

// Simple Web Audio API Synthesizer for UI Sounds
// Generates beeps and chimes without external audio assets

class AudioEngine {
    private ctx: AudioContext | null = null;
    private isMuted: boolean = false;

    // BGM properties
    private bgmGain: GainNode | null = null;
    private isBgmPlaying: boolean = false;
    private synBgmOscillators: OscillatorNode[] = [];

    // Initialize context only on user interaction
    public init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    public toggleMute() {
        this.isMuted = !this.isMuted;

        // Handle BGM volume on mute toggle
        if (this.isBgmPlaying && this.bgmGain && this.ctx) {
            const now = this.ctx.currentTime;
            this.bgmGain.gain.cancelScheduledValues(now);
            if (this.isMuted || useAppStore.getState().soundVolume === 0) {
                this.bgmGain.gain.linearRampToValueAtTime(0, now + 0.5);
            } else {
                const vol = useAppStore.getState().soundVolume * 0.3; // Default BGM volume ratio
                this.bgmGain.gain.linearRampToValueAtTime(vol, now + 0.5);
            }
        }
    }

    public getMuted() {
        return this.isMuted;
    }

    // --- Synthetic BGM Methods ---
    // Generates a soft, breathing ambient drone using Web Audio API

    public async startBGM(_fadeTime: number = 2.0) {
        // Disabled synthetic drone BGM as requested by user ("bobobobo" sound is unpleasant during training)
        return;
    }

    public stopBGM(fadeTime: number = 2.0) {
        if (!this.isBgmPlaying || !this.bgmGain || !this.ctx) return;

        const now = this.ctx.currentTime;
        this.bgmGain.gain.cancelScheduledValues(now);
        this.bgmGain.gain.setValueAtTime(this.bgmGain.gain.value, now);
        this.bgmGain.gain.linearRampToValueAtTime(0, now + fadeTime);

        const oscsToStop = this.synBgmOscillators;
        setTimeout(() => {
            try {
                oscsToStop.forEach((osc: OscillatorNode) => {
                    osc.stop();
                    osc.disconnect();
                });
            } catch (e) {
                // Ignore errors if already stopped
            }
        }, fadeTime * 1000 + 100);

        this.synBgmOscillators = [];
        this.isBgmPlaying = false;
        this.bgmGain = null;
    }

    // Initialize TTS engine (needed for iOS Safari)
    public initTTS() {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance('');
            utterance.volume = 0;
            window.speechSynthesis.speak(utterance);
        }
    }

    // Text-to-Speech
    public speak(text: string) {
        if (this.isMuted) return;

        const state = useAppStore.getState();
        if (!state.ttsEnabled || state.soundVolume === 0) return;

        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'ja-JP';
            // Scale up voice volume because default TTS is often quiet compared to media
            utterance.volume = Math.min(1.0, state.soundVolume * 2.5);

            // Voice selection logic for premium natural voices
            const voices = window.speechSynthesis.getVoices();
            const jpVoices = voices.filter(v => v.lang.includes('ja'));

            if (jpVoices.length > 0) {
                // Priority: Google (Android/Chrome) > Kyoko (Mac/iOS) > Otoya > Default
                const premiumVoice = jpVoices.find(v => v.name.includes('Google') || v.name.includes('Kyoko') || v.name.includes('Otoya'));
                if (premiumVoice) {
                    utterance.voice = premiumVoice;
                } else {
                    utterance.voice = jpVoices[0];
                }
            }

            // Adjust rate and pitch to sound more calming and natural
            utterance.rate = 0.95; // Slightly slower
            utterance.pitch = 1.05; // Slightly higher but soft

            window.speechSynthesis.speak(utterance);
        }
    }

    private playTone(freq: number, type: OscillatorType, duration: number, baseVol = 0.1) {
        if (this.isMuted) return;

        const state = useAppStore.getState();
        const vol = baseVol * state.soundVolume;
        if (vol === 0) return;

        this.init();
        if (!this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        // Envelope
        gain.gain.setValueAtTime(0, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(vol, this.ctx.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + duration);
    }

    // ─── Sound Effects ─────────────────────────────

    // Short beep for "3, 2, 1" (Last 5 seconds)
    public playTick() {
        this.playTone(880, 'sine', 0.1, 0.1); // A5
    }

    // High beep for start "GO"
    public playGo() {
        this.playTone(1760, 'sine', 0.3, 0.15); // A6
    }

    // Gentle chime for transition/changing exercise
    public playTransition() {
        if (this.isMuted) return;

        const state = useAppStore.getState();
        const vol = 0.1 * state.soundVolume;
        if (vol === 0) return;

        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const gain = this.ctx.createGain();
        gain.connect(this.ctx.destination);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(vol, now + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

        // Major chord (C major arpeggio)
        const freqs = [523.25, 659.25, 783.99]; // C5, E5, G5
        freqs.forEach((freq, i) => {
            const osc = this.ctx!.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + i * 0.05);
            osc.connect(gain);
            osc.start(now + i * 0.05);
            osc.stop(now + 1.5);
        });
    }

    // Success sound for session completion / big break
    public playSuccess() {
        if (this.isMuted) return;

        const state = useAppStore.getState();
        const vol = 0.15 * state.soundVolume;
        if (vol === 0) return;

        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const gain = this.ctx.createGain();
        gain.connect(this.ctx.destination);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(vol, now + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 2.0);

        // Sparkle chord
        const freqs = [523.25, 783.99, 1046.50, 1318.51]; // C5, G5, C6, E6
        freqs.forEach((freq, i) => {
            const osc = this.ctx!.createOscillator();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + i * 0.1);
            osc.connect(gain);
            osc.start(now + i * 0.1);
            osc.stop(now + 2.0);
        });
    }
}

export const audio = new AudioEngine();
