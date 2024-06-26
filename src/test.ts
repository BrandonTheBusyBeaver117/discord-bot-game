import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';
import Characters from './generators/generateCharacters';

console.log(Characters);
const getRandomCards = (arr: string[], numElements: number) => {
    const elements = [];

    console.log(arr);

    for (let i = 0; i < numElements; i++) {
        const randomElementIndex = Math.floor(Math.random() * elements.length);

        elements.push(...arr.splice(randomElementIndex, 1));
    }

    console.log(elements);
    console.log(elements.map((charName) => ({ name: charName })));
    return elements.map((charName) => ({ name: charName }));
};

console.log('buh?');
const randomBannerConfig = {
    name: 'Random',
    common: getRandomCards(Characters.common, 4),
    rare: getRandomCards(Characters.rare, 3),
    epic: getRandomCards(Characters.epic, 2),
    legendary: getRandomCards(Characters.legendary, 1),
};

fs.writeFile('./data/random_banner.json', JSON.stringify(randomBannerConfig), 'utf8', (res) =>
    console.log(res),
);
