import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';
import { GetCurrentBanner } from '../banner';

export const data = new SlashCommandBuilder()
    .setName('current_banner')
    .setDescription('Provides information about the current banner.');

export async function execute(interaction: CommandInteraction) {
    await interaction.reply(`The current banner is: ${GetCurrentBanner().name}:\n${GetCurrentBanner().getCardsInBannerStringified()}
    `);
}
