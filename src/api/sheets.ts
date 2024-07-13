import { google } from 'googleapis';
import path from 'path';

import dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '../../.env') });

const {
    CLIENT_ID,
    GUILD_ID,
    DISCORD_TOKEN,
    SERVICE_ACCOUNT_EMAIL,
    SERVICE_ACCOUNT_PRIVATE_KEY,
    SHEET_ID,
} = process.env;

if (!CLIENT_ID || !GUILD_ID || !DISCORD_TOKEN) {
    throw new Error('discord variables are missing');
}

console.log(SERVICE_ACCOUNT_EMAIL);
console.log(SERVICE_ACCOUNT_PRIVATE_KEY);
console.log(SHEET_ID);
if (!SERVICE_ACCOUNT_EMAIL || !SERVICE_ACCOUNT_PRIVATE_KEY || !SHEET_ID) {
    throw new Error('Environment variables are missing');
}

const auth = new google.auth.JWT({
    email: SERVICE_ACCOUNT_EMAIL,
    key: SERVICE_ACCOUNT_PRIVATE_KEY.split(String.raw`\n`).join('\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

async function getSpreadsheetValues() {
    const api = google.sheets({ version: 'v4', auth: auth });

    try {
        const response = await api.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: "'Sheet1'!A1:X450",
        });

        console.log(response.data.values);
    } catch (err) {
        console.log(err);
    }
}

getSpreadsheetValues();
