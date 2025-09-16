import { SlashCommandBuilder } from '@discordjs/builders';
import { ChatInputCommandInteraction } from 'discord.js';

import { supabase } from '../..';
import { fetchInventory } from '../inventory/inventory_util';
import { getCard } from '../../get_cards';
import CombatBase from './combat_base';

class CreateTeam extends CombatBase {
    constructor() {
        super(
            new SlashCommandBuilder()
                .setName('edit_team')
                .setDescription(
                    'Edit/Create a battle team. Find a current team with /view_team. Get combat IDs via /combat_inventory',
                )
                .addIntegerOption((option) => {
                    return option
                        .setName('team_number')
                        .setDescription('Choose a team from 1-9 to edit')
                        .setRequired(true);
                })
                .addIntegerOption((option) => {
                    return option
                        .setName('id1')
                        .setDescription('4 digit id code')
                        .setRequired(true);
                })
                .addIntegerOption((option) => {
                    return option
                        .setName('id2')
                        .setDescription('4 digit id code')
                        .setRequired(true);
                })
                .addIntegerOption((option) => {
                    return option
                        .setName('id3')
                        .setDescription('4 digit id code')
                        .setRequired(true);
                })
                .addIntegerOption((option) => {
                    return option
                        .setName('id4')
                        .setDescription('4 digit id code')
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

        const inventory = await fetchInventory(interaction.user.id);

        if (!inventory) {
            await interaction.editReply(`Failed to read inventory`);
            return;
        }

        const user_card_ids = inventory.map((item) => item.card.id);

        // const tempTeam = new Map<string, Card>();

        const { teamID, cardIDs } = await this.getInitialTeamCards(interaction.user.id, teamNumber);

        // for (const cardID of cardIDs) {
        //     tempTeam.set(cardID, getCard(cardID));
        // }

        const names = [];
        const rows = [];
        // Cause ids only go from 1 to 4
        for (let i = 1; i < 5; i++) {
            const cardNum = interaction.options.getInteger('id' + i);

            const card = getCard(cardNum.toString());
            console.log(cardNum);
            console.log(card);

            if (!card) {
                await interaction.editReply(
                    `Error: slot ${i} has an invalid id number: ${interaction.options.getInteger('id' + i)}\nPlease try again`,
                );

                return;
            }

            if (!user_card_ids.includes(card.id)) {
                await interaction.editReply(
                    `Error: You have not unlocked the card at slot ${i}\nPlease try again`,
                );

                return;
            }

            rows.push({
                team_id: teamID,
                slot_number: i,
                card_uuid: card.id,
            });

            names.push(card.name);
        }

        // Save selection permanently in Supabase
        const { data, error } = await supabase
            .from('team_slots')
            .upsert(rows, { onConflict: 'team_id,slot_number' });

        if (error) {
            await interaction.editReply({
                content: `Unable to save team`,
                components: [],
            });

            console.log(error);
            return;
        }

        await interaction.editReply({
            content: `Team confirmed: ${names.join(', ')}`,
            components: [],
        });
    }

    async getInitialTeamCards(
        uuid: string,
        teamNum: number,
    ): Promise<{
        teamID: string;
        cardIDs: string[];
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
            cardIDs: sortedIDs,
        };
    }
}

export default CreateTeam;
