import { Document, Schema, model } from 'mongoose';

export interface Character extends Document {
    name: string;
    hp: Number;
    attack: Number;

    // Use oneOf
    rarity: String;

    evoA: Character;
    evoB: Character;
}

const characterSchema = new Schema({
    uuid: { type: String, required: true },
    character: [{ type: String, required: true }],
    gems: { type: Number, required: true },
});

export default characterSchema;
