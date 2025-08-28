import { EmbedBuilder, SlashCommandBuilder } from '@discordjs/builders';
import { ChatInputCommandInteraction } from 'discord.js';

import { supabase } from '../..';
import { Card, getCard } from '../../get_cards';
import CombatBase from './combat_base';

class ViewTeam extends CombatBase {
    constructor() {
        super(
            new SlashCommandBuilder()
                .setName('view_team')
                .setDescription('View your desired team')
                .addIntegerOption((option) => {
                    return option
                        .setName('team_number')
                        .setDescription('Choose a slot from 1-9 to view')
                        .setRequired(true);
                }),
        );
    }

    override async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        await interaction.deferReply(); // Acknowledge the interaction immediately

        const teamNumber = interaction.options.getInteger('team_number');

        if (!teamNumber || teamNumber < 1 || teamNumber > 9) {
            await interaction.editReply('Please choose a slot number between 1-9!');
            return;
        }

        const { teamID, slots } = await this.getInitialTeamCards(interaction.user.id, teamNumber);

        let message = 'You have no units in this team slot';

        if (slots.length !== 0) {
            message = slots.map((item) => `Slot #${item.slotNumber}: ${item.card.name}`).join('\n');
        }

        await interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setTitle(`${interaction.user.displayName}'s Team #${teamNumber}`)
                    .setDescription(message),
            ],
        });
    }

    async getInitialTeamCards(
        uuid: string,
        teamNum: number,
    ): Promise<{
        teamID: string;
        slots: {
            slotNumber: number;
            card: Card;
        }[];
    }> {
        // Check if team exists
        const { data: existingTeam } = await supabase
            .from('team_ids')
            .select('id')
            .match({ user_id: uuid, number: teamNum })
            .single();

        let teamID = existingTeam?.id;

        if (!existingTeam) {
            console.log('no existy');
            const { data: newTeam, error } = await supabase
                .from('team_ids')
                .insert([{ user_id: uuid, number: teamNum, name: `Team #${teamNum}` }])
                .select('id')
                .single();

            // No error handling T-T
            // Returns the new team if successfully added new team
            if (newTeam) {
                teamID = newTeam.id;
            }
        }

        const { data, error } = await supabase
            .from('team_slots')
            .select('card_uuid, slot_number')
            .eq('team_id', teamID);

        if (error) throw error;

        const sortedRows = data.sort((rowA, rowB) => rowA.slot_number - rowB.slot_number);

        const sortedIDs = sortedRows.map((row) => row.card_uuid);
        return {
            teamID: teamID,
            slots: sortedRows.map((row) => {
                return {
                    slotNumber: row.slot_number,
                    card: getCard(row.card_uuid),
                };
            }),
        };
    }
}

export default ViewTeam;
