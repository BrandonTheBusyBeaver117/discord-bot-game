import { supabase } from '.';

export type Card = {
    id: string;
    name: string;
    rarity: string;
    //   moves: {
    //     id: string;
    //     name: string;
    //     effect: {
    //         name: string
    //       id: string;
    //       type: string;
    //       probability: number;
    //     };
    //   }[];
};

const cardCache = new Map<string, Card>();
const cardsByRarityCache = new Map<string, Card[]>();

export async function loadCards() {
    const { data, error } = await supabase.from('cards').select('id, name, rarity');
    if (error) {
        console.error('Failed to load cards:', error);
        return;
    }

    cardCache.clear(); // reset if you're reloading
    cardsByRarityCache.clear();
    for (const card of data) {
        // use id or name as key
        cardCache.set(card.id, card);
        cardCache.set(card.name, card);

        if (!cardsByRarityCache.has(card.rarity)) {
            cardsByRarityCache.set(card.rarity, []);
            console.log(card.rarity);
        }
        cardsByRarityCache.get(card.rarity).push(card);
    }

    console.log(`✅ Loaded ${cardCache.size} cards into cache.`);
}

/**
 * Retrieves card from cache
 * @param identifier Either name or uuid of card
 * @returns The card itself
 */
export function getCard(identifier: string): Card {
    if (!cardCache.has(identifier)) {
        console.log("BIG ERROR - HOW COME THIS DOESN'T EXIST");
        console.log(identifier);
    }

    return cardCache.get(identifier);
}

export function getRarity(rarity: string): Card[] {
    if (!cardsByRarityCache.has(rarity)) {
        console.log('Malformed rarity?');
        console.log(rarity);
    }

    return cardsByRarityCache.get(rarity);
}
