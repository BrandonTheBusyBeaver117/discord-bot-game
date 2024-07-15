import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';

import { GetCurrentBanner } from '../banner';

import userSchema from '../schema/user';
import DiscordCommand from './generic_discord_command';

class RollManyCommand extends DiscordCommand {
    data = new SlashCommandBuilder().setName('roll-many').setDescription('Get a random card!');

    override async execute(interaction: CommandInteraction): Promise<void> {
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
                gems: 0,
                daily_timestamp: new Date('2000-00-00'),
            });
        }

        await interaction.reply(character);
    }
}

export default RollManyCommand;

export function basicRoll(numCards: number): string[] {
    const banner = GetCurrentBanner();

    const characters = [];

    for (let i = 0; i < numCards; i++) {
        characters.push(banner.getCard().name);
    }

    return characters;
}
