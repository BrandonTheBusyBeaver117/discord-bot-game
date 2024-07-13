import { Schema, model } from 'mongoose';

interface user {
    uuid: string;
    inventory: string[];
}

const userSchema = model(
    'userSchema873478912',
    new Schema({
        uuid: { type: String, required: true },
        inventory: [{ type: String, required: true }],
    }),
);

export default userSchema;
