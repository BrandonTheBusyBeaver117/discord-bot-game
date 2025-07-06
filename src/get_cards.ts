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

    cardsByRarityCache.set('common', []);
    cardsByRarityCache.set('rare', []);
    cardsByRarityCache.set('epic', []);
    cardsByRarityCache.set('legendary', []);

    for (const card of data) {
        // use id or name as key
        cardCache.set(card.id, card);

        // This is ok because we can still return a correctly capitalized name from the card itself
        cardCache.set(card.name.toLowerCase().trim(), card);

        // This shouldn't happen
        if (!cardsByRarityCache.has(card.rarity)) {
            console.log('unanticipated rarity');
            cardsByRarityCache.set(card.rarity, []);
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
export function getCard(identifier: string): Card | null {
    identifier = identifier.toLowerCase().trim();

    if (!cardCache.has(identifier)) {
        console.log("BIG ERROR - HOW COME THIS DOESN'T EXIST");
        console.log(identifier);
        return;
    }

    return cardCache.get(identifier);
}

export function getCache(): Map<string, Card> {
    return cardCache;
}

export function getRarity(rarity: string): Card[] {
    if (!cardsByRarityCache.has(rarity)) {
        console.log('Malformed rarity?');
        console.log(rarity);
    }

    return cardsByRarityCache.get(rarity);
}
