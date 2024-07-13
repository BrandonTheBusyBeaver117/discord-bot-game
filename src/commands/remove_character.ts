import { SlashCommandBuilder } from '@discordjs/builders';
import { ChatInputCommandInteraction } from 'discord.js';

import userSchema from '../schema/user';

export const data = new SlashCommandBuilder()
    .setName('remove_character')
    .setDescription('Remove an unwanted character from your deck')
    .addStringOption((option) => {
        return option
            .setName('character')
            .setDescription('The character to delete')
            .setRequired(true);
    });

export async function execute(interaction: ChatInputCommandInteraction) {
    const userExists = await userSchema.exists({ uuid: interaction.user.id });

    if (!userExists) {
        await interaction.reply('Roll before checking your inventory!');
        return;
    }

    const updatedUser = await userSchema.findOneAndUpdate(
        { uuid: interaction.user.id },
        {
            $pull: { inventory: interaction.options.getString('character') },
        },
        {
            new: true,
        },
    );

    await interaction.reply(updatedUser.inventory.join(', '));
}
