import { v2 as cloudinary } from 'cloudinary';
import { supabase } from '../index';
import fs from 'fs';
import path from 'path';

import * as dotenv from 'dotenv';
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

export async function uploadCardImage(filePath: string, imageName: string) {
    try {
        const result = await cloudinary.uploader.upload(filePath, {
            folder: 'images',
            public_id: imageName,
        });
        return result.secure_url;
    } catch (err) {
        console.error('Cloudinary upload error:', err);
        return null;
    }
}

// export async function uploadCardImageAndSave(filePath: string, imageName: string, cardId?: string) {
//     // 1. Upload to Cloudinary
//     const url = await uploadToCloudinary(filePath);
//     if (!url) {
//         console.error('Failed to upload image.');
//         return null;
//     }

//     // 2. Insert into Images table with name, url, and optional card_id
//     const { data, error } = await supabase
//         .from('Images')
//         .insert([{ name: imageName, url, card_id: cardId ?? null }])
//         .select()
//         .single();

//     if (error) {
//         console.error('Error saving image to Supabase:', error);
//         return null;
//     }

//     console.log('Image saved:', data);
// }

async function batchUploadImages() {
    const files = fs.readdirSync(IMAGE_DIR);

    for (const file of files) {
        const ext = path.extname(file).toLowerCase();
        // Should all be jpgs tho
        if (!['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) continue;

        const imageName = path.basename(file, ext); // assumes filename is like 001.png
        const filePath = path.join(IMAGE_DIR, file);

        await uploadCardImage(filePath, imageName);
        console.log(imageName);
    }

    console.log('🎉 Done uploading all card images.');
}

batchUploadImages().catch(console.error);
