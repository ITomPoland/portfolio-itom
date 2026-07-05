import React from 'react';

/**
 * RootErrorBoundary — catches any render/runtime error in its subtree (including the R3F Canvas)
 * and shows a fallback instead of a blank white screen. (Fable audit P1-2.)
 *
 * - No `fallback` prop  → full-screen readable error (with stack, to help diagnose).
 * - `fallback={null}` (or any node) → renders that instead, so an isolated piece (e.g. decor) can
 *   fail silently while the rest of the app keeps working.
 */
export default class RootErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { error: null };
    }

    static getDerivedStateFromError(error) {
        return { error };
    }

    componentDidCatch(error, info) {
        // Even when isolated (fallback={null}), the failure is NOT silent: it's logged here with a
        // label + component stack so you can see exactly what broke and fix it.
        // eslint-disable-next-line no-console
        console.error(`[Hakkilo] "${this.props.label || 'app'}" — rendu échoué :`, error, info?.componentStack);
    }

    render() {
        if (this.state.error) {
            if (this.props.fallback !== undefined) return this.props.fallback;
            return (
                <div style={wrap}>
                    <h1 style={{ margin: '0 0 .5rem', fontSize: '1.4rem' }}>Une erreur est survenue</h1>
                    <p style={{ margin: '0 0 1rem', opacity: 0.8, maxWidth: '32rem' }}>
                        La scène 3D n'a pas pu se charger. Recharge la page ; si ça persiste, envoie ce message.
                    </p>
                    <button type="button" onClick={() => window.location.reload()} style={btn}>Recharger</button>
                    <pre style={pre}>{String(this.state.error?.stack || this.state.error)}</pre>
                </div>
            );
        }
        return this.props.children;
    }
}

const wrap = {
    position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', gap: '.4rem', padding: '2rem',
    background: '#121014', color: '#F7F4EE', font: '400 1rem/1.4 system-ui, sans-serif', textAlign: 'center',
};
const btn = {
    padding: '.6rem 1.4rem', borderRadius: '999px', border: 'none', background: '#3554E8',
    color: '#fff', font: '600 .95rem system-ui', cursor: 'pointer',
};
const pre = {
    marginTop: '1.5rem', maxWidth: '92vw', maxHeight: '42vh', overflow: 'auto', padding: '1rem',
    borderRadius: '8px', background: 'rgba(0,0,0,.4)', color: '#ff9b9b',
    font: '400 .7rem/1.4 monospace', textAlign: 'left', whiteSpace: 'pre-wrap',
};
