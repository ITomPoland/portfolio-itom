import { useCallback, useEffect, useMemo, useState } from 'react';
import '../styles/AdminApp.scss';

const emptyProduct = () => ({
    id: '',
    category: 'headset',
    scale: 1,
    platformConfig: { label: '' },
    title: '',
    date: '',
    description: '',
    url: '#contact',
    ctaLabel: 'Demander une démo ↗',
    stock: 0,
    priceCents: '',
    active: true,
});

async function adminFetch(path, token, options = {}) {
    const res = await fetch(path, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            ...(options.headers || {}),
        },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new Error(data.error || 'Erreur serveur.');
    }
    return data;
}

export default function AdminApp() {
    const [token, setToken] = useState('');
    const [tokenInput, setTokenInput] = useState('');
    const [tab, setTab] = useState('products');
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(emptyProduct());

    useEffect(() => {
        document.title = 'Admin — Hakkilo XR';
        const meta = document.querySelector('meta[name="robots"]');
        if (meta) meta.setAttribute('content', 'noindex, nofollow');
    }, []);

    const authed = token.length > 0;

    const loadProducts = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const data = await adminFetch('/api/admin/products', token);
            setProducts(data.products || []);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, [token]);

    const loadOrders = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const data = await adminFetch('/api/admin/orders', token);
            setOrders(data.orders || []);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        if (!authed) return;
        if (tab === 'products') loadProducts();
        else loadOrders();
    }, [authed, tab, loadProducts, loadOrders]);

    const handleLogin = (e) => {
        e.preventDefault();
        setToken(tokenInput.trim());
        setMessage('');
        setError('');
    };

    const startCreate = () => {
        setEditing('new');
        setForm(emptyProduct());
    };

    const startEdit = (p) => {
        setEditing(p.id);
        setForm({
            ...p,
            platformConfig: p.platformConfig || { label: '' },
            priceCents: p.priceCents ?? '',
            active: Boolean(p.active),
        });
    };

    const saveProduct = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        const payload = {
            ...form,
            scale: Number(form.scale),
            stock: Number(form.stock),
            priceCents: form.priceCents === '' ? null : Number(form.priceCents),
            platformConfig: { label: form.platformConfig?.label || form.title },
            active: form.active ? 1 : 0,
        };

        try {
            if (editing === 'new') {
                await adminFetch('/api/admin/products', token, {
                    method: 'POST',
                    body: JSON.stringify(payload),
                });
                setMessage('Produit créé.');
            } else {
                await adminFetch(`/api/admin/products/${encodeURIComponent(editing)}`, token, {
                    method: 'PUT',
                    body: JSON.stringify(payload),
                });
                setMessage('Produit mis à jour.');
            }
            setEditing(null);
            await loadProducts();
        } catch (err) {
            setError(err.message);
        }
    };

    const deactivateProduct = async (id) => {
        if (!window.confirm('Désactiver ce produit ?')) return;
        setError('');
        try {
            await adminFetch(`/api/admin/products/${encodeURIComponent(id)}`, token, {
                method: 'DELETE',
            });
            setMessage('Produit désactivé.');
            await loadProducts();
        } catch (err) {
            setError(err.message);
        }
    };

    const formatEuros = useMemo(() => (cents) => {
        if (cents == null) return '—';
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(cents / 100);
    }, []);

    if (!authed) {
        return (
            <div className="admin-app admin-app--login">
                <div className="admin-card">
                    <h1>Back-office Hakkilo</h1>
                    <p>Connexion par jeton administrateur (session uniquement, jamais enregistré).</p>
                    <form onSubmit={handleLogin}>
                        <label htmlFor="admin-token">Jeton</label>
                        <input
                            id="admin-token"
                            type="password"
                            autoComplete="off"
                            value={tokenInput}
                            onChange={(ev) => setTokenInput(ev.target.value)}
                            required
                        />
                        <button type="submit" className="admin-btn admin-btn--primary">
                            Entrer
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-app">
            <header className="admin-header">
                <h1>Catalogue & commandes</h1>
                <nav className="admin-tabs">
                    <button
                        type="button"
                        className={tab === 'products' ? 'active' : ''}
                        onClick={() => setTab('products')}
                    >
                        Produits
                    </button>
                    <button
                        type="button"
                        className={tab === 'orders' ? 'active' : ''}
                        onClick={() => setTab('orders')}
                    >
                        Commandes
                    </button>
                </nav>
            </header>

            {message && <p className="admin-banner admin-banner--ok" role="status">{message}</p>}
            {error && <p className="admin-banner admin-banner--err" role="alert">{error}</p>}
            {loading && <p className="admin-loading">Chargement…</p>}

            {tab === 'products' && (
                <section className="admin-section">
                    <div className="admin-toolbar">
                        <button type="button" className="admin-btn" onClick={startCreate}>
                            Nouveau produit
                        </button>
                    </div>

                    <div className="admin-table-wrap">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Titre</th>
                                    <th>Stock</th>
                                    <th>Prix</th>
                                    <th>Actif</th>
                                    <th />
                                </tr>
                            </thead>
                            <tbody>
                                {products.map((p) => (
                                    <tr key={p.id}>
                                        <td>{p.title}</td>
                                        <td>{p.stock}</td>
                                        <td>{formatEuros(p.priceCents)}</td>
                                        <td>{p.active ? 'Oui' : 'Non'}</td>
                                        <td>
                                            <button type="button" onClick={() => startEdit(p)}>Modifier</button>
                                            {p.active ? (
                                                <button type="button" onClick={() => deactivateProduct(p.id)}>
                                                    Désactiver
                                                </button>
                                            ) : null}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {editing && (
                        <form className="admin-form" onSubmit={saveProduct}>
                            <h2>{editing === 'new' ? 'Créer un produit' : `Modifier ${editing}`}</h2>
                            {editing === 'new' && (
                                <label>
                                    ID
                                    <input
                                        value={form.id}
                                        onChange={(ev) => setForm({ ...form, id: ev.target.value })}
                                        required
                                    />
                                </label>
                            )}
                            <label>
                                Titre
                                <input
                                    value={form.title}
                                    onChange={(ev) => setForm({ ...form, title: ev.target.value })}
                                    required
                                />
                            </label>
                            <label>
                                Catégorie
                                <input
                                    value={form.category}
                                    onChange={(ev) => setForm({ ...form, category: ev.target.value })}
                                    required
                                />
                            </label>
                            <label>
                                Label plateforme
                                <input
                                    value={form.platformConfig?.label || ''}
                                    onChange={(ev) => setForm({
                                        ...form,
                                        platformConfig: { label: ev.target.value },
                                    })}
                                    required
                                />
                            </label>
                            <label>
                                Sous-titre / date
                                <input
                                    value={form.date}
                                    onChange={(ev) => setForm({ ...form, date: ev.target.value })}
                                    required
                                />
                            </label>
                            <label>
                                Description
                                <textarea
                                    value={form.description}
                                    onChange={(ev) => setForm({ ...form, description: ev.target.value })}
                                    required
                                />
                            </label>
                            <label>
                                URL CTA démo
                                <input
                                    value={form.url}
                                    onChange={(ev) => setForm({ ...form, url: ev.target.value })}
                                    required
                                />
                            </label>
                            <label>
                                Libellé CTA
                                <input
                                    value={form.ctaLabel}
                                    onChange={(ev) => setForm({ ...form, ctaLabel: ev.target.value })}
                                    required
                                />
                            </label>
                            <label>
                                Stock
                                <input
                                    type="number"
                                    min="0"
                                    value={form.stock}
                                    onChange={(ev) => setForm({ ...form, stock: ev.target.value })}
                                    required
                                />
                            </label>
                            <label>
                                Prix (centimes)
                                <input
                                    type="number"
                                    min="0"
                                    value={form.priceCents}
                                    onChange={(ev) => setForm({ ...form, priceCents: ev.target.value })}
                                />
                            </label>
                            <label className="admin-check">
                                <input
                                    type="checkbox"
                                    checked={Boolean(form.active)}
                                    onChange={(ev) => setForm({ ...form, active: ev.target.checked })}
                                />
                                Actif
                            </label>
                            <div className="admin-form-actions">
                                <button type="submit" className="admin-btn admin-btn--primary">Enregistrer</button>
                                <button type="button" className="admin-btn" onClick={() => setEditing(null)}>
                                    Annuler
                                </button>
                            </div>
                        </form>
                    )}
                </section>
            )}

            {tab === 'orders' && (
                <section className="admin-section">
                    <div className="admin-table-wrap">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Produit</th>
                                    <th>Qté</th>
                                    <th>Montant</th>
                                    <th>Session Stripe</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((o) => (
                                    <tr key={o.stripeSessionId || o.id}>
                                        <td>{o.createdAt}</td>
                                        <td>{o.productId}</td>
                                        <td>{o.quantity}</td>
                                        <td>{formatEuros(o.amountCents)}</td>
                                        <td className="admin-mono">{o.stripeSessionId}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}
        </div>
    );
}
