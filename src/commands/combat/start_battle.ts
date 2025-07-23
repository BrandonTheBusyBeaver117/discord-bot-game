import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';

import GemCommand from './combat_base';
import { supabase } from '../..';
import CombatBase from './combat_base';

class Stats extends CombatBase {
    constructor() {
        super(
            new SlashCommandBuilder()
                .setName('get_user_move')
                .setDescription('Claim your daily gems!'),
        );
    }

    override async execute(interaction: CommandInteraction): Promise<void> {
        const { data, error } = await supabase.rpc('claim_daily_gems', {
            target_user_id: interaction.user.id,
            // it's 100 by default lol
            gem_amount: 10,
        });

        if (error) {
            if (error.message.includes('Already claimed')) {
                await interaction.reply('You already claimed your daily gems! Come back tomorrow.');
            } else {
                await interaction.reply('Error claiming gems:' + error);
            }

            return;
        }

        await interaction.reply('Claim successful! New gem total:' + data);
    }
}

export default Stats;
