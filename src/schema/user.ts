import { Document, Schema, model } from 'mongoose';

export interface InventoryItem {
    name: string;
    count: number;
}

export interface User extends Document {
    uuid: string;
    inventory: InventoryItem[];
    gems: Number;
    dailyTimestamp: Date;
}

const userSchema = model<User>(
    'userSchema873478912',
    new Schema({
        uuid: { type: String, required: true },
        inventory: [
            {
                name: { type: String, required: true },
                count: { type: Number, required: true },
            },
        ],
        gems: { type: Number, required: true },
        dailyTimestamp: { type: Date, required: true },
    }),
);

export default userSchema;
