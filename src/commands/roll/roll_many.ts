import { SlashCommandBuilder } from '@discordjs/builders';
import { ChatInputCommandInteraction, CommandInteraction } from 'discord.js';

import { GetCurrentBanner } from '../../banner';

import RollCommand from './roll';

class RollManyCommand extends RollCommand {
    data = new SlashCommandBuilder()
        .setName('roll_many')
        .setDescription('Choose how times you want to roll! (Each roll is 5 gems)')
        .addIntegerOption((option) => {
            return option
                .setName('number')
                .setDescription('How many times you want to roll')
                .setRequired(true);
        });

    override async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const numCharacters = interaction.options.getInteger('number');
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

export default RollManyCommand;
