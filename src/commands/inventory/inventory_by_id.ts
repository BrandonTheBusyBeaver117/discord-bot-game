import { EmbedBuilder, SlashCommandBuilder } from '@discordjs/builders';
import { Client, CommandInteraction } from 'discord.js';

import InventoryBase from './inventory_base';
import { fetchInventory } from './inventory_util';

class CombatInventory extends InventoryBase {
    constructor() {
        super(
            new SlashCommandBuilder()
                .setName('inventory_by_id')
                .setDescription('See all your cards, their IDs, and quantity'),
        );
    }

    override async execute(interaction: CommandInteraction, client: Client): Promise<void> {
        await interaction.deferReply({ ephemeral: false });
        // Build the inventory message
        const inventory = await fetchInventory(interaction.user.id);

        if (!inventory) {
            interaction.editReply('Failed to fetch inventory');
            return;
        }

        const stringbuilt = inventory
            .map((item) => {
                return `${item.card.number}: **${item.card.name}** x${item.quantity}`;
            })
            .join('\n');

        await interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setTitle(`${interaction.user.displayName}'s inventory by id`)
                    .setDescription(stringbuilt),
            ],
        });
    }
}

export default CombatInventory;
