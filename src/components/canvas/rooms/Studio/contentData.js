/**
 * Studio Content Data
 * 
 * This file contains all content items for the Studio monitor tower.
 * Each item will be displayed on a monitor in the tower.
 * 
 * Platforms: 'youtube', 'blog', 'tiktok'
 */

export const PLATFORM_CONFIG = {
    youtube: {
        color: '#FF0000',
        accentColor: '#cc0000',
        icon: '▶',
        label: 'YouTube',
        shape: 'tv', // Wide CRT style
    },
    blog: {
        color: '#4A90D9',
        accentColor: '#2d6cb5',
        icon: '📝',
        label: 'Blog',
        shape: 'monitor', // Thin desktop monitor
    },
    tiktok: {
        color: '#00F2EA',
        accentColor: '#FF0050',
        icon: '🎵',
        label: 'TikTok',
        shape: 'phone', // Vertical phone
    },
};

// Content data - Rebranded for Hakkilo XR
const RAW_CONTENT_DATA = [
    // ============ YouTube Videos ============
    {
        id: 'yt-001',
        platform: 'youtube',
        title: "Création de l'expérience interactive Hakkilo XR",
        description: "Découvrez les coulisses de la création de la plateforme Hakkilo XR, notre environnement immersif 3D.",
        frontTexture: '/textures/studio/tvfront_filmikprojektdlamultiego.webp',
        paintedFrontTexture: '/textures/studio/tvfront_filmikprojektdlamultiego_painted.webp',
        thumbnail: null,
        url: 'https://hakkilo.africa', // TODO: vrai lien
        date: '2026-01-10',
        views: '1.2K',
        duration: '15:32',
    },
    {
        id: 'yt-002',
        platform: 'youtube',
        title: "Comment l'IA transforme la création d'assets 3D pour le Web",
        description: "Tutoriel complet sur l'utilisation des outils IA pour générer des textures et des modèles optimisés pour les applications WebGL.",
        frontTexture: '/textures/studio/tvfront_filmikedytowaniezdjec.webp',
        paintedFrontTexture: '/textures/studio/tvfront_filmikedytowaniezdjec_painted.webp',
        thumbnail: null,
        url: 'https://hakkilo.africa', // TODO: vrai lien
        date: '2025-10-11',
        views: '121',
        duration: '7:45',
    },
    {
        id: 'yt-003',
        platform: 'youtube',
        title: 'Cours intensif React Three Fiber',
        description: 'Tout ce qu\'il faut savoir pour intégrer de la 3D interactive dans vos applications React.',
        thumbnail: null,
        url: 'https://hakkilo.africa', // TODO: vrai lien
        date: '2025-12-28',
        views: '2.4K',
        duration: '22:10',
    },
    {
        id: 'yt-004',
        platform: 'youtube',
        title: 'Introduction aux Shaders GLSL',
        description: 'Débutez avec l\'écriture de shaders personnalisés pour optimiser vos rendus WebGL.',
        thumbnail: null,
        url: 'https://hakkilo.africa', // TODO: vrai lien
        date: '2025-12-15',
        views: '1.8K',
        duration: '18:33',
    },
    {
        id: 'yt-005',
        platform: 'youtube',
        title: 'Intégration GSAP et Three.js',
        description: 'Animez vos scènes 3D de façon fluide en exploitant les triggers de défilement.',
        thumbnail: null,
        url: 'https://hakkilo.africa', // TODO: vrai lien
        date: '2025-12-01',
        views: '3.1K',
        duration: '20:15',
    },
    {
        id: 'yt-006',
        platform: 'youtube',
        title: 'Création de scènes 3D interactives',
        description: 'Gestion du raycasting, des survols et des interactions utilisateur en 3D.',
        thumbnail: null,
        url: 'https://hakkilo.africa', // TODO: vrai lien
        date: '2025-11-20',
        views: '2.8K',
        duration: '25:00',
    },
    {
        id: 'yt-007',
        platform: 'youtube',
        title: 'Optimisation des performances WebGL',
        description: 'Techniques avancées : réduction des draw calls, instanciation et compression d\'assets.',
        thumbnail: null,
        url: 'https://hakkilo.africa', // TODO: vrai lien
        date: '2025-11-10',
        views: '1.5K',
        duration: '30:22',
    },
    {
        id: 'yt-008',
        platform: 'youtube',
        title: 'Tutoriel Textures Procédurales',
        description: 'Générez vos propres textures dynamiques en utilisant le bruit mathématique de Three.js.',
        thumbnail: null,
        url: 'https://hakkilo.africa', // TODO: vrai lien
        date: '2025-10-28',
        views: '1.9K',
        duration: '18:45',
    },

    // ============ Blog Posts ============
    {
        id: 'blog-001',
        platform: 'blog',
        title: 'Double récompense Site of the Day ! 🏆🏆',
        description: 'Hakkilo XR est fier d\'annoncer que son projet a été doublement primé à l\'international pour son excellence visuelle et technique.',
        frontTexture: '/textures/studio/monitorfront_postnafbdoublewinner.webp',
        paintedFrontTexture: '/textures/studio/monitorfront_postnafbdoublewinner_painted.webp',
        thumbnail: null,
        url: 'https://hakkilo.africa', // TODO: vrai lien
        date: '2026-01-08',
        readTime: '5 min',
    },
    {
        id: 'blog-002',
        platform: 'blog',
        title: 'L\'esthétique du dessin à la main',
        description: 'Comment nous avons créé un style visuel esquissé unique grâce aux shaders personnalisés.',
        thumbnail: null,
        url: 'https://hakkilo.africa', // TODO: vrai lien
        date: '2025-12-20',
        readTime: '8 min',
    },
    {
        id: 'blog-003',
        platform: 'blog',
        title: 'Optimiser la 3D pour le Web',
        description: 'Astuces clés pour maintenir un rendu à 60 images par seconde en toutes circonstances.',
        thumbnail: null,
        url: 'https://hakkilo.africa', // TODO: vrai lien
        date: '2025-12-10',
        readTime: '6 min',
    },
    {
        id: 'blog-004',
        platform: 'blog',
        title: 'Le parcours du Creative Coding',
        description: 'Notre transition du développement web traditionnel vers des expériences interactives immersives.',
        thumbnail: null,
        url: 'https://hakkilo.africa', // TODO: vrai lien
        date: '2025-11-25',
        readTime: '10 min',
    },
    {
        id: 'blog-005',
        platform: 'blog',
        title: 'L\'avenir des expériences Web',
        description: 'Analyse des tendances futures de la 3D interactive et de la réalité mixte sur le web.',
        thumbnail: null,
        url: 'https://hakkilo.africa', // TODO: vrai lien
        date: '2025-11-15',
        readTime: '7 min',
    },
    {
        id: 'blog-006',
        platform: 'blog',
        title: 'Design Systems pour la 3D',
        description: 'Comment structurer une bibliothèque cohérente de composants 3D réutilisables.',
        thumbnail: null,
        url: 'https://hakkilo.africa', // TODO: vrai lien
        date: '2025-11-01',
        readTime: '12 min',
    },
    {
        id: 'blog-007',
        platform: 'blog',
        title: 'L\'accessibilité dans le Web 3D',
        description: 'Conception inclusive et outils d\'accessibilité pour les interfaces en trois dimensions.',
        thumbnail: null,
        url: 'https://hakkilo.africa', // TODO: vrai lien
        date: '2025-10-20',
        readTime: '9 min',
    },
    {
        id: 'blog-008',
        platform: 'blog',
        title: 'L\'audio spatialisé sur le Web',
        description: 'Utiliser l\'audio directionnel pour enrichir l\'immersion sensorielle de vos scènes.',
        thumbnail: null,
        url: 'https://hakkilo.africa', // TODO: vrai lien
        date: '2025-10-10',
        readTime: '6 min',
    },

    // ============ TikToks ============
    {
        id: 'tt-001',
        platform: 'tiktok',
        title: 'Suivez Hakkilo XR sur les réseaux ! ✨',
        description: 'Retrouvez toutes nos astuces de design, de modélisation 3D et de codage créatif.',
        frontTexture: '/textures/studio/phonefront_followmeontiktok.webp',
        paintedFrontTexture: '/textures/studio/phonefront_followmeontiktok_painted.webp',
        thumbnail: null,
        url: 'https://hakkilo.africa', // TODO: vrai lien
        date: '2026-01-09',
        views: '15.2K',
        likes: '1.2K',
    },
    {
        id: 'tt-002',
        platform: 'tiktok',
        title: 'Coder l\'ouverture d\'une porte 🚪',
        description: 'POV : L\'animation fluide d\'une entrée 3D sous Three.js',
        thumbnail: null,
        url: 'https://hakkilo.africa', // TODO: vrai lien
        date: '2026-01-03',
        views: '8.5K',
        likes: '756',
    },
    {
        id: 'tt-003',
        platform: 'tiktok',
        title: 'Quand le shader fonctionne enfin 🎉',
        description: 'La satisfaction absolue après le débuggage de matrices GLSL',
        thumbnail: null,
        url: 'https://hakkilo.africa', // TODO: vrai lien
        date: '2025-12-25',
        views: '22.1K',
        likes: '3.4K',
    },
    {
        id: 'tt-004',
        platform: 'tiktok',
        title: 'Une journée avec l\'équipe WebGL',
        description: 'Découvrez le quotidien de nos développeurs 3D',
        thumbnail: null,
        url: 'https://hakkilo.africa', // TODO: vrai lien
        date: '2025-12-18',
        views: '12.3K',
        likes: '1.1K',
    },
    {
        id: 'tt-005',
        platform: 'tiktok',
        title: 'Intégration React et Three.js 😅',
        description: 'Quand le cycle de vie de React rencontre le rendu 3D',
        thumbnail: null,
        url: 'https://hakkilo.africa', // TODO: vrai lien
        date: '2025-12-12',
        views: '45.2K',
        likes: '5.8K',
    },
    {
        id: 'tt-006',
        platform: 'tiktok',
        title: 'Créer un bouton en 3D interactif 🔘',
        description: 'Intégration de micro-animations sur un bouton R3F',
        thumbnail: null,
        url: 'https://hakkilo.africa', // TODO: vrai lien
        date: '2025-12-05',
        views: '18.7K',
        likes: '2.1K',
    },
    {
        id: 'tt-007',
        platform: 'tiktok',
        title: 'Ce shader a nécessité 3 heures de dev 💀',
        description: 'Mais le résultat en valait largement la peine !',
        thumbnail: null,
        url: 'https://hakkilo.africa', // TODO: vrai lien
        date: '2025-11-28',
        views: '33.4K',
        likes: '4.2K',
    },
    {
        id: 'tt-008',
        platform: 'tiktok',
        title: 'Compilation d\'effets de survol ✨',
        description: 'Nos micro-interactions favorites pour wower l\'utilisateur',
        thumbnail: null,
        url: 'https://hakkilo.africa', // TODO: vrai lien
        date: '2025-11-20',
        views: '28.9K',
        likes: '3.6K',
    },
    {
        id: 'tt-009',
        platform: 'tiktok',
        title: 'Concepts d\'écrans de chargement 🔄',
        description: 'Quelques préchargeurs 3D originaux pour vos applications',
        thumbnail: null,
        url: 'https://hakkilo.africa', // TODO: vrai lien
        date: '2025-11-15',
        views: '19.3K',
        likes: '2.4K',
    },
    {
        id: 'tt-010',
        platform: 'tiktok',
        title: 'Personnalisation du curseur 🖱️',
        description: 'Ajout d\'une physique de suivi sur le pointeur de souris',
        thumbnail: null,
        url: 'https://hakkilo.africa', // TODO: vrai lien
        date: '2025-11-08',
        views: '41.2K',
        likes: '5.1K',
    },
    {
        id: 'tt-011',
        platform: 'tiktok',
        title: 'Effet de défilement parallaxe 🪄',
        description: 'Créer une sensation de profondeur lors du scroll',
        thumbnail: null,
        url: 'https://hakkilo.africa', // TODO: vrai lien
        date: '2025-11-01',
        views: '25.6K',
        likes: '3.0K',
    },
    {
        id: 'tt-012',
        platform: 'tiktok',
        title: 'Animations de texte en 3D 📝',
        description: 'Mettre en valeur la typographie de façon animée',
        thumbnail: null,
        url: 'https://hakkilo.africa', // TODO: vrai lien
        date: '2025-10-25',
        views: '31.8K',
        likes: '4.0K',
    },
];

const ytTextures = ['/textures/studio/tvfront_filmikprojektdlamultiego.webp', '/textures/studio/tvfront_filmikedytowaniezdjec.webp'];
const ytPaintedTextures = ['/textures/studio/tvfront_filmikprojektdlamultiego_painted.webp', '/textures/studio/tvfront_filmikedytowaniezdjec_painted.webp'];
const blogTextures = ['/textures/studio/monitorfront_postnafbdoublewinner.webp'];
const blogPaintedTextures = ['/textures/studio/monitorfront_postnafbdoublewinner_painted.webp'];
const ttTextures = ['/textures/studio/phonefront_followmeontiktok.webp'];
const ttPaintedTextures = ['/textures/studio/phonefront_followmeontiktok_painted.webp'];

let ytIdx = 0, blogIdx = 0, ttIdx = 0;
let ytPIdx = 0, blogPIdx = 0, ttPIdx = 0;

export const CONTENT_DATA = RAW_CONTENT_DATA.map((item) => {
    return {
        ...item,
        frontTexture: item.frontTexture || (
            item.platform === 'youtube' ? ytTextures[ytIdx++ % ytTextures.length] :
                item.platform === 'blog' ? blogTextures[blogIdx++ % blogTextures.length] :
                    ttTextures[ttIdx++ % ttTextures.length]
        ),
        paintedFrontTexture: item.paintedFrontTexture || (
            item.platform === 'youtube' ? ytPaintedTextures[ytPIdx++ % ytPaintedTextures.length] :
                item.platform === 'blog' ? blogPaintedTextures[blogPIdx++ % blogPaintedTextures.length] :
                    ttPaintedTextures[ttPIdx++ % ttPaintedTextures.length]
        )
    };
});

// Helper to get content by platform
export const getContentByPlatform = (platform) => {
    if (platform === 'all') return CONTENT_DATA;
    return CONTENT_DATA.filter(item => item.platform === platform);
};

// Get latest content (for "On Air" indicator)
export const getLatestContent = () => {
    return [...CONTENT_DATA].sort((a, b) => new Date(b.date) - new Date(a.date))[0];
};
