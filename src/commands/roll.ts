import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';

import { GetCurrentBanner } from '../banner';

import userSchema from '../schema/user';

export const data = new SlashCommandBuilder().setName('roll').setDescription('Get a random card!');

export async function execute(interaction: CommandInteraction) {
    const banner = GetCurrentBanner();

    const character = banner.getCard().name;

    await userSchema.findOneAndUpdate({uuid: interaction.user.id}, {

    })


    await interaction.reply(banner.getCard().name);
}
