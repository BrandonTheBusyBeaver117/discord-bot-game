import { supabase } from '../..';
import { Banner } from '../../banner';
import { getCard } from '../../get_cards';

/**
 * Adds cards to inventory
 * @param uuid
 * @param frequencies
 * @param totalGemCost
 * @returns gems
 */
export const addCharacters = async (
    uuid: string,
    frequencies: Map<string, number>,
    totalGemCost: number,
): Promise<number> => {
    const cards = [];

    for (const [cardIdentifier, quantity] of frequencies) {
        cards.push({
            card_id: getCard(cardIdentifier).id,
            quantity: quantity,
        });
    }

    const { data, error } = await supabase.rpc('add_cards_batch', {
        p_user_id: uuid,
        p_cards: cards,
        p_gems: totalGemCost,
    });

    if (error) {
        console.error('Add character error:', error.message);
    }

    return data;
};

export const pullCards = (banner: Banner, num: number): Map<string, number> => {
    const frequencies = new Map<string, number>();

    for (let i = 0; i < num; i++) {
        const characterName = banner.getCard().name;
        const prevFrequency = frequencies.get(characterName) || 0;

        frequencies.set(characterName, prevFrequency + 1);
    }

    return frequencies;
};
