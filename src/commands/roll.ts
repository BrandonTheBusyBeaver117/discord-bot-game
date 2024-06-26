import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';

import { GetCurrentBanner } from '../banner';

export const data = new SlashCommandBuilder().setName('roll').setDescription('Get a random card!');

export async function execute(interaction: CommandInteraction) {
    const banner = GetCurrentBanner();

    await interaction.reply(banner.getCard().name);
}
