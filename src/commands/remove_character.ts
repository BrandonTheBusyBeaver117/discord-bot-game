import { SlashCommandBuilder } from '@discordjs/builders';
import { ChatInputCommandInteraction, CommandInteraction } from 'discord.js';

import userSchema from '../schema/user';
import DiscordCommand from './generic_discord_command';

class RemoveCommand extends DiscordCommand {
    data = new SlashCommandBuilder()
        .setName('remove_character')
        .setDescription('Remove an unwanted character from your deck')
        .addStringOption((option) => {
            return option
                .setName('character')
                .setDescription('The character to delete')
                .setRequired(true);
        });

    override async execute(interaction: ChatInputCommandInteraction): Promise<void> {
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
}

export default RemoveCommand;
