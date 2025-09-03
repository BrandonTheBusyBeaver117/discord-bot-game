import { EmbedBuilder, SlashCommandBuilder } from '@discordjs/builders';
import { Client, CommandInteraction } from 'discord.js';

import InventoryBase from './inventory_base';
import { fetchInventory } from './inventory_util';

class CombatInventory extends InventoryBase {
    constructor() {
        super(
            new SlashCommandBuilder()
                .setName('combat_inventory')
                .setDescription('See all your cards and their combat IDs!'),
        );
    }

    override async execute(interaction: CommandInteraction, client: Client): Promise<void> {
        await interaction.deferReply({ ephemeral: false });
        // Build the inventory message
        const inventory = await fetchInventory(interaction);

        const stringbuilt = inventory
            .map((item) => {
                return `${item.card.number}: ${item.card.name}`;
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
