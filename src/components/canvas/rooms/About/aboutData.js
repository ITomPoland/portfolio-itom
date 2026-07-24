/**
 * About / Présentation — content payloads for the immersive atelier room.
 *
 * Each entry doubles as the payload passed to openOverlay()/GlobalOverlay.jsx
 * (title / description / date / url / ctaLabel / platformConfig). French copy
 * written for Hakkilo XR (Miora Brief 5 — Section A).
 */

export const VISION = {
    id: 'vision',
    platformConfig: { label: 'Notre Vision' },
    title: 'Hakkilo XR',
    date: 'Depuis 2021',
    description:
        "Rendre la réalité étendue accessible aux entreprises. Pas de gadget, pas de gimmick — des outils concrets qui transforment la formation, la collaboration et la présentation.",
    url: '#contact',
    ctaLabel: 'Nous contacter ↗',
};

export const TEAM = [
    {
        id: 'alex',
        platformConfig: { label: 'Équipe' },
        title: 'Alex M.',
        date: 'Fondateur & Direction créative',
        description:
            "Pilote la vision Hakkilo XR et les projets immersifs de bout en bout — de l'idée au déploiement.",
        url: '#contact',
        ctaLabel: 'Écrire à l\'équipe ↗',
    },
    {
        id: 'sarah',
        platformConfig: { label: 'Équipe' },
        title: 'Sarah K.',
        date: 'Développement XR',
        description:
            "Ingénieure WebXR / Three.js. Transforme les prototypes en expériences fluides, performantes et accessibles.",
        url: '#contact',
        ctaLabel: 'Écrire à l\'équipe ↗',
    },
    {
        id: 'youssef',
        platformConfig: { label: 'Équipe' },
        title: 'Youssef B.',
        date: 'Design & UX',
        description:
            "Conçoit les parcours immersifs et l'identité visuelle — du croquis papier à la scène 3D navigable.",
        url: '#contact',
        ctaLabel: 'Écrire à l\'équipe ↗',
    },
    {
        id: 'clara',
        platformConfig: { label: 'Équipe' },
        title: 'Clara D.',
        date: 'Production & Clients',
        description:
            "Assure le lien avec les clients, la production des livrables et le suivi des déploiements sur site.",
        url: '#contact',
        ctaLabel: 'Écrire à l\'équipe ↗',
    },
];

export const METHOD = [
    {
        id: 'listen',
        platformConfig: { label: 'Démarche' },
        title: '1 · Écouter',
        date: 'Étape 1',
        description:
            "Comprendre le besoin métier avant de parler tech. Workshops, observations terrain, cadrage des objectifs XR.",
        url: '#contact',
        ctaLabel: 'Discuter d\'un projet ↗',
    },
    {
        id: 'prototype',
        platformConfig: { label: 'Démarche' },
        title: '2 · Prototyper',
        date: 'Étape 2',
        description:
            "Itérations rapides en 3D temps réel. Valider l'expérience avec les utilisateurs avant d'industrialiser.",
        url: '#contact',
        ctaLabel: 'Discuter d\'un projet ↗',
    },
    {
        id: 'deploy',
        platformConfig: { label: 'Démarche' },
        title: '3 · Déployer',
        date: 'Étape 3',
        description:
            "Mise en production, formation des équipes, mesure d'impact. Un outil vivant, pas une démo jetable.",
        url: '#contact',
        ctaLabel: 'Discuter d\'un projet ↗',
    },
];

export const STATS = {
    id: 'stats',
    platformConfig: { label: 'En chiffres' },
    title: '3 · 12 · 4',
    date: 'Ans · Projets · Secteurs',
    description:
        "Trois ans d'activité, une douzaine de projets livrés, quatre secteurs accompagnés (formation, industrie, culture, retail). Et ce n'est que le début.",
    url: '#contact',
    ctaLabel: 'Voir nos projets ↗',
};
