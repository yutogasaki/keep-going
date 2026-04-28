import { useAppStore } from '../store/useAppStore';
import { AUDIO_CUES } from './audioCues';
import { findBgmTrack } from './bgmTracks';
import {
    getBgmDuckMultiplier,
    getBgmMixVolume,
    getEffectsVolume,
    getSpeechVolume,
    normalizeSpeechText,
} from './audioMix';

export {
    getBgmDuckMultiplier,
    getBgmMixVolume,
    getEffectsVolume,
    getSpeechVolume,
    normalizeSpeechText,
};

class AudioEngine {
    private ctx: AudioContext | null = null;
    private isMuted = false;
    private cachedVoices: SpeechSynthesisVoice[] = [];
    private bgmAudio: HTMLAudioElement | null = null;
    private bgmSourceNode: MediaElementAudioSourceNode | null = null;
    private bgmGainNode: GainNode | null = null;
    private currentBgmSrc: string | null = null;
    private sessionBgmActive = false;
    private bgmPreviewActive = false;
    private bgmRetryPending = false;
    private speechTokenCounter = 0;
    private activeSpeechToken = 0;
    private isSpeechActive = false;
    private isEffectActive = false;
    private effectDuckTimer: number | null = null;
    private readonly retryPendingBgmPlayback = () => {
        if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
            return;
        }

        if (!this.bgmRetryPending || !this.shouldPlayBgm()) {
            return;
        }

        this.init();
        this.applyBgmState();
    };

    constructor() {
        if (typeof window !== 'undefined') {
            window.addEventListener('pageshow', this.retryPendingBgmPlayback);
            window.addEventListener('pointerdown', this.retryPendingBgmPlayback, { passive: true });
            window.addEventListener('touchend', this.retryPendingBgmPlayback, { passive: true });
            window.addEventListener('keydown', this.retryPendingBgmPlayback);
            document.addEventListener('visibilitychange', this.retryPendingBgmPlayback);
        }

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
            this.ctx.addEventListener('statechange', () => {
                if (this.ctx?.state === 'running') {
                    this.bgmRetryPending = false;
                    this.applyBgmState();
                    return;
                }

                if (this.shouldPlayBgm()) {
                    this.bgmRetryPending = true;
                }
            });
        }

        if (this.ctx.state === 'suspended') {
            this.bgmRetryPending = this.shouldPlayBgm();
            void this.ctx.resume()
                .then(() => {
                    if (this.ctx?.state === 'running') {
                        this.bgmRetryPending = false;
                        this.applyBgmState();
                    }
                })
                .catch(() => {
                    this.bgmRetryPending = this.shouldPlayBgm();
                });
        } else if (this.ctx.state === 'running') {
            this.bgmRetryPending = false;
        }

        this.ensureBgmRouting();
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
            this.bgmRetryPending = false;
            this.pauseBgm(true);
            return;
        }

        this.init();
        this.bgmPreviewActive = false;
        this.applyBgmState();
    }

    public refreshBgm() {
        this.init();
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

        this.init();
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
        if (!this.shouldPlayBgm()) {
            this.bgmRetryPending = false;
        }
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

        this.ensureBgmRouting();
        return this.bgmAudio;
    }

    private ensureBgmRouting() {
        if (!this.ctx || !this.bgmAudio || this.ctx.state !== 'running') {
            return false;
        }

        if (!this.bgmGainNode) {
            this.bgmGainNode = this.ctx.createGain();
            this.bgmGainNode.gain.setValueAtTime(this.getBgmVolume(), this.ctx.currentTime);
            this.bgmGainNode.connect(this.ctx.destination);
        }

        if (!this.bgmSourceNode) {
            try {
                this.bgmSourceNode = this.ctx.createMediaElementSource(this.bgmAudio);
                this.bgmSourceNode.connect(this.bgmGainNode);
            } catch {
                return false;
            }
        }

        this.bgmAudio.volume = 1;
        return true;
    }

    private setBgmOutputVolume(volume: number) {
        const clamped = Math.max(0, Math.min(1, volume));
        const usesWebAudioMix = this.ensureBgmRouting();

        if (usesWebAudioMix && this.ctx && this.bgmGainNode) {
            const now = this.ctx.currentTime;
            const currentValue = this.bgmGainNode.gain.value;
            this.bgmGainNode.gain.cancelScheduledValues(now);
            this.bgmGainNode.gain.setValueAtTime(currentValue, now);
            this.bgmGainNode.gain.linearRampToValueAtTime(clamped, now + 0.06);
            this.bgmAudio!.volume = 1;
            return;
        }

        if (this.bgmAudio) {
            this.bgmAudio.volume = clamped;
        }
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

    private shouldPlayBgm() {
        const state = useAppStore.getState();
        const track = findBgmTrack(state.bgmTrackId);
        const hasPlayableTrack = track != null && state.bgmVolume > 0;
        const shouldPlayPreview = this.bgmPreviewActive && !this.isMuted && hasPlayableTrack;
        const shouldPlaySession = this.sessionBgmActive && !this.isMuted && state.bgmEnabled && hasPlayableTrack;

        return shouldPlayPreview || shouldPlaySession;
    }

    private applyBgmState() {
        const state = useAppStore.getState();
        const track = findBgmTrack(state.bgmTrackId);
        const shouldPlay = this.shouldPlayBgm();

        if (!shouldPlay) {
            this.bgmRetryPending = false;
            this.pauseBgm(!this.sessionBgmActive);
            return;
        }

        const audio = this.ensureBgmAudio(track!.src);
        if (!audio) {
            return;
        }

        this.setBgmOutputVolume(this.getBgmVolume());
        if (audio.paused) {
            void audio.play()
                .then(() => {
                    this.bgmRetryPending = false;
                })
                .catch(() => {
                    this.bgmRetryPending = true;
                    // Playback can be blocked until the browser considers the page user-activated.
                });
            return;
        }

        this.bgmRetryPending = false;
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
        this.playTone(AUDIO_CUES.tick.frequency, AUDIO_CUES.tick.type, AUDIO_CUES.tick.duration, AUDIO_CUES.tick.volume);
    }

    public playGo() {
        this.playTone(AUDIO_CUES.go.frequency, AUDIO_CUES.go.type, AUDIO_CUES.go.duration, AUDIO_CUES.go.volume);
    }

    public playProgressTone() {
        const vol = this.getEffectGain(AUDIO_CUES.progress.volume);
        if (vol === 0) return;

        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const gain = this.ctx.createGain();
        gain.connect(this.ctx.destination);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(vol, now + 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

        this.beginEffectDucking(AUDIO_CUES.progress.durationMs);
        AUDIO_CUES.progress.frequencies.forEach((freq, index) => {
            const offset = AUDIO_CUES.progress.startOffsets[index] ?? 0;
            const osc = this.ctx!.createOscillator();
            osc.type = AUDIO_CUES.progress.type;
            osc.frequency.setValueAtTime(freq, now + offset);
            osc.connect(gain);
            osc.start(now + offset);
            osc.stop(now + AUDIO_CUES.progress.duration);
        });
    }

    public playExerciseStart() {
        const vol = this.getEffectGain(AUDIO_CUES.exerciseStart.volume);
        if (vol === 0) return;

        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const gain = this.ctx.createGain();
        gain.connect(this.ctx.destination);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(vol, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

        this.beginEffectDucking(AUDIO_CUES.exerciseStart.durationMs);
        AUDIO_CUES.exerciseStart.frequencies.forEach((freq, index) => {
            const offset = AUDIO_CUES.exerciseStart.startOffsets[index] ?? 0;
            const stopTime =
                AUDIO_CUES.exerciseStart.stopTimes[index] ??
                AUDIO_CUES.exerciseStart.stopTimes[AUDIO_CUES.exerciseStart.stopTimes.length - 1];
            const osc = this.ctx!.createOscillator();
            osc.type = AUDIO_CUES.exerciseStart.type;
            osc.frequency.setValueAtTime(freq, now + offset);
            osc.connect(gain);
            osc.start(now + offset);
            osc.stop(now + stopTime);
        });
    }

    public playTransition() {
        const vol = this.getEffectGain(AUDIO_CUES.transition.volume);
        if (vol === 0) return;

        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const gain = this.ctx.createGain();
        gain.connect(this.ctx.destination);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(vol, now + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

        this.beginEffectDucking(AUDIO_CUES.transition.durationMs);
        AUDIO_CUES.transition.frequencies.forEach((freq, index) => {
            const offset = index * AUDIO_CUES.transition.stagger;
            const osc = this.ctx!.createOscillator();
            osc.type = AUDIO_CUES.transition.type;
            osc.frequency.setValueAtTime(freq, now + offset);
            osc.connect(gain);
            osc.start(now + offset);
            osc.stop(now + AUDIO_CUES.transition.duration);
        });
    }

    public playSuccess() {
        const vol = this.getEffectGain(AUDIO_CUES.success.volume);
        if (vol === 0) return;

        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const gain = this.ctx.createGain();
        gain.connect(this.ctx.destination);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(vol, now + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 2.0);

        this.beginEffectDucking(AUDIO_CUES.success.durationMs);
        AUDIO_CUES.success.frequencies.forEach((freq, index) => {
            const offset = index * AUDIO_CUES.success.stagger;
            const osc = this.ctx!.createOscillator();
            osc.type = AUDIO_CUES.success.type;
            osc.frequency.setValueAtTime(freq, now + offset);
            osc.connect(gain);
            osc.start(now + offset);
            osc.stop(now + AUDIO_CUES.success.duration);
        });
    }
}

export const audio = new AudioEngine();
