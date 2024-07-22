import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';

import userSchema from '../schema/user';
import DiscordCommand from './generic_discord_command';

class ClaimDailyGems extends DiscordCommand {
    data = new SlashCommandBuilder()
        .setName('claim_daily_gems')
        .setDescription('Claim your daily gems!');

    override async execute(interaction: CommandInteraction): Promise<void> {
        const numDailyGems = 10;

        const updatedUser = await userSchema.findOneAndUpdate(
            { uuid: interaction.user.id },
            {
                $inc: { gems: numDailyGems },
            },
        );

        await interaction.reply(
            `You got ${numDailyGems} gems! Your current balance is ${updatedUser.gems}`,
        );
    }
}

export default ClaimDailyGems;
