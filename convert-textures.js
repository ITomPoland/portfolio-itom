
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, 'public');

async function processDirectory(directory) {
    const files = fs.readdirSync(directory);

    for (const file of files) {
        const fullPath = path.join(directory, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            await processDirectory(fullPath);
        } else if (path.extname(file).toLowerCase() === '.png') {
            const webpPath = fullPath.replace(/\.png$/i, '.webp');
            console.log(`Converting: ${fullPath} -> ${webpPath}`);

            try {
                await sharp(fullPath)
                    .webp({ quality: 80 }) // consistent quality
                    .toFile(webpPath);

                fs.unlinkSync(fullPath);
                console.log(`Deleted: ${fullPath}`);
            } catch (err) {
                console.error(`Error converting ${fullPath}:`, err);
            }
        }
    }
}

console.log('Starting conversion...');
await processDirectory(rootDir);
console.log('Conversion complete.');
