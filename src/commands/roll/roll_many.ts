import { SlashCommandBuilder } from '@discordjs/builders';
import { ChatInputCommandInteraction, CommandInteraction } from 'discord.js';

import { Banner, getCurrentRandomBanner } from '../../banner';

import RollCommand from './roll_base';
import { getCard } from '../../get_cards';
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

        const updatedInventory = await fetchCards(interaction, Array.from(frequency.keys()));

        let message = 'New cards drawn: \n';

        for (const [cardID, quantity] of frequency) {
            message += `**${getCard(cardID).name}** x${quantity}\n`;
        }

        message += '\nUpdated Inventory:\n';

        for (const item of updatedInventory) {
            message += `**${getCard(item.card_id).name}** x${item.quantity}\n`;
        }

        message += `Gem Balance: ${updatedGems}`;

        await interaction.reply(message);
    }
}

export default RollManyCommand;
