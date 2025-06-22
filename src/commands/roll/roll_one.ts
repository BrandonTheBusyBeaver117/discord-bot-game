import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';

import { getCurrentBanner } from '../../banner';

import RollCommand from './roll_base';
import { getCard } from '../../get_cards';
import { pullCards, addCharacters } from './roll_util';
import { fetchCards } from '../inventory/inventory_util';

class RollOneCommand extends RollCommand {
    constructor() {
        super(new SlashCommandBuilder().setName('roll').setDescription('Get a random card!'));
    }

    override async execute(interaction: CommandInteraction): Promise<void> {
        const frequency = pullCards(getCurrentBanner(), 1);
        const updatedGems = await addCharacters(interaction.user.id, frequency, 5);

        const updatedInventory = await fetchCards(interaction, Array.from(frequency.keys()));

        // Making sure we only pulled a single card...
        if (updatedInventory.length !== 1) {
            await interaction.reply("something very bad has happened - we didn't pull one card");
            return;
        }

        // Only works cause we pulled a single card
        const characterName = getCard(updatedInventory[0].card_id).name;

        let message = 'New card drawn: **' + characterName + '**\n\n';

        message += 'Updated Inventory:\n';
        message += `**${characterName}** x${updatedInventory[0].quantity}\n\n`;

        message += `Gem Balance: ${updatedGems}`;

        await interaction.reply(message);
    }
}

export default RollOneCommand;
