import { SlashCommandBuilder } from '@discordjs/builders';
import { ChatInputCommandInteraction, Client, CommandInteraction } from 'discord.js';

import DiscordCommand from '../discord_command';
import { supabase } from '../..';
import { getCard } from '../../get_cards';
import { fetchInventory, textifyInventory } from './inventory_util';

class RemoveCommand extends DiscordCommand {
    constructor() {
        super(
            new SlashCommandBuilder()
                .setName('remove_character')
                .setDescription('Remove an unwanted character from your deck')
                .addStringOption((option) => {
                    return option
                        .setName('character')
                        .setDescription('The character to delete')
                        .setRequired(true);
                }),
        );
    }

    override async execute(
        interaction: ChatInputCommandInteraction,
        client: Client,
    ): Promise<void> {
        // const { data: card, error } = await supabase
        //     .from('Cards')
        //     .select('id, name')
        //     .ilike('name', interaction.options.getString('character'))
        //     .single();

        const cardName = interaction.options.getString('character').toLowerCase();

        const { error: deleteError } = await supabase
            .from('inventory')
            .delete()
            .eq('user_id', interaction.user.id)
            .eq('card_id', getCard(cardName).id);

        if (deleteError) {
            console.error('Error deleting inventory item:', deleteError);
            await interaction.reply(
                `Failed to remove ${interaction.options.getString('character')} from your inventory.`,
            );
            return;
        }

        let message = 'Successfully deleted **' + cardName + '**';

        // Build the inventory message
        const data = await fetchInventory(interaction);
        const inventoryText = textifyInventory(data);

        message += '\n\n' + inventoryText;

        await interaction.reply(message);
    }
}

export default RemoveCommand;
