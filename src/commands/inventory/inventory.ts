import { SlashCommandBuilder } from '@discordjs/builders';
import { Client, CommandInteraction } from 'discord.js';

import InventoryBase from './inventory_base';
import { fetchInventory, textifyInventory } from './inventory_util';

export type Inventory = {
    card_id: string;
    quantity: number;
}[];

class InventoryCommand extends InventoryBase {
    constructor() {
        super(new SlashCommandBuilder().setName('inventory').setDescription('See all your cards!'));
    }

    override async execute(interaction: CommandInteraction, client: Client): Promise<void> {
        // Build the inventory message
        const data = await fetchInventory(interaction);
        const inventoryText = textifyInventory(data);

        await interaction.reply(inventoryText);
    }
}

export default InventoryCommand;
