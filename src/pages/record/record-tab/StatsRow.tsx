import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Flame } from 'lucide-react';

interface StatCardProps {
    icon: React.ReactNode;
    value: number;
    label: string;
    color: string;
    delay: number;
}

interface StatsRowProps {
    totalSessions: number;
    totalMinutes: number;
    uniqueDays: number;
}

const StatCard: React.FC<StatCardProps> = ({ icon, value, label, color, delay }) => {
    return (
        <motion.div
            className="card card-sm"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
                padding: '16px 8px',
            }}
        >
            <div style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}>
                {icon}
            </div>
            <span style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: 22,
                fontWeight: 700,
                color: '#2D3436',
            }}>
                {value}
            </span>
            <span style={{
                fontFamily: "'Noto Sans JP', sans-serif",
                fontSize: 11,
                color: '#8395A7',
            }}>
                {label}
            </span>
        </motion.div>
    );
};

export const StatsRow: React.FC<StatsRowProps> = ({ totalSessions, totalMinutes, uniqueDays }) => {
    return (
        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <StatCard
                icon={<Flame size={18} color="#E17055" />}
                value={totalSessions}
                label="合計回数"
                color="#FFE5D9"
                delay={0.2}
            />
            <StatCard
                icon={<Clock size={18} color="#2BBAA0" />}
                value={totalMinutes}
                label="合計分"
                color="#E8F8F0"
                delay={0.3}
            />
            <StatCard
                icon={<Calendar size={18} color="#6C5CE7" />}
                value={uniqueDays}
                label="日数"
                color="#E8D5F5"
                delay={0.4}
            />
        </div>
    );
};
