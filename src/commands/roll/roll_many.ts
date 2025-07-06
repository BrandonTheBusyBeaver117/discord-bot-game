import { EmbedBuilder, SlashCommandBuilder } from '@discordjs/builders';
import { ChatInputCommandInteraction } from 'discord.js';

import { getCurrentRandomBanner } from '../../banner';

import RollCommand from './roll_base';
import { pullCards, addCharacters } from './roll_util';
import { fetchCards } from '../inventory/inventory_util';

type EmbedItem = {
    name: string;
    value: string;
    inline?: boolean;
};

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

    private createRarityMap(): Map<string, EmbedItem> {
        const embedMapTemplate = new Map<string, EmbedItem>();

        embedMapTemplate.set('common', {
            name: '__common__',
            value: '',
            inline: false,
        });

        embedMapTemplate.set('rare', {
            name: '__rare__',
            value: '',
            inline: false,
        });

        embedMapTemplate.set('epic', {
            name: '__epic__',
            value: '',
            inline: false,
        });

        embedMapTemplate.set('legendary', {
            name: '__legendary__',
            value: '',
            inline: false,
        });

        return embedMapTemplate;
    }

    override async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const numCards = interaction.options.getInteger('number');

        const frequency = pullCards(getCurrentRandomBanner(), numCards);
        const updatedGems = await addCharacters(interaction.user.id, frequency, 5 * numCards);

        const updatedInventory = await fetchCards(interaction, Array.from(frequency.keys()));

        const fieldsByRarity = this.createRarityMap();

        for (const item of updatedInventory) {
            const card = item.card;

            if (!fieldsByRarity.has(card.rarity)) {
                console.log('whaaat');
                fieldsByRarity.set(card.rarity, {
                    name: `__${card.rarity.slice(0, 1).toUpperCase() + card.rarity.slice(1).toLowerCase()}__`,
                    value: '',
                    inline: false,
                });
            }
            fieldsByRarity.get(card.rarity).value += `**${card.name}** x${item.quantity}\n`;
        }
        const embed = new EmbedBuilder()
            .setTitle(`You rolled ${numCards} times!`)
            .setDescription(`Gem Balance: ${updatedGems}`)
            .addFields(
                // Filters out the ones that don't hae values
                // JS maps maintain order...so the order should be fixed from when we made it
                Array.from(fieldsByRarity.values()).filter(
                    (embedObject) => embedObject.value !== '',
                ),
            );

        await interaction.reply({ embeds: [embed] });
    }
}

export default RollManyCommand;
