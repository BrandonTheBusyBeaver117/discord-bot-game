import { SlashCommandBuilder } from '@discordjs/builders';
import { Client, CommandInteraction } from 'discord.js';

import DiscordCommand from './discord_command';
import { supabase } from '..';
import { getCard } from '../get_cards';

export type Inventory = {
    card_id: string;
    quantity: number;
}[];

class InventoryCommand extends DiscordCommand {
    constructor() {
        super(new SlashCommandBuilder().setName('inventory').setDescription('See all your cards!'));
    }

    static async fetchCards(
        interaction: CommandInteraction,
        cardIdentifiers: string[],
    ): Promise<Inventory> {
        const cardIDs = [];

        for (const identifier of cardIdentifiers) {
            cardIDs.push(getCard(identifier).id);
        }

        const { data: inventoryData, error: inventoryError } = await supabase
            .from('Inventory')
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
    }

    static async fetchInventory(interaction: CommandInteraction): Promise<Inventory> {
        const { data: inventoryData, error: inventoryError } = await supabase
            .from('Inventory')
            .select('card_id, quantity')
            .eq('user_id', interaction.user.id);

        if (inventoryError) {
            console.error('Failed to fetch inventory:', inventoryError);
            await interaction.reply('There was an error fetching your inventory.');
            return;
        }

        return inventoryData;
    }

    static textifyInventory(inventoryData: Inventory): string {
        return inventoryData
            .map((item) => `**${getCard(item.card_id).name}** x${item.quantity}`)
            .join('\n');
    }

    override async execute(interaction: CommandInteraction, client: Client): Promise<void> {
        // Build the inventory message
        const data = await InventoryCommand.fetchInventory(interaction);
        const inventoryText = InventoryCommand.textifyInventory(data);

        await interaction.reply(inventoryText);
    }
}

export default InventoryCommand;
