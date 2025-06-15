import { supabase } from '.';

export type Card = {
    id: string;
    name: string;
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

export async function loadCards() {
    const { data, error } = await supabase.from('Cards').select('id, name');
    if (error) {
        console.error('Failed to load cards:', error);
        return;
    }

    cardCache.clear(); // reset if you're reloading
    for (const card of data) {
        // use id or name as key
        cardCache.set(card.id, card);
        cardCache.set(card.name, card);
    }

    console.log(`✅ Loaded ${cardCache.size} cards into cache.`);
}

/**
 * Retrieves card from cache
 * @param identifier Either name or uuid of card
 * @returns The card itself
 */
export function getCard(identifier: string): Card {
    return cardCache.get(identifier);
}
