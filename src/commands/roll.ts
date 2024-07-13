import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';

import { GetCurrentBanner } from '../banner';

import userSchema from '../schema/user';

export const data = new SlashCommandBuilder().setName('roll').setDescription('Get a random card!');

export async function execute(interaction: CommandInteraction) {
    const banner = GetCurrentBanner();

    const character = banner.getCard().name;

    const userExists = await userSchema.exists({ uuid: interaction.user.id });

    if (userExists) {
        await userSchema.updateOne(
            { uuid: interaction.user.id },
            {
                $addToSet: { inventory: character },
            },
        );
    } else {
        await userSchema.create({
            uuid: interaction.user.id,
            inventory: [character],
        });
    }

    await interaction.reply(character);
}
