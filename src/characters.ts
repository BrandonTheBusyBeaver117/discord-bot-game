import fs from 'fs';
import path from 'path';

const Characters = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../data/characters.json'), 'utf8'),
);

export default Characters;
