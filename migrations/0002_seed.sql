-- Generated from productData.js by scripts/generate-product-seed.js.
-- Re-run: node scripts/generate-product-seed.js

INSERT INTO products
    (id, category, scale, platform_config, title, date, description, url, cta_label)
VALUES ('headset-01', 'headset', 1, '{"label":"Casque VR"}', 'Hakkilo One', 'Casque VR autonome', 'Notre casque de réalité virtuelle autonome, pensé pour l''exploration immersive et la formation professionnelle : suivi 6 degrés de liberté, résolution 4K par œil, 3h d''autonomie.', '#contact', 'Demander une démo ↗')
ON CONFLICT(id) DO UPDATE SET
    category = excluded.category,
    scale = excluded.scale,
    platform_config = excluded.platform_config,
    title = excluded.title,
    date = excluded.date,
    description = excluded.description,
    url = excluded.url,
    cta_label = excluded.cta_label,
    updated_at = CURRENT_TIMESTAMP;

INSERT INTO products
    (id, category, scale, platform_config, title, date, description, url, cta_label)
VALUES ('glasses-01', 'glasses', 1, '{"label":"Lunettes connectées"}', 'Hakkilo Lens', 'Réalité augmentée légère', 'Des lunettes connectées légères pour des expériences de réalité augmentée au quotidien : affichage discret, autonomie toute la journée, compagnon idéal du casque Hakkilo One.', '#contact', 'Demander une démo ↗')
ON CONFLICT(id) DO UPDATE SET
    category = excluded.category,
    scale = excluded.scale,
    platform_config = excluded.platform_config,
    title = excluded.title,
    date = excluded.date,
    description = excluded.description,
    url = excluded.url,
    cta_label = excluded.cta_label,
    updated_at = CURRENT_TIMESTAMP;

INSERT INTO products
    (id, category, scale, platform_config, title, date, description, url, cta_label)
VALUES ('console-01', 'console', 1, '{"label":"Console de jeu"}', 'Hakkilo Play', 'Console de jeu compacte', 'Une console compacte pensée pour les expériences interactives présentées en boutique et en formation, compatible avec l''ensemble du catalogue Hakkilo XR.', '#contact', 'Demander une démo ↗')
ON CONFLICT(id) DO UPDATE SET
    category = excluded.category,
    scale = excluded.scale,
    platform_config = excluded.platform_config,
    title = excluded.title,
    date = excluded.date,
    description = excluded.description,
    url = excluded.url,
    cta_label = excluded.cta_label,
    updated_at = CURRENT_TIMESTAMP;

INSERT INTO products
    (id, category, scale, platform_config, title, date, description, url, cta_label)
VALUES ('drone-01', 'drone', 1, '{"label":"Drone photogrammétrique"}', 'Hakkilo ScanFly', 'Captation 3D & Photogrammétrie', 'Un drone autonome équipé de capteurs LiDAR et caméras haute résolution pour la numérisation 3D d''environnements réels à grande échelle, facilitant la création de jumeaux numériques.', '#contact', 'Demander une démo ↗')
ON CONFLICT(id) DO UPDATE SET
    category = excluded.category,
    scale = excluded.scale,
    platform_config = excluded.platform_config,
    title = excluded.title,
    date = excluded.date,
    description = excluded.description,
    url = excluded.url,
    cta_label = excluded.cta_label,
    updated_at = CURRENT_TIMESTAMP;

INSERT INTO products
    (id, category, scale, platform_config, title, date, description, url, cta_label)
VALUES ('scanner-01', 'scanner3d', 1, '{"label":"Scanner 3D"}', 'Hakkilo ScanHand', 'Scanner 3D portable', 'Scanner laser portable de qualité métrologique. Permet de capturer instantanément des objets physiques avec une précision submillimétrique pour leur intégration dans des scènes XR.', '#contact', 'Demander une démo ↗')
ON CONFLICT(id) DO UPDATE SET
    category = excluded.category,
    scale = excluded.scale,
    platform_config = excluded.platform_config,
    title = excluded.title,
    date = excluded.date,
    description = excluded.description,
    url = excluded.url,
    cta_label = excluded.cta_label,
    updated_at = CURRENT_TIMESTAMP;

INSERT INTO products
    (id, category, scale, platform_config, title, date, description, url, cta_label)
VALUES ('controller-01', 'controller', 1, '{"label":"Contrôleurs XR"}', 'Hakkilo Touch', 'Contrôleurs de mouvement', 'Paire de contrôleurs ergonomiques pour le casque Hakkilo One. Offrent un suivi infrarouge de haute précision et un retour tactile nuancé pour des interactions naturelles dans l''espace virtuel.', '#contact', 'Demander une démo ↗')
ON CONFLICT(id) DO UPDATE SET
    category = excluded.category,
    scale = excluded.scale,
    platform_config = excluded.platform_config,
    title = excluded.title,
    date = excluded.date,
    description = excluded.description,
    url = excluded.url,
    cta_label = excluded.cta_label,
    updated_at = CURRENT_TIMESTAMP;

INSERT INTO products
    (id, category, scale, platform_config, title, date, description, url, cta_label)
VALUES ('basestation-01', 'basestation', 1, '{"label":"Base de tracking"}', 'Hakkilo Anchor', 'Borne de suivi spatial', 'Borne de tracking spatial à balayage laser. Assure une synchronisation millimétrique et une couverture étendue pour les déploiements de réalité virtuelle en salle multi-utilisateurs.', '#contact', 'Demander une démo ↗')
ON CONFLICT(id) DO UPDATE SET
    category = excluded.category,
    scale = excluded.scale,
    platform_config = excluded.platform_config,
    title = excluded.title,
    date = excluded.date,
    description = excluded.description,
    url = excluded.url,
    cta_label = excluded.cta_label,
    updated_at = CURRENT_TIMESTAMP;

INSERT INTO products
    (id, category, scale, platform_config, title, date, description, url, cta_label)
VALUES ('hapticglove-01', 'hapticglove', 1, '{"label":"Gant haptique"}', 'Hakkilo Glove', 'Gant à retour de force', 'Gant haptique professionnel permettant de ressentir les textures, les formes et la résistance des objets virtuels manipulés, idéal pour les entraînements de chirurgie et de maintenance industrielle.', '#contact', 'Demander une démo ↗')
ON CONFLICT(id) DO UPDATE SET
    category = excluded.category,
    scale = excluded.scale,
    platform_config = excluded.platform_config,
    title = excluded.title,
    date = excluded.date,
    description = excluded.description,
    url = excluded.url,
    cta_label = excluded.cta_label,
    updated_at = CURRENT_TIMESTAMP;
