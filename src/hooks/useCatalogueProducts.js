import { useEffect, useState } from 'react';
import { loadProducts, getStaticProducts } from '../utils/catalogue';

/**
 * Boutique products: static first, then silent API refresh when available.
 */
export function useCatalogueProducts() {
    const [products, setProducts] = useState(getStaticProducts);
    const [source, setSource] = useState('static');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        loadProducts()
            .then((list) => {
                if (cancelled) return;
                setProducts(list);
                setSource(list === getStaticProducts() ? 'static' : 'api');
                setError(null);
            })
            .catch(() => {
                if (cancelled) return;
                setProducts(getStaticProducts());
                setSource('static');
                setError('catalogue_fallback');
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => { cancelled = true; };
    }, []);

    return { products, source, loading, error };
}
