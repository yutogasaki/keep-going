import { useAppStore } from '../store/useAppStore';

// Simple Web Audio API Synthesizer for UI Sounds
// Generates beeps and chimes without external audio assets

export const getSpeechVolume = (soundVolume: number) => {
    const clamped = Math.max(0, Math.min(1, soundVolume));
    if (clamped === 0) return 0;

    // Speech synthesis is quieter than Web Audio on many mobile devices,
    // so keep a small boost while still letting the slider behave predictably.
    return Math.min(1, 0.2 + clamped * 0.8);
};

class AudioEngine {
    private ctx: AudioContext | null = null;
    private isMuted: boolean = false;
    private cachedVoices: SpeechSynthesisVoice[] = [];

    constructor() {
        // iOS Safari loads voices asynchronously — cache them when ready
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            this.cachedVoices = window.speechSynthesis.getVoices();
            window.speechSynthesis.addEventListener('voiceschanged', () => {
                this.cachedVoices = window.speechSynthesis.getVoices();
            });
        }
    }

    // Initialize context only on user interaction
    public init() {
        if (typeof window === 'undefined') return;

        if (!this.ctx) {
            const AudioContextClass = window.AudioContext
                ?? (window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

            if (!AudioContextClass) return;

            this.ctx = new AudioContextClass();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    public toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.isMuted) {
            this.stopSpeech();
        }
    }

    public getMuted() {
        return this.isMuted;
    }

    public stopSpeech() {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
    }

    // Initialize TTS engine (needed for iOS Safari)
    public initTTS() {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
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

        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'ja-JP';
            utterance.volume = getSpeechVolume(state.soundVolume);
            // Voice selection logic for premium natural voices
            // Use cached voices (iOS Safari returns [] from getVoices() until voiceschanged fires)
            const voices = this.cachedVoices.length > 0 ? this.cachedVoices : window.speechSynthesis.getVoices();
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

            // Adjust rate and pitch — user-configurable via settings
            utterance.rate = state.ttsRate ?? 0.95;
            utterance.pitch = state.ttsPitch ?? 1.05;

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
