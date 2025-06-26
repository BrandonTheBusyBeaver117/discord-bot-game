import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';

import GemCommand from './gem_base';
import { addGems } from './gem_util';

class InfiniteGems extends GemCommand {
    constructor() {
        super(
            new SlashCommandBuilder()
                .setName('devonly_infinite_gems')
                .setDescription('Add 999,999 gems to your account'),
        );
    }

    override async execute(interaction: CommandInteraction): Promise<void> {
        const numGems = 999999;

        const updatedGems = addGems(interaction.user.id, numGems, 'dev only infinite gem');

        await interaction.reply(`You got ${numGems} gems! Your current balance is ${updatedGems}`);
    }
}

export default InfiniteGems;
