import { CommandInteraction } from 'discord.js';

import { supabase } from '../..';
import { Card, getCard } from '../../get_cards';

export type Inventory = {
    card: Card;
    quantity: number;
}[];

export const fetchCards = async (
    interaction: CommandInteraction,
    cards: Card[],
): Promise<Inventory> => {
    const { data: inventoryData, error: inventoryError } = await supabase
        .from('inventory')
        .select('card_id, quantity')
        .eq('user_id', interaction.user.id)
        .in(
            'card_id',
            cards.map((card) => card.id),
        );

    if (inventoryError) {
        console.error('Failed to fetch cards:', inventoryError);
        await interaction.reply(
            'There was an error fetching your inventory.\n' + inventoryError.message,
        );
        return;
    }

    // Basically the supabase response returns just the ids, but we convert to cards
    return inventoryData.map((item) => {
        return {
            ...item,
            card: getCard(item.card_id),
        };
    });
};

export const fetchInventory = async (interaction: CommandInteraction): Promise<Inventory> => {
    const { data: inventoryData, error: inventoryError } = await supabase
        .from('inventory')
        .select('card_id, quantity')
        .eq('user_id', interaction.user.id);

    if (inventoryError) {
        console.error('Failed to fetch inventory:', inventoryError);
        await interaction.reply('There was an error fetching your inventory.');
        return;
    }

    // Basically the supabase response returns just the ids, but we convert to cards
    return inventoryData.map((item) => {
        return {
            ...item,
            card: getCard(item.card_id),
        };
    });
};

export const textifyInventory = (inventoryData: Inventory): string => {
    if (inventoryData.length == 0) return 'Your inventory is empty';

    return inventoryData.map((item) => `**${item.card.name}** x${item.quantity}`).join('\n');
};
