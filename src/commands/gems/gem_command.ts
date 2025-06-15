import userSchema, { User } from '../../schema/user';
import CommandBase from '../command_base';

class GemCommand extends CommandBase {
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
