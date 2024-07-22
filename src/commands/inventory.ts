import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';

import userSchema from '../schema/user';
import DiscordCommand from './generic_discord_command';

class InventoryCommand extends DiscordCommand {
    data = new SlashCommandBuilder().setName('inventory').setDescription('See all your cards!');

    override async execute(interaction: CommandInteraction): Promise<void> {
        const user = await userSchema.findOne({ uuid: interaction.user.id });

        await interaction.reply(user.inventory.join(', '));
    }
}

export default InventoryCommand;
