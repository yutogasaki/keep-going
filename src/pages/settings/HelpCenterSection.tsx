import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronRight, HelpCircle, X } from 'lucide-react';
import { HELP_SECTIONS } from './helpData';
import { HelpItem } from './HelpItem';

export const HelpCenterSection: React.FC = () => {
    const [showHelp, setShowHelp] = useState(false);
    const [openHelpItems, setOpenHelpItems] = useState<Set<string>>(new Set());

    const toggleHelpItem = (id: string) => {
        setOpenHelpItems(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    return (
        <>
            <div
                className="card"
                onClick={() => setShowHelp(true)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '16px 20px',
                    cursor: 'pointer',
                }}
            >
                <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, #E8F8F0, #F0F8FF)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 20,
                    flexShrink: 0,
                }}>
                    <HelpCircle size={22} color="#2BBAA0" />
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 14,
                        fontWeight: 700,
                        color: '#2D3436',
                    }}>ヘルプと使い方</div>
                    <div style={{
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 12,
                        color: '#8395A7',
                    }}>よくある質問や操作について</div>
                </div>
                <ChevronRight size={18} color="#B2BEC3" />
            </div>

            {showHelp && createPortal(
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgb(248, 249, 250)',
                    zIndex: 200,
                    display: 'flex',
                    flexDirection: 'column',
                }}>
                    <div style={{
                        padding: '24px 20px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'white',
                        borderBottom: '1px solid rgba(0,0,0,0.06)',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                    }}>
                        <h2 style={{
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 18,
                            fontWeight: 700,
                            color: '#2D3436',
                            margin: 0,
                        }}>
                            ヘルプ・使い方
                        </h2>
                        <button
                            onClick={() => setShowHelp(false)}
                            style={{
                                width: 36,
                                height: 36,
                                borderRadius: '50%',
                                border: 'none',
                                background: '#F8F9FA',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                            }}
                        >
                            <X size={20} color="#2D3436" />
                        </button>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', padding: '20px', paddingBottom: 40 }}>
                        {HELP_SECTIONS.map((section, idx) => (
                            <div
                                key={section.title}
                                className="card"
                                style={{
                                    marginBottom: idx < HELP_SECTIONS.length - 1 ? 16 : 0,
                                    padding: '16px 20px',
                                }}
                            >
                                <h3 style={{
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontSize: 15,
                                    fontWeight: 700,
                                    color: '#2D3436',
                                    marginBottom: 8,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                }}>
                                    <span>{section.emoji}</span>
                                    <span>{section.title}</span>
                                </h3>
                                {section.items.map(item => (
                                    <HelpItem
                                        key={item.id}
                                        item={item}
                                        isOpen={openHelpItems.has(item.id)}
                                        onToggle={() => toggleHelpItem(item.id)}
                                    />
                                ))}
                            </div>
                        ))}
                    </div>
                </div>,
                document.body,
            )}
        </>
    );
};
