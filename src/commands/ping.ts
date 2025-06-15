import { SlashCommandBuilder } from '@discordjs/builders';
import { Client, CommandInteraction } from 'discord.js';
import DiscordCommand from './discord_command';

class PingCommand extends DiscordCommand {
    constructor() {
        super(new SlashCommandBuilder().setName('ping').setDescription('Replies with Pong!'));
    }

    override async execute(interaction: CommandInteraction, client: Client): Promise<void> {
        await interaction.reply('Pong!');
    }
}

export default PingCommand;
