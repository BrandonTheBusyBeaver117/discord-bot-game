import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';

import GemCommand from './gem_command';
import userSchema from '../../schema/user';

class ClaimDailyGems extends GemCommand {
    data = new SlashCommandBuilder()
        .setName('claim_daily_gems')
        .setDescription('Claim your daily gems!');

    override async execute(interaction: CommandInteraction): Promise<void> {
        const numDailyGems = 10;

        const updatedUser = await userSchema.findOneAndUpdate(
            {
                $expr: {
                    $and: [
                        {
                            $gte: [
                                '$$NOW',
                                {
                                    $dateAdd: {
                                        startDate: '$dailyTimestamp',
                                        unit: 'day',
                                        amount: 1,
                                    },
                                },
                            ],
                        },
                        { $eq: ['$uuid', interaction.user.id] },
                    ],
                },
            },
            [
                {
                    $set: {
                        gems: { $add: ['$gems', numDailyGems] }, // Increment gems by 1
                        dailyTimestamp: '$$NOW', // Set dailyTimestamp to the current date and time
                    },
                },
            ],
            { new: true }, // Returns the updated document
        );

        if (updatedUser) {
            console.log('success');
            await interaction.reply(
                `You got ${numDailyGems} gems! Your current balance is ${updatedUser.gems}`,
            );
        } else {
            console.log('failed');
            await interaction.reply(`Try again later`);
        }

        // const user = await userSchema.findOneAndUpdate(
        //     { uuid: interaction.user.id },
        //     {
        //         $inc: {

        //             $cond: {
        //                 if: {
        //                     $gte: [
        //                         "$$NOW",  // Current date and time
        //                         { $dateAdd: { startDate: "$dailyTimestamp", unit: "day", amount: 1 } }
        //                       ]
        //                     }
        //             }

        //             gems: numDailyGems,
        //         },
        //     },
        // );

        // const updatedUser = await this.addGems(interaction.user.id, numDailyGems);

        // await interaction.reply(
        //     `You got ${numDailyGems} gems! Your current balance is ${updatedUser.gems}`,
        // );
    }
}

export default ClaimDailyGems;
