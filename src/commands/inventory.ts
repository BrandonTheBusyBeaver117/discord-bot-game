import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';

import userSchema from '../schema/user';
import DiscordCommand from './discord_command';

class InventoryCommand extends DiscordCommand {
    data = new SlashCommandBuilder().setName('inventory').setDescription('See all your cards!');

    override async execute(interaction: CommandInteraction): Promise<void> {
        const user = await userSchema.findOne({ uuid: interaction.user.id });

        await interaction.reply(
            user.inventory.reduce((prev, current) => prev + current.name + ', ', ''),
        );
    }
}

export default InventoryCommand;
