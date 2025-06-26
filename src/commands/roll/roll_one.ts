import { SlashCommandBuilder, EmbedBuilder } from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';

import { getCurrentRandomBanner } from '../../banner';

import RollCommand from './roll_base';
import { getCard } from '../../get_cards';
import { pullCards, addCharacters } from './roll_util';
import { fetchCards } from '../inventory/inventory_util';

class RollOneCommand extends RollCommand {
    constructor() {
        super(new SlashCommandBuilder().setName('roll').setDescription('Get a random card!'));
    }

    override async execute(interaction: CommandInteraction): Promise<void> {
        const frequency = pullCards(getCurrentRandomBanner(), 1);
        const updatedGems = await addCharacters(interaction.user.id, frequency, 5);

        const updatedInventory = await fetchCards(interaction, Array.from(frequency.keys()));

        // Making sure we only pulled a single card...
        if (updatedInventory.length !== 1) {
            await interaction.reply("something very bad has happened - we didn't pull one card");
            return;
        }

        // Only works cause we pulled a single card
        const characterName = getCard(updatedInventory[0].card_id).name;

        const imageLink = `https://res.cloudinary.com/anicardimages/image/upload/images/${characterName.replace(' ', '%20')}`;

        const embed = new EmbedBuilder()
            .setTitle('You rolled!')
            .setDescription('New card drawn: **' + characterName + '**')
            .addFields(
                {
                    name: 'Updated Inventory',
                    value: `**${characterName}** x${updatedInventory[0].quantity}`,
                    inline: true,
                },
                {
                    name: 'Gem Balance',
                    value: `${updatedGems}`,
                    inline: true,
                },
            )
            .setImage('https://media.lmpm.website/uploads/sites/82/2025/03/Bay-Area-Cities.jpg');

        await interaction.reply({ embeds: [embed] });
    }
}

export default RollOneCommand;
