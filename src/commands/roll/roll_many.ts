import { EmbedBuilder, SlashCommandBuilder } from '@discordjs/builders';
import { ChatInputCommandInteraction } from 'discord.js';

import { getCurrentRandomBanner } from '../../banner';

import RollCommand from './roll_base';
import { pullCards, addCharacters } from './roll_util';
import { fetchCards } from '../inventory/inventory_util';

class RollManyCommand extends RollCommand {
    constructor() {
        super(
            new SlashCommandBuilder()
                .setName('roll_many')
                .setDescription('Choose how times you want to roll! (Each roll is 5 gems)')
                .addIntegerOption((option) => {
                    return option
                        .setName('number')
                        .setDescription('How many times you want to roll')
                        .setRequired(true);
                }),
        );
    }

    override async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const numCards = interaction.options.getInteger('number');

        const frequency = pullCards(getCurrentRandomBanner(), numCards);
        const updatedGems = await addCharacters(interaction.user.id, frequency, 5 * numCards);

        const updatedInventory = await fetchCards(interaction, frequency.keys().toArray());

        const fieldsByRarity = new Map<
            string,
            {
                name: string;
                value: string;
                inline?: boolean;
            }
        >();

        for (const item of updatedInventory) {
            const card = item.card;

            if (!fieldsByRarity.has(card.rarity)) {
                fieldsByRarity.set(card.rarity, {
                    name:
                        card.rarity.slice(0, 1).toUpperCase() + card.rarity.slice(1).toLowerCase(),
                    value: '',
                    inline: false,
                });
            }
            fieldsByRarity.get(card.rarity).value += `**${card.name}** x${item.quantity}`;
        }
        const embed = new EmbedBuilder()
            .setTitle(`You rolled ${numCards} times!`)
            .setDescription(`Gem Balance: ${updatedGems}`)
            .addFields(fieldsByRarity.values().toArray());

        await interaction.reply({ embeds: [embed] });
    }
}

export default RollManyCommand;
