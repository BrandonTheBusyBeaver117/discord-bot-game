import fs from 'fs';
import path from 'path';
import { getCache, getCard, loadCards } from '../get_cards';
import Fuse from 'fuse.js';

const IMAGE_DIR = './data/images';

export async function checkDiff() {
    await loadCards();

    const cache = getCache();

    const names = Array.from(cache.keys());

    const fuse = new Fuse(names, {
        includeScore: true,
        threshold: 0.4, // adjust for more or less strictness
    });

    const searchTerm = 'deku';
    const results = fuse.search(searchTerm);
    const files = fs.readdirSync(IMAGE_DIR);

    for (const file of files) {
        const ext = path.extname(file).toLowerCase();
        // Should all be jpgs tho
        if (!['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) continue;

        const imageName = path.basename(file, ext).toLowerCase().trim(); // assumes filename is like 001.png

        const card = getCard(imageName);
        if (!card) {
            console.log('Possible matches');

            const results = fuse.search(imageName);

            // Get top 3 matches
            const topMatches = results.slice(0, 3).map((result) => result.item);
            console.log(topMatches);
        }
    }

    console.log('🎉 Done uploading all card images.');
}
