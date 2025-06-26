const spreadsheetId = '';

class Node {
    constructor(value) {
        this.value = value;
        this.next = null;
        this.left = null;
        this.right = null;
    }
}

class BinarySeachTree {
    constructor() {
        this.root = null;
        this.branchedNode = null;
    }
    // val is always going to be an array of size 1 or 2...i hope
    insert(value) {
        // Basically, at beginning of row, find the first rarity with one card in it
        if (value.length == 1 && this.root === null) {
            this.root = new Node(value[0]);

            return this;
        }

        if (this.branchedNode === null && value.length == 1) {
            let current = this.root;

            while (current.next !== null) {
                current = current.next;
            }

            current.next = new Node(value[0]);

            return this;
        }

        if (this.branchedNode === null && value.length == 2) {
            let current = this.root;

            while (current.next !== null) {
                current = current.next;
            }

            this.branchedNode = current;

            this.branchedNode.left = new Node(value[0]);
            this.branchedNode.right = new Node(value[1]);

            return this;
        }

        let current = this.branchedNode.left;

        while (current.next !== null) {
            current = current.next;
        }

        current.next = new Node(value[0]);

        if (value.length == 2) {
            let current = this.branchedNode.right;

            while (current.next !== null) {
                current = current.next;
            }

            current.next = new Node(value[1]);
        }
    }
}

function transposeAndBubbleUp(arr) {
    // Step 1: Move falsy values to end of each row
    const cleanedRows = arr.map((row) => {
        const nonFalsy = row.filter((v) => v !== null && v !== undefined && v !== '');
        const falsy = row.filter((v) => v === null || v === undefined || v === '');
        return [...nonFalsy, ...falsy];
    });

    // Step 2: Transpose the cleaned rows (ragged)
    const maxCols = Math.max(...cleanedRows.map((row) => row.length));
    const transposed = [];

    for (let col = 0; col < maxCols; col++) {
        const newRow = [];
        for (let row = 0; row < cleanedRows.length; row++) {
            newRow.push(col < cleanedRows[row].length ? cleanedRows[row][col] : null);
        }
        transposed.push(newRow);
    }

    return transposed;
}

const secret = '#ff0000';
const boss = '#ff00ff';
const evo = '#38761d';
const banner = '#4a86e8';

function generateBannerRoster() {
    const sourceSpreadsheet = SpreadsheetApp.openById(spreadsheetId);

    const sheet = sourceSpreadsheet.getSheetByName('Main');
    const writeSheet = sourceSpreadsheet.getSheetByName('Banner');

    // we will have to increment this if it gets way longer someday
    const range = sheet.getRange('A2:G256');
    const values = range.getValues();
    const textColors = range.getFontColorObjects();

    let newRowObjects = [['common'], ['rare'], ['epic'], ['legendary']];

    for (let i = 1; i <= values.length; i++) {
        for (let j = 1; j <= values[0].length; j++) {
            if (range.getCell(i, j).isBlank()) {
                continue;
            }

            // Cells indexed by 1, but not this array for some reason
            const color = textColors[i - 1][j - 1].asRgbColor().asHexString();

            // If it's not a secret and it's not a banner, continue
            if (color != banner && color != secret) {
                continue;
            }

            if ('Grimmjow (Panther)' == range.getCell(i, j).getValue()) {
                console.log('apt');
                console.log(Math.round((j - 1) / 2));
            }

            newRowObjects[Math.round((j - 1) / 2)].push(range.getCell(i, j).getValue());
        }
    }
    newRowObjects = transposeAndBubbleUp(newRowObjects);

    console.log(newRowObjects);
    console.log(newRowObjects.length);
    writeSheet.getRange('A1:D' + newRowObjects.length).setValues(newRowObjects);
}

function writeEvolutions() {
    const sourceSpreadsheet = SpreadsheetApp.openById(spreadsheetId);

    const sheet = sourceSpreadsheet.getSheetByName('Main');
    const writeSheet = sourceSpreadsheet.getSheetByName('Evolutions');

    // we will have to increment this if it gets way longer someday
    const range = sheet.getRange('A2:G256');
    const values = range.getValues();

    const newRowObjects = [['card_name', 'evolution_card_name']];

    for (let i = 1; i <= values.length; i++) {
        let count = 0;

        const common = [range.getCell(i, 1)];

        let rarityPairs = [common];

        for (let j = 2; j <= values[0].length; j += 2) {
            rarityPairs.push([range.getCell(i, j), range.getCell(i, j + 1)]);
        }

        // Returns an array of pairs where empty values in each pair are removed
        // Also just keep the name, not the whole cell

        const filteredPairs = [];

        for (const pair of rarityPairs) {
            let filtered = pair.filter((cell) => !cell.isBlank());

            if (filtered.length !== 1 && filtered.length !== 2) {
                continue;
            }

            const values = filtered.map((cell) => cell.getValue());

            filteredPairs.push(values);
        }

        if (filteredPairs.length == 0) {
            continue;
        }

        const tree = new BinarySeachTree();

        for (const pair of filteredPairs) {
            tree.insert(pair);
        }

        // If the root has no successors, we skip
        if (!tree.root.next && !tree.root.left && !tree.root.right) {
            continue;
        }

        let current = tree.root;
        while (current.next !== null) {
            newRowObjects.push([current.value, current.next.value]);
            current = current.next;

            count++;
        }

        if (tree.branchedNode) {
            // The below only add the children's children
            // We must add the branch node manually
            newRowObjects.push([tree.branchedNode.value, tree.branchedNode.left.value]);

            let currentLeft = tree.branchedNode.left;
            while (currentLeft.next !== null) {
                newRowObjects.push([currentLeft.value, currentLeft.next.value]);
                currentLeft = currentLeft.next;

                count++;
            }

            // The below only add the children's children
            // We must add the branch node manually
            newRowObjects.push([tree.branchedNode.value, tree.branchedNode.right.value]);

            let currentRight = tree.branchedNode.right;
            while (currentRight.next !== null) {
                newRowObjects.push([currentRight.value, currentRight.next.value]);
                currentRight = currentRight.next;

                count++;
            }
        }

        console.log(`i: ${i}, count: ${count}`);
    }

    writeSheet.getRange('A1:B' + newRowObjects.length).setValues(newRowObjects);
}

function generateCards() {
    const sourceSpreadsheet = SpreadsheetApp.openById(spreadsheetId);

    const sheet = sourceSpreadsheet.getSheetByName('Main');
    const writeSheet = sourceSpreadsheet.getSheetByName('Cards');

    // we will have to increment this if it gets way longer someday
    const range = sheet.getRange('A2:G256');
    const values = range.getValues();

    const newRowObjects = [['name', 'rarity', 'type', 'description']];
    const rarities = ['common', 'rare', 'epic', 'legendary'];

    for (let i = 1; i <= values.length; i++) {
        let count = 0;

        for (let j = 1; j <= values[0].length; j++) {
            const cell = range.getCell(i, j);
            if (cell.isBlank()) {
                continue;
            }

            // j = 1 ==> 0
            // J = 2 or 3 ==> 1
            // J = 4 or 5 ==> 2
            // Helps to match it to the rarities
            const rarity = rarities[Math.round((j - 1) / 2)];

            newRowObjects.push([cell.getValue(), rarity, 'normal', 'A strong warrior']);

            count++;
        }
        if (count > 0) {
            console.log(`i: ${i}, count: ${count}`);
        }
    }

    writeSheet.getRange('A1:D' + newRowObjects.length).setValues(newRowObjects);
}
