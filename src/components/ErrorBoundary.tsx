import React from 'react';

interface Props {
    children: React.ReactNode;
}

interface State {
    hasError: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(): State {
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('[ErrorBoundary]', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    padding: 32,
                    fontFamily: "'Noto Sans JP', sans-serif",
                    textAlign: 'center',
                }}>
                    <p style={{ fontSize: 48, margin: 0 }}>😵</p>
                    <h2 style={{ fontSize: 18, color: '#2D3436', margin: '16px 0 8px' }}>
                        エラーが発生しました
                    </h2>
                    <p style={{ fontSize: 14, color: '#8395A7', lineHeight: 1.6 }}>
                        アプリを再読み込みしてください
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            marginTop: 16,
                            padding: '12px 32px',
                            borderRadius: 99,
                            border: 'none',
                            background: '#2BBAA0',
                            color: 'white',
                            fontSize: 16,
                            fontWeight: 'bold',
                            cursor: 'pointer',
                        }}
                    >
                        再読み込み
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}
