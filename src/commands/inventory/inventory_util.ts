import { CommandInteraction } from 'discord.js';

import { supabase } from '../..';
import { getCard } from '../../get_cards';

export type Inventory = {
    card_id: string;
    quantity: number;
}[];

export const fetchCards = async (
    interaction: CommandInteraction,
    cardIdentifiers: string[],
): Promise<Inventory> => {
    const cardIDs = [];

    for (const identifier of cardIdentifiers) {
        cardIDs.push(getCard(identifier).id);
    }

    const { data: inventoryData, error: inventoryError } = await supabase
        .from('inventory')
        .select('card_id, quantity')
        .eq('user_id', interaction.user.id)
        .in('card_id', cardIDs);

    if (inventoryError) {
        console.error('Failed to fetch cards:', inventoryError);
        await interaction.reply(
            'There was an error fetching your inventory.\n' + inventoryError.message,
        );
        return;
    }

    return inventoryData;
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

    return inventoryData;
};

export const textifyInventory = (inventoryData: Inventory): string => {
    return inventoryData
        .map((item) => `**${getCard(item.card_id).name}** x${item.quantity}`)
        .join('\n');
};
