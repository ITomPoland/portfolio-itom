/**
 * apply-avatar.mjs
 *
 * 将「吴桐」的真实头像照片批量裁切并覆盖到作品集各头像位：
 *   - public/textures/corridor/avatar_anim/1..9.webp   （走廊走动动画帧，1:1）
 *   - public/textures/entrance/avatar_window.webp       （入口窗，1:1，含 backups 副本）
 *   - public/textures/about/awatarnachmurce.webp        （关于页云上人物，约 2:1，含 backups 副本）
 *
 * 用法：node scripts/apply-avatar.mjs "<头像图片路径>"
 * 默认头像路径为 ChatGPT Image 生成的个人照片。
 */
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const SRC = process.argv[2] || 'C:/Users/DELL/Downloads/ChatGPT Image 2026年8月15日 15_04_09.png';

if (!fs.existsSync(SRC)) {
    console.error(`头像文件不存在: ${SRC}`);
    process.exit(1);
}

/** 读取原文件尺寸（保留原始分辨率，不放大）；读取失败返回 null（调用方给默认值） */
async function sizeOf(file) {
    try {
        const meta = await sharp(file).metadata();
        return { w: meta.width || 1024, h: meta.height || 1024 };
    } catch {
        return null;
    }
}

/** 删除文件（OneDrive/索引器会短暂锁定，最多重试 8 次） */
async function removeIfExists(p) {
    for (let i = 0; i < 8; i++) {
        try {
            if (fs.existsSync(p)) fs.unlinkSync(p);
            return true;
        } catch {
            await new Promise((r) => setTimeout(r, 700));
        }
    }
    return false;
}

/**
 * 生成「透明背景 + 完整人物」头像：
 * 源图自带透明背景（alpha 通道），人物完整显示（头脚不被裁切），
 * 背景保持完全透明，不做模糊填充。
 */
async function writeAvatar(outPath, w, h, zoom = 1) {
    // Windows 上 sharp 直接覆盖已存在 .webp 会报 Invalid argument，先删除目标文件
    const removed = await removeIfExists(outPath);
    if (!removed && fs.existsSync(outPath)) {
        throw new Error(`无法删除被占用的文件: ${outPath}`);
    }

    // 前景：完整人物等比缩放（占目标高度 92%，叠加 zoom 模拟动画帧）
    const fgScale = 0.92 * zoom;
    const fgW = Math.max(64, Math.round(w * fgScale));
    const fgH = Math.max(64, Math.round(h * fgScale));

    // 完整人物等比放入（fit: inside 保持比例，不裁切，保留 alpha）
    const fg = await sharp(SRC)
        .resize(fgW, fgH, { fit: 'inside', withoutEnlargement: true })
        .png()
        .toBuffer();

    // 透明背景画布 + 人物居中合成
    await sharp({
        create: { width: w, height: h, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
    })
        .composite([{ input: fg, gravity: 'centre' }])
        .webp({ quality: 90 })
        .toFile(outPath);
    console.log(`OK   ${path.relative(ROOT, outPath)} (${w}x${h})`);
}

// 动画帧轻微放大，营造「呼吸」效果
const FRAME_ZOOM = [1.00, 1.06, 1.00, 1.05, 1.00, 1.07, 1.00, 1.06, 1.00];

async function main() {
    let ok = 0;
    const run = async (fn) => { try { await fn(); ok++; } catch (e) { console.error(`FAIL: ${e.message}`); } };

    // 1. 走廊动画帧（1:1，保持原尺寸，读取失败按 1024x1024）
    for (let i = 1; i <= 9; i++) {
        const file = path.join(ROOT, 'public/textures/corridor/avatar_anim', `${i}.webp`);
        const size = (await sizeOf(file)) || { w: 1024, h: 1024 };
        await run(() => writeAvatar(file, size.w, size.h, FRAME_ZOOM[i - 1]));
    }

    // 2. 入口窗（1:1，主文件 + backups 副本）
    const windowFiles = [
        'public/textures/entrance/avatar_window.webp',
        'public/textures/entrance/backups/avatar_window.webp',
    ];
    for (const rel of windowFiles) {
        const file = path.join(ROOT, rel);
        const size = (await sizeOf(file)) || { w: 1024, h: 1024 };
        await run(() => writeAvatar(file, size.w, size.h));
    }

    // 3. 关于页云上人物（约 2:1，主文件 + backups 副本）
    const cloudFiles = [
        'public/textures/about/awatarnachmurce.webp',
        'public/textures/about/backups/awatarnachmurce.webp',
    ];
    for (const rel of cloudFiles) {
        const file = path.join(ROOT, rel);
        const size = (await sizeOf(file)) || { w: 2048, h: 1024 };
        await run(() => writeAvatar(file, size.w, size.h));
    }

    console.log(`\nDone: ${ok} images updated.`);
    if (ok < 11) process.exit(1);
}

main();
