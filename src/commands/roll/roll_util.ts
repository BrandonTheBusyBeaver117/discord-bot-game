import { supabase } from '../..';
import { Banner } from '../../banner';
import { Card } from '../../get_cards';

/**
 * Adds cards to inventory
 * @param uuid
 * @param frequencies
 * @param totalGemCost
 * @returns gems
 */
export const addCharacters = async (
    uuid: string,
    frequencies: Map<Card, number>,
    totalGemCost: number,
): Promise<number> => {
    const cards = [];

    for (const [card, quantity] of frequencies) {
        cards.push({
            card_id: card.id,
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

export const pullCards = (banner: Banner, num: number): Map<Card, number> => {
    const frequencies = new Map<Card, number>();

    for (let i = 0; i < num; i++) {
        const chosenCard = banner.getCard();
        const prevFrequency = frequencies.get(chosenCard) || 0;

        frequencies.set(chosenCard, prevFrequency + 1);
    }

    return frequencies;
};
