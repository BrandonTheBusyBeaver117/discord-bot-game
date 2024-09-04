import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';

import GemCommand from './gem_command';

class InfiniteGems extends GemCommand {
    data = new SlashCommandBuilder()
        .setName('devonly_infinite_gems')
        .setDescription('Add 999,999 gems to your account');

    override async execute(interaction: CommandInteraction): Promise<void> {
        const numGems = 999999;

        const updatedUser = await this.addGems(interaction.user.id, 999999);

        await interaction.reply(
            `You got ${numGems} gems! Your current balance is ${updatedUser.gems}`,
        );
    }
}

export default InfiniteGems;
