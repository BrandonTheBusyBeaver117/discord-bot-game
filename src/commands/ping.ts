import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';
import DiscordCommand from './discord_command';

class PingCommand extends DiscordCommand {
    data: SlashCommandBuilder = new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replies with Pong!');

    override async execute(interaction: CommandInteraction): Promise<void> {
        await interaction.reply('Pong!');
    }
}

export default PingCommand;
