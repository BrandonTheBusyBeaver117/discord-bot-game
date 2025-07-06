import {
    ActionRowBuilder,
    ButtonBuilder,
    EmbedBuilder,
    SlashCommandBuilder,
} from '@discordjs/builders';
import { ButtonStyle, Client, CommandInteraction } from 'discord.js';

import InventoryBase from './inventory_base';
import { fetchInventory, Inventory, textifyInventory } from './inventory_util';
import { Card } from '../../get_cards';

class InventoryCommand extends InventoryBase {
    constructor() {
        super(new SlashCommandBuilder().setName('inventory').setDescription('See all your cards!'));
    }

    // 🖼️ Function to create the embed for a specific page
    private getInventoryEmbed(inventory: Inventory, index: number) {
        const card = inventory[index].card;

        return new EmbedBuilder()
            .setTitle(card.name)
            .setDescription(card.description)
            .setImage(`https://res.cloudinary.com/anicardimages/image/upload/images/${card.id}`)

            .setFooter({ text: `Card ${index + 1} of ${inventory.length}` });
    }

    override async execute(interaction: CommandInteraction, client: Client): Promise<void> {
        await interaction.deferReply({ ephemeral: false });
        // Build the inventory message
        const data = await fetchInventory(interaction);

        let currentPage = 0;

        const backButton = new ButtonBuilder()
            .setCustomId('prev_item')
            .setLabel('⬅️ Prev')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true);

        const nextButton = new ButtonBuilder()
            .setCustomId('next_item')
            .setLabel('Next ➡️')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(data.length <= 1);

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(backButton, nextButton);

        const msg = await interaction.editReply({
            embeds: [this.getInventoryEmbed(data, currentPage)],
            components: [row],
        });

        const collector = msg.createMessageComponentCollector({
            time: 60_000, // 1 min
        });

        collector.on('collect', async (collectorInteraction) => {
            if (interaction.user.id !== collectorInteraction.user.id) {
                return collectorInteraction.reply({
                    content: "This isn't your inventory!",
                    ephemeral: true,
                });
            }

            if (collectorInteraction.customId === 'next_item') {
                currentPage++;
            } else if (collectorInteraction.customId === 'prev_item') {
                currentPage--;
            } else {
                console.log('invalid interaction?');
            }
            // Update buttons
            backButton.setDisabled(currentPage === 0);
            nextButton.setDisabled(currentPage === data.length - 1);

            const newEmbed = this.getInventoryEmbed(data, currentPage);
            await interaction.editReply({ embeds: [newEmbed], components: [row] });
        });

        collector.on('end', () => {
            backButton.setDisabled(true);
            nextButton.setDisabled(true);
            msg.edit({ components: [row] }).catch(() => {});
        });
    }
}

export default InventoryCommand;
