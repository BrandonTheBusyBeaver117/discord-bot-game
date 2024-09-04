import { connect } from 'mongoose';
import userSchema from './schema/user';
import mongoConfig from './mongoConfig';

const update = async () => {
    try {
        await connect(mongoConfig.MONGODB_URL);
        const result = await userSchema.updateMany(
            // Need to learn how to search for fields that don't exist
            {},
            {
                $set: { gems: 0, dailyTimestamp: new Date(0) },
            },
            { strict: false },
        );

        console.log(result);
    } catch (err) {
        console.log(err);
    }
};

update();
