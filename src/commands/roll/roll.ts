import { GetCurrentBanner } from '../../banner';

import userSchema, { User } from '../../schema/user';
import CommandBase from '../command_base';
import DiscordCommand from '../discord_command';

type CharacterFrequencies = {
    [characterName: string]: number;
};

class RollCommand extends CommandBase {
    async addCharacters(
        uuid: string,
        frequencies: CharacterFrequencies,
        totalGemCost: number,
    ): Promise<User> {
        // Check out updatebatch

        // stupid non mongodb way :skull:

        let user = await userSchema.findOne({
            uuid: uuid,
        });

        for (const [characterName, frequency] of Object.entries(frequencies)) {
            const characterIndex = user.inventory.findIndex(
                (inventoryCharacter) => inventoryCharacter.name == characterName,
            );

            if (characterIndex == -1) {
                user.inventory.push({
                    name: characterName,
                    count: frequency,
                });
            } else {
                user.inventory[characterIndex] = {
                    name: characterName,
                    count: user.inventory[characterIndex].count + frequency,
                };
            }
        }

        let updatedUser = await userSchema.findOneAndUpdate(
            {
                uuid: uuid,
            },
            {
                $set: { inventory: user.inventory }, // Replace with new inventory
                $inc: {
                    gems: totalGemCost,
                },
            },
            { new: true },
        );

        return updatedUser;
    }

    generateFrequencies(characterNames: string[]): CharacterFrequencies {
        const frequencies: CharacterFrequencies = {};

        for (const characterName of characterNames) {
            frequencies[characterName] = frequencies[characterName]
                ? frequencies[characterName] + 1
                : 1;
        }

        return frequencies;
    }
}

export default RollCommand;
