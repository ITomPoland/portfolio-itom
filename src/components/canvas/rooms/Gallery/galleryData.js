/**
 * Gallery / La Galerie — project payloads for the immersive exhibition room.
 *
 * Each entry is passed to openOverlay() / GlobalOverlay.jsx
 * (title / description / url / items[] / ctaLabel / platformConfig).
 * French copy for Hakkilo XR (Miora Brief 5 — Section B).
 *
 * Wall canvases are procedural (CanvasTexture) — no copyrighted template
 * textures. Real project photos can later be swapped via agy/nanobanana 2
 * without changing this data contract.
 */

export const PROJECTS = [
    {
        id: 'formation-veolia',
        wall: 'back',
        accent: '#9FE0BB',
        tags: ['Formation', 'VR', 'Industrie'],
        platformConfig: { label: 'Projet' },
        title: 'Formation Sécurité Incendie — Groupe Véolia',
        date: '2024',
        description:
            "Simulation VR de procédures d'évacuation pour 200 collaborateurs. Résultat : temps de réaction réduit de 40 %. Environnements immersifs, scénarios guidés, reporting RH.",
        url: 'https://hakkilo.africa',
        ctaLabel: 'Demander une démo ↗',
        items: [
            { label: 'Scénario A', date: 'Évacuation', image: '' },
            { label: 'Scénario B', date: 'Incendie', image: '' },
            { label: 'Bilan', date: '−40 %', image: '' },
        ],
    },
    {
        id: 'showroom-lefevre',
        wall: 'back',
        accent: '#FFE4B5',
        tags: ['Showroom', 'AR', 'Luxe'],
        platformConfig: { label: 'Projet' },
        title: 'Showroom Virtuel — Maison Lefèvre',
        date: '2024',
        description:
            "Visite immersive d'une collection mobilier haut de gamme. Le client configure couleurs et matériaux en temps réel, depuis le navigateur ou en réalité augmentée.",
        url: 'https://hakkilo.africa',
        ctaLabel: 'Demander une démo ↗',
        items: [
            { label: 'Salon', date: 'Config', image: '' },
            { label: 'Matériaux', date: 'PBR', image: '' },
            { label: 'AR mobile', date: 'iOS/Android', image: '' },
        ],
    },
    {
        id: 'visite-virtuelle',
        wall: 'back',
        accent: '#9FE0BB',
        tags: ['Visite', 'WebXR', 'Culture'],
        platformConfig: { label: 'Projet' },
        title: 'Visite Virtuelle — Musée des Arts',
        date: '2023',
        description:
            "Déambulation libre dans un lieu numérisé en 3D, sans casque ni installation. Points d'intérêt cliquables, audio spatial et accessibilité mobile-first.",
        url: 'https://hakkilo.africa',
        ctaLabel: 'Demander une démo ↗',
        items: [
            { label: 'Salle A', date: 'Scan', image: '' },
            { label: 'Audio', date: 'Spatial', image: '' },
            { label: 'Mobile', date: 'Web', image: '' },
        ],
    },
    {
        id: 'experience-ar',
        wall: 'right',
        accent: '#FFE4B5',
        tags: ['AR', 'Retail', 'Activation'],
        platformConfig: { label: 'Projet' },
        title: 'Expérience AR — Activation Retail',
        date: '2023',
        description:
            "Contenu 3D superposé au monde réel sur mobile : essayage produit, storytelling de marque et mesure d'engagement en magasin.",
        url: 'https://hakkilo.africa',
        ctaLabel: 'Demander une démo ↗',
        items: [
            { label: 'Essayage', date: 'AR', image: '' },
            { label: 'Tracking', date: 'KPI', image: '' },
            { label: 'Campagne', date: 'Retail', image: '' },
        ],
    },
];

/** Featured piece on the central pedestal (rotating). */
export const FEATURED = {
    id: 'featured-formation-vr',
    accent: '#9FE0BB',
    tags: ['Formation', 'VR'],
    platformConfig: { label: 'À la une' },
    title: 'Formation VR — Modules métier',
    date: '2025',
    description:
        "Modules de formation immersive en réalité virtuelle : environnements 3D interactifs pour apprendre par la pratique, conçus pour les entreprises et les écoles.",
    url: 'https://hakkilo.africa',
    ctaLabel: 'Demander une démo ↗',
    items: [
        { label: 'Module 1', date: 'Intro', image: '' },
        { label: 'Module 2', date: 'Pratique', image: '' },
        { label: 'Module 3', date: 'Éval', image: '' },
    ],
};
