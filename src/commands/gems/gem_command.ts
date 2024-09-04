import DiscordCommand from '../discord_command';
import userSchema, { User } from '../../schema/user';

class GemCommand extends DiscordCommand {
    async addGems(uuid: string, numGems: number): Promise<User> {
        const updatedUser = await userSchema.findOneAndUpdate(
            { uuid: uuid },
            {
                $inc: {
                    gems: numGems,
                },
            },
            {
                new: true,
            }, // Returns the updated document
        );

        return updatedUser;
    }
}

export default GemCommand;
