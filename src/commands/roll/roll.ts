import { GetCurrentBanner } from '../../banner';

import userSchema, { User } from '../../schema/user';
import DiscordCommand from '../discord_command';

class RollCommand extends DiscordCommand {
    async addCharacters(
        uuid: string,
        characterNames: string[],
        totalGemCost: number,
    ): Promise<User> {
        // Check out updatebatch

        const character = { name: 'newCharacter', count: 1 };

        // stupid non mongodb way :skull:

        let user = await userSchema.findOne({
            uuid: uuid,
        });

        const frequencies: { characterName: number } = { characterName: 0 };

        for (const characterName of characterNames) {
            frequencies[characterName] = frequencies[characterName]
                ? frequencies[characterName] + 1
                : 1;
        }

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

        // if (!updatedUser) {
        //     updatedUser = await userSchema.findOneAndUpdate(
        //         {
        //             uuid: uuid,
        //             'inventory.name': character.name, // Now find where the name matches
        //         },
        //         {
        //             $inc: { 'inventory.$.count': 1 }, // Increment the count if it exists
        //         },
        //         { new: true },
        //     );
        // }

        // // Needs to be refactored to allow for multiple updates
        // const updatedUser = await userSchema.findOneAndUpdate(
        //     { uuid: uuid },
        //     {
        //         $inc: {
        //             'inventory.$[e].count': 1,
        //             gems: totalGemCost,
        //         },
        //     },
        //     {
        //         new: true,
        //         arrayFilters: [{ 'e.count': { $lt: 10 }, 'e.name': { $in: characters } }],
        //     },
        // );

        return updatedUser;
    }
}

export default RollCommand;

export function basicRoll(numCards: number): string[] {
    const banner = GetCurrentBanner();

    const characters = [];

    for (let i = 0; i < numCards; i++) {
        characters.push(banner.getCard().name);
    }

    return characters;
}
