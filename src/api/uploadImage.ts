import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';

import dotenv from 'dotenv';
import { getCache, getCard, loadCards } from '../get_cards';
import Fuse from 'fuse.js';
import process from 'process';
import prompt from 'prompt-sync';

dotenv.config();

const IMAGE_DIR = './data/images';

const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;

if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new Error('cloudinary variables are missing');
}

cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
});

async function imageExists(publicId: string): Promise<boolean> {
    try {
        await cloudinary.api.resource(publicId);
        return true; // exists
    } catch (error: any) {
        if (error.http_code === 404) return false; // not found
        // console.error('Error checking image existence:', error);
        return false; // fail-safe: treat as not existing
    }
}

async function uploadCardImage(filePath: string, imageName: string) {
    try {
        const result = await cloudinary.uploader.upload(filePath, {
            folder: 'images',
            public_id: imageName,
            overwrite: true,
        });
        return result.secure_url;
    } catch (err) {
        console.error('Cloudinary upload error:', err);
        return null;
    }
}

export async function batchUploadImages() {
    const files = fs.readdirSync(IMAGE_DIR);
    await loadCards();

    const cache = getCache();
    const names = Array.from(cache.keys());

    const input = prompt();

    const fuse = new Fuse(names, {
        includeScore: true,
        threshold: 0.4, // adjust for more or less strictness
    });

    for (const file of files) {
        const ext = path.extname(file).toLowerCase();
        // Should all be jpgs tho
        if (!['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) continue;

        const imageName = path.basename(file, ext).toLowerCase().trim(); // assumes filename is like 001.png
        const filePath = path.join(IMAGE_DIR, file);

        let card = getCard(imageName);
        if (!card) {
            console.log('Possible matches');

            const results = fuse.search(imageName);

            if (results.length == 0) {
                console.log('No matches for this name lmao');
                console.log(imageName);
                console.log('======');
                continue;
            }

            // Get top 3 matches
            const topMatches = results.slice(0, 3).map((result) => result.item);
            console.log(topMatches);

            //user input
            const selectedIndex = parseInt(input('which match? 0th indexing'));

            // checks if valid int
            if (!selectedIndex) {
                card = getCard(topMatches[selectedIndex]);
            }

            if (!card) {
                console.log('uh yeah I have no clue');
                continue;
            }
        }
        const forceOverwriteList = new Set(['exampleid']);

        // If the image already exists and shouldn't be overriden, we continue
        if (imageExists(card.id) && !forceOverwriteList.has(card.id)) {
            continue;
        }

        console.log('trying ' + card.name);
        await uploadCardImage(filePath, card.id);
        console.log(imageName);
    }

    console.log('🎉 Done uploading all card images.');
}
