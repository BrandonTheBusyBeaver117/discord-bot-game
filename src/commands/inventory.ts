import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';

import userSchema from '../schema/user';

// import { MongooseError } from 'mongoose';

export const data = new SlashCommandBuilder()
    .setName('inventory')
    .setDescription('See all your cards!');

export async function execute(interaction: CommandInteraction) {

    const userExists = await userSchema.exists({ uuid: interaction.user.id })

    if (!userExists) {
        await interaction.reply("Roll before checking your inventory!");
        return;
    }

    const user = await userSchema.findOne({ uuid: interaction.user.id })


    await interaction.reply(user.inventory.join(", "));
}
