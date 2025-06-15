import { SlashCommandBuilder } from '@discordjs/builders';
import { Client, CommandInteraction } from 'discord.js';
import { GetCurrentBanner } from '../banner';
import DiscordCommand from './discord_command';

class CurrentBanner extends DiscordCommand {
    constructor() {
        super(
            new SlashCommandBuilder()
                .setName('current_banner')
                .setDescription('Provides information about the current banner.'),
        );
    }

    override async execute(interaction: CommandInteraction, client: Client): Promise<void> {
        await interaction.reply(
            `The current banner is: ${GetCurrentBanner().name}:\n${GetCurrentBanner().getCardsInBannerStringified()}`,
        );
    }
}

export default CurrentBanner;
