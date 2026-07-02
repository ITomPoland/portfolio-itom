/**
 * Boutique & Exposition — showcase product data.
 *
 * Each entry doubles as the payload passed straight to openOverlay()/GlobalOverlay.jsx
 * (title/description/date/url/ctaLabel/platformConfig), plus a couple of 3D-placement-only
 * fields (category → which model to render, scale). Swap `category` for a `modelPath` +
 * FurnitureModel once a real GLB is sourced for a given product — the overlay fields don't
 * need to change.
 */

export const PRODUCTS = [
    {
        id: 'headset-01',
        category: 'headset',
        scale: 1,
        platformConfig: { label: 'Casque VR' },
        title: 'Hakkilo One',
        date: 'Casque VR autonome',
        description: "Notre casque de réalité virtuelle autonome, pensé pour l'exploration immersive et la formation professionnelle : suivi 6 degrés de liberté, résolution 4K par œil, 3h d'autonomie.",
        url: '#contact',
        ctaLabel: 'Demander une démo ↗',
    },
    {
        id: 'glasses-01',
        category: 'glasses',
        scale: 1,
        platformConfig: { label: 'Lunettes connectées' },
        title: 'Hakkilo Lens',
        date: 'Réalité augmentée légère',
        description: "Des lunettes connectées légères pour des expériences de réalité augmentée au quotidien : affichage discret, autonomie toute la journée, compagnon idéal du casque Hakkilo One.",
        url: '#contact',
        ctaLabel: 'Demander une démo ↗',
    },
    {
        id: 'console-01',
        category: 'console',
        scale: 1,
        platformConfig: { label: 'Console de jeu' },
        title: 'Hakkilo Play',
        date: 'Console de jeu compacte',
        description: "Une console compacte pensée pour les expériences interactives présentées en boutique et en formation, compatible avec l'ensemble du catalogue Hakkilo XR.",
        url: '#contact',
        ctaLabel: 'Demander une démo ↗',
    },
];
