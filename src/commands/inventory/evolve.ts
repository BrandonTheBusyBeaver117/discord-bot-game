import { ActionRowBuilder, ButtonBuilder, SlashCommandBuilder } from '@discordjs/builders';
import {
    AutocompleteInteraction,
    ButtonStyle,
    ChatInputCommandInteraction,
    Message,
} from 'discord.js';

import { supabase } from '../..';
import { Card, getCard } from '../../get_cards';
import InvalidateInventoryCacheBase from './invalidate_inventory_cache_base';
import { CACHE_TTL, fetchInventory, fetchUserCards, inventoryCache } from './inventory_util';

class Evolve extends InvalidateInventoryCacheBase {
    constructor() {
        super(
            new SlashCommandBuilder()
                .setName('evolve')
                .setDescription(
                    'Evolve a character. You need 4 cards to evolve. View character IDs via /inventory_by_id',
                )
                .addStringOption(
                    (option) =>
                        option
                            .setName('name')
                            .setDescription('Card name')
                            .setAutocomplete(true)
                            .setRequired(true), // <-- just flag it, no 1000 choices here
                ),
        );
    }

    // 🔹 AUTOCOMPLETE HANDLER
    override async autocomplete(interaction: AutocompleteInteraction) {
        const userId = interaction.user.id;
        const focusedValue = interaction.options.getFocused()?.toLowerCase() || '';

        let cached = inventoryCache.get(userId);

        // Fetch inventory if cache is empty or expired
        if (!cached || Date.now() - cached.timestamp > CACHE_TTL) {
            const inventory = await fetchInventory(interaction.user.id);

            if (!inventory) {
                console.error('Error fetching inventory:');
                await interaction.respond([]);
                return;
            }

            cached = { inventory: inventory, timestamp: Date.now() };
            inventoryCache.set(userId, cached);
        }

        const cardNames = cached.inventory.map((item) => item.card.name);

        // --- Hybrid filtering ---
        const startsWithMatches = cardNames.filter((name) =>
            name.toLowerCase().startsWith(focusedValue),
        );

        const includesMatches = cardNames.filter(
            (name) =>
                !name.toLowerCase().startsWith(focusedValue) &&
                name.toLowerCase().includes(focusedValue),
        );

        const filtered = [...startsWithMatches, ...includesMatches].slice(0, 25);

        // Respond to Discord
        await interaction.respond(
            filtered.map((characterName) => ({ name: characterName, value: characterName })),
        );
    }

    override async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        await interaction.deferReply({ ephemeral: true }); // Acknowledge the interaction immediately

        const cardName = interaction.options.getString('name');

        const baseCard = getCard(cardName);

        if (!baseCard) {
            await interaction.editReply(`"${cardName}" does not exist within your inventory`);
            return;
        }

        const userQuantity = await fetchUserCards(interaction.user.id, [baseCard.id]);

        if (!userQuantity) {
            console.error('Error fetching inventory when checking for quantity:');
            return;
        }

        // getting the first bc we should only be looking for one id
        // This constant should be able to be tweaked somehow
        if (userQuantity[0].quantity < 4) {
            await interaction.editReply(
                `You need 4 cards to evolve, but you only have x${userQuantity[0].quantity} of **${cardName}**. Unable to evolve`,
            );
            return;
        }

        const { data: evoData, error: evoerror } = await supabase
            .from('evolutions')
            .select('evolution_card_id')
            .eq('card_id', baseCard.id);

        if (evoerror) {
            console.log(evoerror);
            await interaction.editReply(`Something went wrong when fetching potential evolutions`);
            return;
        }

        const evoCards = evoData.map((data) => getCard(data.evolution_card_id));

        // Row 3: confirm (disabled at first)
        const confirmRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId('cancel')
                .setLabel('Cancel')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('confirm')
                .setLabel('Confirm')
                .setStyle(ButtonStyle.Success)
                .setDisabled(evoCards.length !== 1),
        );

        let message: Message<boolean>;
        let chosenEvo: Card;

        let evoOptions: ActionRowBuilder<ButtonBuilder>;

        if (evoCards.length === 1) {
            message = await interaction.followUp({
                content: `Are you sure that you want to evolve 4 **${baseCard.name}** into **${evoCards[0].name}**?`,
                components: [confirmRow],
                ephemeral: true,
                fetchReply: true,
            });

            chosenEvo = evoCards[0];
        } else {
            evoOptions = new ActionRowBuilder<ButtonBuilder>().addComponents(
                evoCards.map((card, idx) =>
                    new ButtonBuilder()
                        .setCustomId(`${idx}`)
                        .setLabel(card.name)
                        .setStyle(ButtonStyle.Secondary),
                ),
            );

            message = await interaction.followUp({
                content: `Choose an evolution path for **${baseCard.name}**`,
                components: [evoOptions, confirmRow],
                ephemeral: true,
                fetchReply: true,
            });
        }

        const collector = (message as Message).createMessageComponentCollector({
            time: 5 * 60_000, // optional absolute max lifetime (5 minutes for safety)
            idle: 60_000, // end if no interaction for 60s
            filter: (i) => i.user.id === interaction.user.id,
        });

        collector.on('collect', async (i) => {
            // Upload evo
            if (i.customId === 'confirm') {
                const { data, error } = await supabase.rpc('evolve_card', {
                    p_card_id: baseCard.id,
                    p_evo_card_id: chosenEvo.id,
                    p_user_id: interaction.user.id,
                });

                if (error) {
                    await i.update({
                        content: `Evolution failed\nReason: '${error.message}'`,
                        components: [],
                    });

                    console.log(error);
                    return;
                }

                await i.update({
                    content: `Evolution success! You got 1 ${chosenEvo.name}`,
                    components: [],
                });
                collector.stop();
                return;
            } else if (i.customId === 'cancel') {
                await i.update({
                    content: `Evolution cancelled`,
                    components: [],
                });
                collector.stop();
                return;
            } else {
                const idx = parseInt(i.customId);
                chosenEvo = evoCards[idx];

                // Reset styles to Secondary, highlight the chosen one
                evoOptions.components.forEach((btn, j) => {
                    (btn as ButtonBuilder).setStyle(
                        j === idx ? ButtonStyle.Primary : ButtonStyle.Secondary,
                    );
                });
            }

            // Update confirm button state
            if (chosenEvo) {
                // the confirm button
                confirmRow.components[1].setDisabled(false);
            }

            // Update the message for move/target selection

            if (evoCards.length === 1) {
                await i.update({
                    components: [confirmRow],
                });
            } else {
                await i.update({
                    components: [evoOptions, confirmRow],
                });
            }
        });

        collector.on('end', async (_collected, reason) => {
            if (reason === 'time' && !chosenEvo) {
                await message.edit({
                    content: `⏳ Action selection timed out.`,
                    components: [],
                });
            }
        });
    }
}

export default Evolve;
