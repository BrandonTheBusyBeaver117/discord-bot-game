import { SlashCommandBuilder, SlashCommandOptionsOnlyBuilder } from 'discord.js';
import DiscordCommand from './discord_command';

class CommandBase extends DiscordCommand {
    constructor(
        data:
            | SlashCommandBuilder
            | SlashCommandOptionsOnlyBuilder = new SlashCommandBuilder().setName('command_base'),
    ) {
        super(data);
    }
}

export default CommandBase;
