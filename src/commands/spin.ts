import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';

const getCards = async () => {
    return ['pikachu', 'charizard', ''];
};

// // Would be nice to have typescript now
// const getPool = async (event) => {
//     switch (event) {
//         case "halloween":
//             return []
//         case "guildID????"
//             return []
//         default:
//             return []
//     }

// }

export const data = new SlashCommandBuilder().setName('spin').setDescription('Get a random card!');

export async function execute(interaction: CommandInteraction) {
    await interaction.reply(Math.random() > 0.5 ? 'Charizard' : 'Giratina');
}
