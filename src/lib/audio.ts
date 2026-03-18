import { useAppStore } from '../store/useAppStore';
import { findBgmTrack } from './bgmTracks';

export const normalizeSpeechText = (text: string) =>
    // Some browser voices misread `次は` as `じは`, so normalize only the spoken form.
    text.replace(/次は/gu, 'つぎは');

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

    // Let short cues punch through more clearly, especially on small mobile speakers.
    return Math.min(1.15, 0.4 + clamped * 0.75);
};

export const getBgmMixVolume = (bgmVolume: number) => {
    const clamped = Math.max(0, Math.min(1, bgmVolume));
    if (clamped === 0) return 0;

    // Give the lower half of the slider more usable range so BGM sits behind guidance more easily.
    return Math.pow(clamped, 1.45) * 0.225;
};

export const getBgmDuckMultiplier = ({
    speechActive,
    effectActive,
}: {
    speechActive: boolean;
    effectActive: boolean;
}) => {
    const speechMultiplier = speechActive ? 0.08 : 1;
    const effectMultiplier = effectActive ? 0.1 : 1;
    return Math.min(speechMultiplier, effectMultiplier);
};

class AudioEngine {
    private ctx: AudioContext | null = null;
    private isMuted = false;
    private cachedVoices: SpeechSynthesisVoice[] = [];
    private bgmAudio: HTMLAudioElement | null = null;
    private currentBgmSrc: string | null = null;
    private sessionBgmActive = false;
    private bgmPreviewActive = false;
    private speechTokenCounter = 0;
    private activeSpeechToken = 0;
    private isSpeechActive = false;
    private isEffectActive = false;
    private effectDuckTimer: number | null = null;

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

        this.bgmPreviewActive = false;
        this.applyBgmState();
    }

    public refreshBgm() {
        this.applyBgmState();
    }

    public isBgmPreviewing() {
        return this.bgmPreviewActive;
    }

    public startBgmPreview() {
        const state = useAppStore.getState();
        const track = findBgmTrack(state.bgmTrackId);
        if (!track || this.isMuted || state.bgmVolume <= 0) {
            this.bgmPreviewActive = false;
            this.applyBgmState();
            return false;
        }

        const audio = this.ensureBgmAudio(track.src);
        if (!audio) {
            this.bgmPreviewActive = false;
            return false;
        }

        this.bgmPreviewActive = true;
        audio.currentTime = 0;
        this.applyBgmState();
        return true;
    }

    public stopBgmPreview() {
        this.bgmPreviewActive = false;
        this.applyBgmState();
    }

    public toggleBgmPreview() {
        if (this.bgmPreviewActive) {
            this.stopBgmPreview();
            return false;
        }

        return this.startBgmPreview();
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

            const utterance = new SpeechSynthesisUtterance(normalizeSpeechText(text));
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
        const track = findBgmTrack(state.bgmTrackId);
        const baseVolume = getBgmMixVolume(state.bgmVolume);
        const trackGain = track?.gain ?? 1;
        const duckMultiplier = getBgmDuckMultiplier({
            speechActive: this.isSpeechActive,
            effectActive: this.isEffectActive,
        });
        return Math.max(0, Math.min(1, baseVolume * trackGain * duckMultiplier));
    }

    private applyBgmState() {
        const state = useAppStore.getState();
        const track = findBgmTrack(state.bgmTrackId);
        const hasPlayableTrack = track != null && state.bgmVolume > 0;
        const shouldPlayPreview = this.bgmPreviewActive && !this.isMuted && hasPlayableTrack;
        const shouldPlaySession = this.sessionBgmActive && !this.isMuted && state.bgmEnabled && hasPlayableTrack;

        if (!shouldPlayPreview && !shouldPlaySession) {
            this.pauseBgm(!this.sessionBgmActive);
            return;
        }

        const audio = this.ensureBgmAudio(track!.src);
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

    private beginEffectDucking(durationMs: number) {
        if (typeof window === 'undefined') {
            return;
        }

        this.isEffectActive = true;
        this.applyBgmState();

        if (this.effectDuckTimer !== null) {
            window.clearTimeout(this.effectDuckTimer);
        }

        this.effectDuckTimer = window.setTimeout(() => {
            this.isEffectActive = false;
            this.effectDuckTimer = null;
            this.applyBgmState();
        }, Math.max(0, durationMs) + 160);
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

        this.beginEffectDucking(duration * 1000);
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + duration);
    }

    public playTick() {
        this.playTone(880, 'sine', 0.1, 0.7);
    }

    public playGo() {
        this.playTone(1760, 'sine', 0.3, 0.9);
    }

    public playProgressTone() {
        const vol = this.getEffectGain(0.52);
        if (vol === 0) return;

        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const gain = this.ctx.createGain();
        gain.connect(this.ctx.destination);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(vol, now + 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

        this.beginEffectDucking(600);
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
        const vol = this.getEffectGain(0.68);
        if (vol === 0) return;

        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const gain = this.ctx.createGain();
        gain.connect(this.ctx.destination);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(vol, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

        this.beginEffectDucking(800);
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
        const vol = this.getEffectGain(0.58);
        if (vol === 0) return;

        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const gain = this.ctx.createGain();
        gain.connect(this.ctx.destination);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(vol, now + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

        this.beginEffectDucking(1500);
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
        const vol = this.getEffectGain(0.68);
        if (vol === 0) return;

        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const gain = this.ctx.createGain();
        gain.connect(this.ctx.destination);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(vol, now + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 2.0);

        this.beginEffectDucking(2000);
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
