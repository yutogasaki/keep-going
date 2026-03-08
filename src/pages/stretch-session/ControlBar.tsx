import React from 'react';
import { motion } from 'framer-motion';
import { Pause, Play, SkipForward, Volume2, VolumeX } from 'lucide-react';

interface ControlBarProps {
    isMuted: boolean;
    isPlaying: boolean;
    onToggleMute: () => void;
    onTogglePlayPause: () => void;
    onSkip: () => void;
}

export const ControlBar: React.FC<ControlBarProps> = ({
    isMuted,
    isPlaying,
    onToggleMute,
    onTogglePlayPause,
    onSkip,
}) => (
    <motion.div
        initial={{ y: 100, opacity: 0, x: '-50%' }}
        animate={{ y: 0, opacity: 1, x: '-50%' }}
        style={{
            position: 'absolute',
            bottom: 'calc(env(safe-area-inset-bottom, 24px) + 24px)',
            left: '50%',
            zIndex: 80,
            background: 'var(--glass-bg-heavy)',
            backdropFilter: 'blur(var(--blur-xl))',
            WebkitBackdropFilter: 'blur(var(--blur-xl))',
            borderRadius: 99,
            padding: '8px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: 32,
            boxShadow: 'var(--shadow-lg)',
            border: 'var(--glass-border)',
        }}
    >
        <button
            type="button"
            aria-label={isMuted ? '音をオンにする' : '音をミュートする'}
            onClick={(e) => {
                e.stopPropagation();
                onToggleMute();
            }}
            style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isMuted ? '#B2BEC3' : '#2D3436',
                padding: 8,
            }}
        >
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>

        <button
            type="button"
            aria-label={isPlaying ? 'ストレッチを一時停止' : 'ストレッチを再開'}
            onClick={(e) => {
                e.stopPropagation();
                onTogglePlayPause();
            }}
            style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: '#2BBAA0',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                boxShadow: 'var(--shadow-accent-sm)',
            }}
        >
            {isPlaying ? (
                <Pause size={28} fill="currentColor" />
            ) : (
                <Play size={28} fill="currentColor" style={{ marginLeft: 4 }} />
            )}
        </button>

        <button
            type="button"
            aria-label="次の種目へスキップ"
            onClick={(e) => {
                e.stopPropagation();
                onSkip();
            }}
            style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#2D3436',
                padding: 8,
            }}
        >
            <SkipForward size={24} />
        </button>
    </motion.div>
);
