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

    // glorified builder
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
        const inventory = await fetchInventory(interaction);

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
            .setDisabled(inventory.length <= 1);

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(backButton, nextButton);

        const message = await interaction.editReply({
            embeds: [this.getInventoryEmbed(inventory, currentPage)],
            components: [row],
        });

        // helper that refreshes button disabled state
        const refreshButtons = () => {
            backButton.setDisabled(currentPage === 0);
            nextButton.setDisabled(currentPage === inventory.length - 1);
        };
        const startCollector = () => {
            refreshButtons();

            const collector = message.createMessageComponentCollector({
                time: 60_000, // 60 s from (re)creation
            });

            collector.on('collect', async (collectorInteraction) => {
                if (interaction.user.id !== collectorInteraction.user.id) {
                    return collectorInteraction.reply({
                        content: "This isn't your inventory!",
                        ephemeral: true,
                    });
                }

                if (
                    collectorInteraction.customId === 'next_item' &&
                    currentPage < inventory.length - 1
                ) {
                    currentPage++;
                } else if (collectorInteraction.customId === 'prev_item' && currentPage > 0) {
                    currentPage--;
                } else {
                    console.log('invalid interaction?');
                }

                // update buttons
                refreshButtons();

                const newEmbed = this.getInventoryEmbed(inventory, currentPage);
                await collectorInteraction.update({ embeds: [newEmbed], components: [row] });

                // Reset timer by killing & restarting collector
                collector.stop(); // triggers 'end' immediately (reason: 'user')
                startCollector(); // start fresh 60‑s window
            });

            collector.on('end', () => {
                backButton.setDisabled(true);
                nextButton.setDisabled(true);
                message.edit({ components: [row] }).catch(() => {});
            });
        };

        startCollector();
    }
}

export default InventoryCommand;
