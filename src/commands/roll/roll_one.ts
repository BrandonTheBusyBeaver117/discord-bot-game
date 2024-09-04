import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';

import { GetCurrentBanner } from '../../banner';

import RollCommand from './roll';

class RollOneCommand extends RollCommand {
    data = new SlashCommandBuilder().setName('roll').setDescription('Get a random card!');

    override async execute(interaction: CommandInteraction): Promise<void> {
        const characterName = GetCurrentBanner().getCard().name;

        const updatedUser = await this.addCharacters(interaction.user.id, [characterName], -5);

        let quantity = 0;

        for (const item of updatedUser.inventory) {
            if (item.name === characterName) {
                quantity = item.count;
            }
        }

        await interaction.reply(characterName + ' x' + quantity);
    }
}

export default RollOneCommand;
