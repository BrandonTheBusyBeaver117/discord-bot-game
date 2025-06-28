import fs from 'fs';
import path from 'path';
import { getCache, getCard, loadCards } from '../get_cards';
import Fuse from 'fuse.js';

const IMAGE_DIR = './data/images';

export async function checkDiff() {
    await loadCards();

    const cache = getCache();
    const files = fs.readdirSync(IMAGE_DIR);

    const cardNames = Array.from(cache.keys())
        // The uuids have a length of 36
        .filter((name) => name.length < 35)
        .map((name) => name.toLowerCase().trim());
    const cardEquivalency = new Fuse(cardNames, {
        includeScore: true,
        threshold: 0.4, // adjust for more or less strictness
    });

    const fileNames: string[] = [];

    for (const file of files) {
        const ext = path.extname(file).toLowerCase();
        // Should all be jpgs tho
        if (!['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) continue;

        fileNames.push(path.basename(file, ext).toLowerCase().trim()); // assumes filename is like 001.png
    }

    const fileEquivalency = new Fuse(fileNames, {
        includeScore: true,
        threshold: 0.4, // adjust for more or less strictness
    });

    // Check if the file name is contained within the spreadsheet cards
    for (const fileName of fileNames) {
        const card = getCard(fileName);
        if (!card) {
            console.log(fileName + " doesn't exist in cards?");
            console.log('Possible matches');

            const results = cardEquivalency.search(fileName);

            // Get top 3 matches
            const topMatches = results.slice(0, 3).map((result) => result.item);
            console.log(topMatches);
            console.log('\n');
        }
    }

    for (const cardName of cardNames) {
        if (!fileNames.includes(cardName)) {
            console.log(cardName + " doesn't have a matching image?");
            console.log('Possible matches');

            const results = fileEquivalency.search(cardName);

            // Get top 3 matches
            const topMatches = results.slice(0, 3).map((result) => result.item);
            console.log(topMatches);
            console.log('\n');
        }
    }

    console.log('🎉 Done checking for discrepancies.');
}
