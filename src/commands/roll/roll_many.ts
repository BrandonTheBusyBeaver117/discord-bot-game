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

        const characterNames: string[] = [];

        for (let i = 0; i < numCharacters; i++) {
            characterNames.push(GetCurrentBanner().getCard().name);
        }

        const frequencies = this.generateFrequencies(characterNames);

        const updatedUser = await this.addCharacters(
            interaction.user.id,
            frequencies,
            -5 * numCharacters,
        );

        let newCharacterString = 'New cards drawn:\n';
        for (const [name, count] of Object.entries(frequencies)) {
            newCharacterString += name + ' x' + count + ', ';
        }
        newCharacterString += '\n\n';

        let newInventoryString = 'Updated Inventory:\n';
        for (const { name, count } of updatedUser.inventory) {
            newInventoryString += name + ' x' + count + ', ';
        }

        await interaction.reply(newCharacterString);
        await interaction.reply(newInventoryString);
    }
}

export default RollManyCommand;
