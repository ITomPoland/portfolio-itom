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
    {
        id: 'drone-01',
        category: 'drone',
        scale: 1,
        platformConfig: { label: 'Drone photogrammétrique' },
        title: 'Hakkilo ScanFly',
        date: 'Captation 3D & Photogrammétrie',
        description: "Un drone autonome équipé de capteurs LiDAR et caméras haute résolution pour la numérisation 3D d'environnements réels à grande échelle, facilitant la création de jumeaux numériques.",
        url: '#contact',
        ctaLabel: 'Demander une démo ↗',
    },
    {
        id: 'scanner-01',
        category: 'scanner3d',
        scale: 1,
        platformConfig: { label: 'Scanner 3D' },
        title: 'Hakkilo ScanHand',
        date: 'Scanner 3D portable',
        description: "Scanner laser portable de qualité métrologique. Permet de capturer instantanément des objets physiques avec une précision submillimétrique pour leur intégration dans des scènes XR.",
        url: '#contact',
        ctaLabel: 'Demander une démo ↗',
    },
    {
        id: 'controller-01',
        category: 'controller',
        scale: 1,
        platformConfig: { label: 'Contrôleurs XR' },
        title: 'Hakkilo Touch',
        date: 'Contrôleurs de mouvement',
        description: "Paire de contrôleurs ergonomiques pour le casque Hakkilo One. Offrent un suivi infrarouge de haute précision et un retour tactile nuancé pour des interactions naturelles dans l'espace virtuel.",
        url: '#contact',
        ctaLabel: 'Demander une démo ↗',
    },
    {
        id: 'basestation-01',
        category: 'basestation',
        scale: 1,
        platformConfig: { label: 'Base de tracking' },
        title: 'Hakkilo Anchor',
        date: 'Borne de suivi spatial',
        description: "Borne de tracking spatial à balayage laser. Assure une synchronisation millimétrique et une couverture étendue pour les déploiements de réalité virtuelle en salle multi-utilisateurs.",
        url: '#contact',
        ctaLabel: 'Demander une démo ↗',
    },
    {
        id: 'hapticglove-01',
        category: 'hapticglove',
        scale: 1,
        platformConfig: { label: 'Gant haptique' },
        title: 'Hakkilo Glove',
        date: 'Gant à retour de force',
        description: "Gant haptique professionnel permettant de ressentir les textures, les formes et la résistance des objets virtuels manipulés, idéal pour les entraînements de chirurgie et de maintenance industrielle.",
        url: '#contact',
        ctaLabel: 'Demander une démo ↗',
    },
];
