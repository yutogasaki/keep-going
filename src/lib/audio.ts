import { useAppStore } from '../store/useAppStore';
import { findBgmTrack } from './bgmTracks';

export const getSpeechVolume = (soundVolume: number) => {
    const clamped = Math.max(0, Math.min(1, soundVolume));
    if (clamped === 0) return 0;

    // Speech synthesis is quieter than Web Audio on many mobile devices,
    // so keep a small boost while still letting the slider behave predictably.
    return Math.min(1, 0.2 + clamped * 0.8);
};

export const getEffectsVolume = (soundVolume: number) => {
    const clamped = Math.max(0, Math.min(1, soundVolume));
    if (clamped === 0) return 0;

    // Keep small UI sounds audible without making the lowest non-zero step jump too hard.
    return Math.min(1, 0.1 + clamped * 0.9);
};

class AudioEngine {
    private ctx: AudioContext | null = null;
    private isMuted = false;
    private cachedVoices: SpeechSynthesisVoice[] = [];
    private bgmAudio: HTMLAudioElement | null = null;
    private currentBgmSrc: string | null = null;
    private sessionBgmActive = false;
    private speechTokenCounter = 0;
    private activeSpeechToken = 0;
    private isSpeechActive = false;

    constructor() {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            this.cachedVoices = window.speechSynthesis.getVoices();
            window.speechSynthesis.addEventListener('voiceschanged', () => {
                this.cachedVoices = window.speechSynthesis.getVoices();
            });
        }
    }

    public init() {
        if (typeof window === 'undefined') return;

        if (!this.ctx) {
            const AudioContextClass = window.AudioContext
                ?? (window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

            if (!AudioContextClass) return;

            this.ctx = new AudioContextClass();
        }
        if (this.ctx.state === 'suspended') {
            void this.ctx.resume();
        }
    }

    public toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.isMuted) {
            this.stopSpeech();
            this.pauseBgm(false);
            return;
        }

        this.applyBgmState();
    }

    public getMuted() {
        return this.isMuted;
    }

    public syncSessionBgm(active: boolean) {
        this.sessionBgmActive = active;
        if (!active) {
            this.pauseBgm(true);
            return;
        }

        this.applyBgmState();
    }

    public refreshBgm() {
        this.applyBgmState();
    }

    public stopSpeech() {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }

        this.isSpeechActive = false;
        this.applyBgmState();
    }

    public initTTS() {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance('');
            utterance.volume = 0;
            window.speechSynthesis.speak(utterance);
        }
    }

    public speak(text: string) {
        if (this.isMuted) return;

        const state = useAppStore.getState();
        if (!state.ttsEnabled || state.soundVolume === 0) return;

        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            const token = ++this.speechTokenCounter;

            utterance.lang = 'ja-JP';
            utterance.volume = getSpeechVolume(state.soundVolume);
            utterance.onstart = () => {
                this.activeSpeechToken = token;
                this.isSpeechActive = true;
                this.applyBgmState();
            };
            utterance.onend = () => this.clearSpeechDucking(token);
            utterance.onerror = () => this.clearSpeechDucking(token);

            const voices = this.cachedVoices.length > 0 ? this.cachedVoices : window.speechSynthesis.getVoices();
            const jpVoices = voices.filter((voice) => voice.lang.startsWith('ja'));

            if (jpVoices.length > 0) {
                utterance.voice =
                    jpVoices.find((voice) => /Kyoko|Otoya/.test(voice.name) && voice.name.includes('Enhanced')) ??
                    jpVoices.find((voice) => voice.name.includes('Google')) ??
                    jpVoices.find((voice) => /Kyoko|Otoya/.test(voice.name)) ??
                    jpVoices[0];
            }

            utterance.rate = 0.95;
            utterance.pitch = 1.05;

            window.speechSynthesis.speak(utterance);
        }
    }

    private clearSpeechDucking(token: number) {
        if (token !== this.activeSpeechToken) {
            return;
        }

        this.isSpeechActive = false;
        this.applyBgmState();
    }

    private ensureBgmAudio(src: string): HTMLAudioElement | null {
        if (typeof window === 'undefined' || typeof Audio === 'undefined') {
            return null;
        }

        if (!this.bgmAudio) {
            this.bgmAudio = new Audio();
            this.bgmAudio.loop = true;
            this.bgmAudio.preload = 'auto';
            this.bgmAudio.setAttribute('playsinline', 'true');
        }

        if (this.currentBgmSrc !== src) {
            this.bgmAudio.src = src;
            this.currentBgmSrc = src;
            this.bgmAudio.currentTime = 0;
        }

        return this.bgmAudio;
    }

    private getBgmVolume() {
        const state = useAppStore.getState();
        const baseVolume = Math.max(0, Math.min(1, state.bgmVolume));
        const duckMultiplier = this.isSpeechActive ? 0.45 : 1;
        return Math.max(0, Math.min(1, baseVolume * duckMultiplier));
    }

    private applyBgmState() {
        const state = useAppStore.getState();
        const track = findBgmTrack(state.bgmTrackId);

        if (
            !this.sessionBgmActive ||
            this.isMuted ||
            !state.bgmEnabled ||
            state.bgmVolume <= 0 ||
            !track
        ) {
            this.pauseBgm(false);
            return;
        }

        const audio = this.ensureBgmAudio(track.src);
        if (!audio) {
            return;
        }

        audio.volume = this.getBgmVolume();
        if (audio.paused) {
            void audio.play().catch(() => {
                // Playback can be blocked until the browser considers the page user-activated.
            });
        }
    }

    private pauseBgm(reset: boolean) {
        if (!this.bgmAudio) {
            return;
        }

        this.bgmAudio.pause();
        if (reset) {
            try {
                this.bgmAudio.currentTime = 0;
            } catch {
                // Ignore browsers that reject currentTime before metadata is ready.
            }
        }
    }

    private getEffectGain(baseVol: number) {
        if (this.isMuted) return 0;

        const state = useAppStore.getState();
        const master = getEffectsVolume(state.soundVolume);
        return baseVol * master;
    }

    private playTone(freq: number, type: OscillatorType, duration: number, baseVol = 0.1) {
        const vol = this.getEffectGain(baseVol);
        if (vol === 0) return;

        this.init();
        if (!this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        gain.gain.setValueAtTime(0, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(vol, this.ctx.currentTime + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + duration);
    }

    public playTick() {
        this.playTone(880, 'sine', 0.1, 0.16);
    }

    public playGo() {
        this.playTone(1760, 'sine', 0.3, 0.22);
    }

    public playProgressTone() {
        const vol = this.getEffectGain(0.11);
        if (vol === 0) return;

        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const gain = this.ctx.createGain();
        gain.connect(this.ctx.destination);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(vol, now + 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

        const osc1 = this.ctx.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(392, now);
        osc1.connect(gain);
        osc1.start(now);
        osc1.stop(now + 0.6);

        const osc2 = this.ctx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(493.88, now + 0.1);
        osc2.connect(gain);
        osc2.start(now + 0.1);
        osc2.stop(now + 0.6);
    }

    public playExerciseStart() {
        const vol = this.getEffectGain(0.18);
        if (vol === 0) return;

        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const gain = this.ctx.createGain();
        gain.connect(this.ctx.destination);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(vol, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

        const osc1 = this.ctx.createOscillator();
        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(523.25, now);
        osc1.connect(gain);
        osc1.start(now);
        osc1.stop(now + 0.4);

        const osc2 = this.ctx.createOscillator();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(659.25, now + 0.15);
        osc2.connect(gain);
        osc2.start(now + 0.15);
        osc2.stop(now + 0.8);
    }

    public playTransition() {
        const vol = this.getEffectGain(0.17);
        if (vol === 0) return;

        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const gain = this.ctx.createGain();
        gain.connect(this.ctx.destination);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(vol, now + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

        const freqs = [523.25, 659.25, 783.99];
        freqs.forEach((freq, index) => {
            const osc = this.ctx!.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + index * 0.05);
            osc.connect(gain);
            osc.start(now + index * 0.05);
            osc.stop(now + 1.5);
        });
    }

    public playSuccess() {
        const vol = this.getEffectGain(0.23);
        if (vol === 0) return;

        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const gain = this.ctx.createGain();
        gain.connect(this.ctx.destination);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(vol, now + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 2.0);

        const freqs = [523.25, 783.99, 1046.5, 1318.51];
        freqs.forEach((freq, index) => {
            const osc = this.ctx!.createOscillator();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + index * 0.1);
            osc.connect(gain);
            osc.start(now + index * 0.1);
            osc.stop(now + 2.0);
        });
    }
}

export const audio = new AudioEngine();
