/**
 * Texture Preload List - ALL textures for the entire experience
 * Everything loads during the initial preloader for zero stutter when entering rooms.
 */

// Entrance scene textures
export const ENTRANCE_TEXTURES = [
    // Core
    '/textures/paper-texture.webp',
    // Doors
    '/textures/doors/frame_sketch.webp',
    '/textures/doors/door_left_sketch.webp',
    '/textures/doors/door_right_sketch.webp',
    '/textures/doors/handle_left_sketch.webp',
    '/textures/doors/handle_right_sketch.webp',
    '/textures/doors/door_back_left_sketch.webp',
    '/textures/doors/pien.webp',
    // Environment
    '/textures/entrance/wall_bricks_2.webp',
    '/textures/entrance/stone-path.webp',
    '/textures/entrance/floor_paper.webp',
    '/textures/entrance/belka.webp',
    '/textures/entrance/sign.webp',
    // Characters/Objects
    '/textures/entrance/cat_front_body.webp',
    '/textures/entrance/window_sketch.webp',
    '/textures/entrance/avatar_window.webp',
    '/textures/entrance/tree_sketch.webp',
    '/textures/entrance/mouse_hanging.webp',
    '/textures/entrance/pot_with_duck.webp',
    '/textures/entrance/bug_sketch.webp',
    '/textures/entrance/speech_bubble.webp',
    // Images
    '/images/ink-splash.webp',
];

// Corridor scene textures
export const CORRIDOR_TEXTURES = [
    // Walls/Floor/Ceiling
    '/textures/corridor/wall_texture.webp',
    '/textures/corridor/kawalekpodlogi.webp',
    '/textures/corridor/texturadoprogow.webp',
    '/textures/corridor/texturadrewnadonozekbiurka.webp',
    '/textures/corridor/ceiling_texture.webp',
    // Double doors (end of corridor)
    '/textures/corridor/doors/frame_sketch.webp',
    '/textures/corridor/doors/doorrleft.webp',
    '/textures/corridor/doors/dorright.webp',
    '/textures/corridor/doors/handle_left_sketch.webp',
    '/textures/corridor/doors/handle_right_sketch.webp',
    '/textures/corridor/doors/pien.webp',
    // Single side doors
    '/textures/corridor/doors/ramkasingledoors.webp',
    '/textures/corridor/doors/klamkadodrzwi.webp',
    '/textures/corridor/doors/backsingledoors.webp',
    '/textures/corridor/doors/drzwiprojekty.webp',
    '/textures/corridor/doors/drzwisocial.webp',
    '/textures/corridor/doors/drzwiabout.webp',
    '/textures/corridor/doors/drzwikontakt.webp',
    '/textures/corridor/doors/drzwiprojekty_painted.webp',
    '/textures/corridor/doors/drzwisocial_painted.webp',
    '/textures/corridor/doors/drzwiabout_painted.webp',
    '/textures/corridor/doors/drzwikontakt_painted.webp',
    // Signs
    '/textures/corridor/pustatabliczka.webp',
    // Decorations
    '/textures/corridor/decorations/while_true_loop.webp',
    '/textures/corridor/decorations/coffee_debug.webp',
    '/textures/corridor/decorations/idea_process.webp',
    '/textures/corridor/decorations/paper_ball.webp',
    '/textures/corridor/decorations/paper_airplane.webp',
    '/textures/corridor/decorations/pencil.webp',
    '/textures/corridor/decorations/coffee_cup.webp',
    // CorridorDecorations - frames, furniture, lamps
    '/textures/corridor/ramkanazdjecieduza.webp',
    '/textures/corridor/ramkanazdjecieduza_painted.webp',
    '/textures/corridor/ramkanazdjeciemala.webp',
    '/textures/corridor/drzewkowdoniczce.webp',
    '/textures/corridor/kratkawentylacyjna.webp',
    '/textures/corridor/kwiatekwdoniczce.webp',
    '/textures/corridor/kratanalampy.webp',
    '/textures/corridor/bokilampy.webp',
    '/textures/corridor/gorastolika.webp',
    '/textures/corridor/szafkaprzod.webp',
    '/textures/corridor/szafkaprzodgora.webp',
    '/textures/corridor/rysuneknaobraz1.webp',
    '/textures/corridor/rysuneknaobrazek3.webp',
    // DoorSection extras
    '/textures/corridor/strzalka.webp',
    '/textures/corridor/doors/door_back.webp',
    '/textures/corridor/doors/klamkadodrzwi_painted.webp',
];

// Standard HTML Image assets (preloaded via new Image() in App.jsx)
export const IMAGE_ASSETS = [
    '/images/ink-splash.webp',
    '/images/map.webp',
    '/images/map_about_painted.webp',
    '/images/map_contact_painted.webp',
    '/images/map_gallery_painted.webp',
    '/images/map_studio_painted.webp',
    '/images/pin.webp',
    '/images/pin-slot.webp',
];

// Additional textures from App.jsx and avatar animations
export const UI_TEXTURES = [
    '/textures/corridor/avatar_anim/1.webp',
    '/textures/corridor/avatar_anim/2.webp',
    '/textures/corridor/avatar_anim/3.webp',
    '/textures/corridor/avatar_anim/4.webp',
    '/textures/corridor/avatar_anim/5.webp',
    '/textures/corridor/avatar_anim/6.webp',
    '/textures/corridor/avatar_anim/7.webp',
    '/textures/corridor/avatar_anim/8.webp',
    '/textures/corridor/avatar_anim/9.webp',
];

// ============================================
// ROOM TEXTURES - Preloaded for instant room entry
// ============================================

// Gallery Room — immersive redesign (Fable 017) uses procedural CanvasTextures.
// Former copyrighted template assets (monetune / timberkitty / domki / …) are
// no longer referenced by GalleryRoom.jsx. Keep arrays empty so preload does
// not fetch purged / illegal textures. Real project photos → agy/nanobanana 2.
export const GALLERY_TEXTURES_BASE = [];

export const GALLERY_TEXTURES_VERSIONED = [];

export const GALLERY_TEXTURES = [
    ...GALLERY_TEXTURES_BASE,
    ...GALLERY_TEXTURES_VERSIONED.flatMap(name => [
        `/textures/gallery/${name}.webp`,
        name === 'csslogo' ? `/textures/gallery/css3logo_painted.webp` : `/textures/gallery/${name}_painted.webp`
    ])
];

// Contact Room textures (loaded via useTexture / drei)
export const CONTACT_TEXTURES = [
    '/textures/contact/faletopdown.webp',
    '/textures/contact/molo.webp',
    '/textures/contact/latarnia.webp',
    '/textures/contact/statek.webp',
    '/textures/contact/paper_form.webp',
    '/textures/contact/send_button.webp',
    '/textures/contact/beczka.webp',
    '/textures/contact/beczka_painted.webp',
];

// About Room textures (loaded via useLoader(TextureLoader))
export const ABOUT_TEXTURES = [
    // Avatar
    '/textures/about/awatarnachmurce.webp',
    // Awards
    '/textures/about/SOTY.webp',
    '/textures/about/SOTY_painted.webp',
    '/textures/about/SOTD.webp',
    '/textures/about/SOTD_painted.webp',
    '/textures/about/SOTM.webp',
    '/textures/about/SOTM_painted.webp',
    '/textures/about/button.webp',
    '/textures/about/button_painted.webp',
    // Award images (for overlay)
    // Journey islands
    '/textures/about/uowyspa.webp',
    '/textures/about/freelancewyspa.webp',
    // Skill balloons - large
    '/textures/about/reactduzybalon.webp',
    '/textures/about/reactduzybalon_painted.webp',
    '/textures/about/threejsduzybalon.webp',
    '/textures/about/threejsduzybalon_painted.webp',
    '/textures/about/GSAPduzybalon.webp',
    '/textures/about/GSAPduzybalon_painted.webp',
    // Skill balloons - medium
    '/textures/about/JSSREDNIBALON.webp',
    '/textures/about/JSSREDNIBALON_painted.webp',
    '/textures/about/csssrednibalon.webp',
    '/textures/about/csssrednibalon_painted.webp',
    '/textures/about/nextjssrednibalon.webp',
    '/textures/about/nextjssrednibalon_painted.webp',
    // Skill balloons - small
    '/textures/about/htmlmalybalon.webp',
    '/textures/about/htmlmalybalon_painted.webp',
    '/textures/about/gitmalybalon.webp',
    '/textures/about/gitmalybalon_painted.webp',
    '/textures/about/figmamalybalon.webp',
    '/textures/about/figmamalybalon_painted.webp',
    '/textures/about/firebasemalybalon.webp',
    '/textures/about/firebasemalybalon_painted.webp',
    // Clouds
    '/textures/clouds/1131c3eb-dfae-423f-924b-ff39d8ccd6dc.webp',
    '/textures/clouds/254b8ec8-d6f7-4275-956f-7bab65b2ce2d.webp',
    '/textures/clouds/2cc88dd1-483c-466d-b07e-f8308c61ccbe.webp',
    '/textures/clouds/5606fcc0-3252-447d-a58a-7bcbac73229a.webp',
    '/textures/clouds/7882dc72-3d01-41fb-ac0e-d07b0184ebc1.webp',
    '/textures/clouds/9b2ca72f-7bd0-473b-ba6e-dd9e0eb79d35.webp',
    '/textures/clouds/c83293c6-d90c-4a32-8d9d-5ac9af7e2296.webp',
    '/textures/clouds/f6e358bc-d27c-41dd-95f4-6787a835c41e.webp',
];

// Studio Room textures (loaded via useLoader(TextureLoader))
export const STUDIO_TEXTURES = [
    // Monitor (blog)
    '/textures/studio/monitor_front.webp',
    '/textures/studio/monitor_front_painted.webp',
    '/textures/studio/monitor_back.webp',
    '/textures/studio/monitor_back_painted.webp',
    '/textures/studio/monitor_top.webp',
    '/textures/studio/monitor_top_painted.webp',
    '/textures/studio/monitor_bottom.webp',
    '/textures/studio/monitor_bottom_painted.webp',
    '/textures/studio/monitor_left.webp',
    '/textures/studio/monitor_left_painted.webp',
    '/textures/studio/monitor_right.webp',
    '/textures/studio/monitor_right_painted.webp',
    // TV (youtube)
    '/textures/studio/tv_front.webp',
    '/textures/studio/tv_front_painted.webp',
    '/textures/studio/tv_back.webp',
    '/textures/studio/tv_back_painted.webp',
    '/textures/studio/tv_top.webp',
    '/textures/studio/tv_top_painted.webp',
    '/textures/studio/tv_bottom.webp',
    '/textures/studio/tv_bottom_painted.webp',
    '/textures/studio/tv_side.webp',
    '/textures/studio/tv_side_painted.webp',
    // Phone (tiktok)
    '/textures/studio/phone_front.webp',
    '/textures/studio/phone_front_painted.webp',
    '/textures/studio/phone_back.webp',
    '/textures/studio/phone_back_painted.webp',
    '/textures/studio/phone_side.webp',
    '/textures/studio/phone_side_painted.webp',
    // Custom content front textures
    '/textures/studio/monitorfront_postnafbdoublewinner.webp',
    '/textures/studio/monitorfront_postnafbdoublewinner_painted.webp',
    '/textures/studio/phonefront_followmeontiktok.webp',
    '/textures/studio/phonefront_followmeontiktok_painted.webp',
    '/textures/studio/tvfront_filmikedytowaniezdjec.webp',
    '/textures/studio/tvfront_filmikedytowaniezdjec_painted.webp',
    '/textures/studio/tvfront_filmikprojektdlamultiego.webp',
    '/textures/studio/tvfront_filmikprojektdlamultiego_painted.webp',
];

// ============================================
// COMBINED EXPORTS
// ============================================

// Textures loaded via useTexture (drei) - entrance, corridor, UI, gallery, contact
export const PRELOAD_ALL = [
    ...ENTRANCE_TEXTURES,
    ...CORRIDOR_TEXTURES,
    ...UI_TEXTURES,
    ...GALLERY_TEXTURES,
    ...CONTACT_TEXTURES,
    ...IMAGE_ASSETS,
];


// Textures loaded via useLoader(TextureLoader) - about, studio
export const PRELOAD_LOADER = [
    ...ABOUT_TEXTURES,
    ...STUDIO_TEXTURES,
];

/**
 * Filters the preload list based on whether the device supports hover (desktop) 
 * or is a touch-only device (mobile/tablet).
 * @param {string[]} list The list of texture paths to filter
 * @param {boolean} usePainted Whether to prioritize _painted versions
 * @returns {string[]} The filtered list
 */
export const filterTexturesByDevice = (list, usePainted) => {
    // 1. Identify all paths that have a _painted version available
    const paintedVersions = new Set(list.filter(p => p.includes('_painted.webp')));
    
    // Also include the special css3logo case
    const hasCss3Painted = list.some(p => p.includes('css3logo_painted.webp'));
    
    return list.filter(path => {
        const isPainted = path.includes('_painted.webp');
        const isCss3 = path.includes('css3logo_painted.webp');
        
        // Find the "standard" version for this path if it's a painted one
        let standardVersion = null;
        if (isPainted) {
            standardVersion = path.replace('_painted.webp', '.webp');
        } else if (isCss3) {
            standardVersion = path.replace('css3logo_painted.webp', 'csslogo.webp');
        } else {
            // Check if this standard path HAS a painted version in the list
            const pVersion = path.replace('.webp', '_painted.webp');
            const css3Version = path.replace('csslogo.webp', 'css3logo_painted.webp');
            if (list.includes(pVersion) || (path.includes('csslogo.webp') && hasCss3Painted)) {
                // Return true to keep the standard version! Both desktop and mobile need it.
                return true; 
            }
            // If it doesn't have a painted version, it's a static texture (always keep)
            return true;
        }

        // It's a painted version
        return usePainted;
    });
};
