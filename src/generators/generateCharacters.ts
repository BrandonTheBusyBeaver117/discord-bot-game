import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

// Define the path to the CSV file
const csvFilePath = path.join(__dirname, '../../data/characters.csv');

// Create a readable stream
const fileStream = fs.createReadStream(csvFilePath, { encoding: 'utf8' });

// Handle the file stream events
fileStream.on('error', (err) => {
    console.error('Error reading the file:', err);
});

// Initialize an empty string to accumulate file data
let fileData = '';

// Accumulate data chunks
fileStream.on('data', (chunk) => {
    fileData += chunk;
});

const Characters = {
    common: [],
    rare: [],
    epic: [],
    legendary: [],
};

// When the stream ends, parse the accumulated data
fileStream.on('end', () => {
    Papa.parse(fileData, {
        header: true, // If your CSV has headers
        skipEmptyLines: true,
        complete: (results) => {
            for (const row of results.data) {
                Characters.common.push(row.Common);
                Characters.rare.push(row.Rare);
                Characters.epic.push(row.Epic);
                Characters.legendary.push(row.Legendary);
            }

            Characters.common = Characters.common.filter((character) => character !== '');
            Characters.rare = Characters.rare.filter((character) => character !== '');
            Characters.epic = Characters.epic.filter((character) => character !== '');
            Characters.legendary = Characters.legendary.filter((character) => character !== '');

            console.log(Characters);

            fs.writeFile('../../data/characters.json', JSON.stringify(Characters), 'utf8', (res) =>
                console.log(res),
            );
        },
        error: (error) => {
            console.error('Error parsing the file:', error);
        },
    });
});

export default Characters;
