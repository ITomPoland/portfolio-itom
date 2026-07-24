import { StrictMode, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';

const path = (typeof window !== 'undefined' ? window.location.pathname : '/').replace(/\/+$/, '') || '/';

let Entry;
if (path === '/admin') {
    Entry = lazy(() => import('./admin/AdminApp.jsx'));
} else if (path.startsWith('/checkout/')) {
    Entry = lazy(() => import('./admin/CheckoutResult.jsx'));
} else {
    Entry = lazy(() => import('./App.jsx'));
}

if (typeof window !== 'undefined') {
    console.log(
        '%c HAKKILO %c XR %c',
        'background: #111; color: #fff; padding: 5px 10px; font-weight: bold; border-radius: 3px 0 0 3px;',
        'background: #E09F3E; color: #fff; padding: 5px 10px; font-weight: bold; border-radius: 0 3px 3px 0;',
        'background: transparent'
    );
}

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <Suspense fallback={<div style={{ minHeight: '100vh', background: '#0D1220' }} />}>
            <Entry />
        </Suspense>
    </StrictMode>,
);
