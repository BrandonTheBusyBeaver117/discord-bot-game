import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';

import userSchema from '../schema/user';
import DiscordCommand from './generic_discord_command';

class CreateAccount extends DiscordCommand {
    data = new SlashCommandBuilder()
        .setName('create_account')
        .setDescription('Create a new Anicards account');

    override async execute(interaction: CommandInteraction): Promise<void> {
        const userExists = await userSchema.exists({ uuid: interaction.user.id });

        if (userExists) {
            await interaction.reply('You already created an Anicards account!');
        } else {
            //TODO: I remember there was a way to instantiate default database values
            await userSchema.create({
                uuid: interaction.user.id,
                inventory: [],
                gems: 0,
                daily_timestamp: new Date('2000-00-00'),
            });

            await interaction.reply('Anicards account successfully created!');
        }
    }
}

export default CreateAccount;
