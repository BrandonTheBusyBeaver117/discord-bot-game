import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';
import { GetCurrentBanner } from '../banner';
import DiscordCommand from './discord_command';

class CurrentBanner extends DiscordCommand {
    data = new SlashCommandBuilder()
        .setName('current_banner')
        .setDescription('Provides information about the current banner.');

    override async execute(interaction: CommandInteraction): Promise<void> {
        await interaction.reply(
            `The current banner is: ${GetCurrentBanner().name}:\n${GetCurrentBanner().getCardsInBannerStringified()}`,
        );
    }
}

export default CurrentBanner;
