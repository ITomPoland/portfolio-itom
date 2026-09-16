export const LOCAL_BODY_FONT = '/fonts/HarmonyOS-Sans-SC-Regular-Site.ttf';
export const LOCAL_BOLD_FONT = '/fonts/HarmonyOS-Sans-SC-Bold-Site.ttf';

const CHINESE_TEXT = /[\u2e80-\u9fff\uf900-\ufaff\uff01-\uff60]/u;

// Troika does not use CSS font-family fallbacks. Route Chinese to an actual
// local CJK font instead of asking the remote Unicode font resolver for glyphs.
export function resolveTextFont(text, font, fontWeight) {
    const isLocalChinese = /HarmonyOS-Sans-SC/.test(font || '');
    if (!isLocalChinese && !CHINESE_TEXT.test(text)) return font;
    const bold = fontWeight === 'bold' || Number(fontWeight) >= 600
        || (isLocalChinese && /Bold/.test(font));
    return bold ? LOCAL_BOLD_FONT : LOCAL_BODY_FONT;
}
