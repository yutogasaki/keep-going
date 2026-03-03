import React from 'react';
import { motion } from 'framer-motion';
import { Award, Home } from 'lucide-react';
import type { ChibifuwaRecord, PastFuwafuwaRecord } from '../../store/useAppStore';
import { formatDate } from './recordUtils';

interface AlbumTabContentProps {
    chibifuwas: ChibifuwaRecord[];
    pastFuwafuwas: PastFuwafuwaRecord[];
    onSelectBadge: (badge: ChibifuwaRecord) => void;
    onSelectFuwafuwa: (fuwafuwa: PastFuwafuwaRecord) => void;
}

export const AlbumTabContent: React.FC<AlbumTabContentProps> = ({
    chibifuwas,
    pastFuwafuwas,
    onSelectBadge,
    onSelectFuwafuwa,
}) => {
    return (
        <motion.div
            key="album"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 20,
                paddingTop: 8,
            }}
        >
            {chibifuwas.length > 0 && (
                <section>
                    <div style={{
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 13,
                        fontWeight: 700,
                        color: '#8395A7',
                        marginBottom: 10,
                        letterSpacing: 1,
                    }}>
                        ちびふわバッジ
                    </div>
                    <div style={{
                        display: 'flex',
                        gap: 12,
                        flexWrap: 'wrap',
                    }}>
                        {chibifuwas.map((badge, index) => (
                            <motion.div
                                key={badge.id}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.05 }}
                                onClick={() => onSelectBadge(badge)}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: 6,
                                    width: 72,
                                    cursor: 'pointer',
                                }}
                            >
                                <div style={{
                                    width: 64,
                                    height: 64,
                                    borderRadius: '50%',
                                    background: '#fff',
                                    border: '2px solid rgba(255, 200, 0, 0.35)',
                                    overflow: 'hidden',
                                    boxShadow: '0 2px 8px rgba(255, 200, 0, 0.15)',
                                }}>
                                    <img
                                        src={`/medal/${badge.type}.png`}
                                        alt={badge.challengeTitle}
                                        style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                                    />
                                </div>
                                <div style={{
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontSize: 10,
                                    fontWeight: 600,
                                    color: '#2D3436',
                                    textAlign: 'center',
                                    lineHeight: 1.3,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical' as const,
                                    maxWidth: '100%',
                                }}>
                                    {badge.challengeTitle}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </section>
            )}

            {pastFuwafuwas.length === 0 && chibifuwas.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: '48px 20px',
                    color: '#8395A7',
                    fontFamily: "'Noto Sans JP', sans-serif",
                }}>
                    <Home size={48} color="#FFEAA7" style={{ margin: '0 auto 16px' }} />
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#2D3436', marginBottom: 8 }}>
                        まだ お部屋にはだれもいません
                    </div>
                    <div style={{ fontSize: 13, lineHeight: 1.6 }}>
                        ふわふわを成体まで育てると、<br />
                        ここに引っ越してくるよ。
                    </div>
                </div>
            ) : pastFuwafuwas.length > 0 ? (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: 16,
                }}>
                    {pastFuwafuwas.map((fuwafuwa, index) => (
                        <motion.div
                            key={fuwafuwa.id}
                            className="card card-sm"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.1 }}
                            onClick={() => onSelectFuwafuwa(fuwafuwa)}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                padding: '16px',
                                gap: 12,
                                border: '1px solid rgba(232, 67, 147, 0.1)',
                                background: 'linear-gradient(135deg, #fff 0%, #FAFAFA 100%)',
                                cursor: 'pointer',
                            }}
                        >
                            <div style={{
                                width: 80,
                                height: 80,
                                borderRadius: '50%',
                                background: '#fff',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                                overflow: 'hidden',
                                border: '2px solid rgba(255,154,158,0.2)',
                            }}>
                                <img
                                    src={`/ikimono/${fuwafuwa.type}-${fuwafuwa.finalStage}.png`}
                                    alt="Fuwafuwa"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.05)', display: 'block' }}
                                />
                            </div>
                            <div style={{
                                textAlign: 'center',
                                width: '100%',
                            }}>
                                <div style={{
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontWeight: 800,
                                    fontSize: 14,
                                    color: '#2D3436',
                                    marginBottom: 4,
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                }}>
                                    {fuwafuwa.name || 'なまえなし'}
                                </div>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    gap: 4,
                                    fontSize: 11,
                                    color: '#E84393',
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontWeight: 600,
                                    background: 'rgba(232, 67, 147, 0.08)',
                                    padding: '4px 8px',
                                    borderRadius: 12,
                                }}>
                                    <Award size={12} />
                                    頑張り度: {fuwafuwa.activeDays}日
                                </div>
                                <div style={{
                                    fontSize: 10,
                                    color: '#B2BEC3',
                                    marginTop: 8,
                                    fontFamily: "'Outfit', sans-serif",
                                }}>
                                    {formatDate(fuwafuwa.sayonaraDate)}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            ) : null}
        </motion.div>
    );
};
