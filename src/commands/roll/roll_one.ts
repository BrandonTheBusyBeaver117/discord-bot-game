import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';

import { GetCurrentBanner } from '../../banner';

import RollCommand from './roll';

class RollOneCommand extends RollCommand {
    constructor() {
        super(new SlashCommandBuilder().setName('roll').setDescription('Get a random card!'));
    }

    override async execute(interaction: CommandInteraction): Promise<void> {
        const characterName = GetCurrentBanner().getCard().name;

        const frequency = this.generateFrequencies([characterName]);

        const updatedUser = await this.addCharacters(interaction.user.id, frequency, -5);

        let quantity = 0;

        let newInventoryString = 'Updated Inventory:\n';
        for (const { name, count } of updatedUser.inventory) {
            newInventoryString += name + ' x' + count + ', ';
        }

        await interaction.reply('New card drawn:\n' + characterName + ' x' + quantity);
        await interaction.reply(newInventoryString);
    }
}

export default RollOneCommand;
