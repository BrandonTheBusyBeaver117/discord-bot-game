import { ActionRowBuilder, ButtonBuilder, SlashCommandBuilder } from '@discordjs/builders';
import { ButtonStyle, ChatInputCommandInteraction, CommandInteraction, Message } from 'discord.js';

import { supabase } from '../..';
import { fetchInventory } from '../inventory/inventory_util';
import { Card, getCard } from '../../get_cards';
import CombatBase from './combat_base';

interface RosterCard extends Card {
    slotNum: number;
}

const MAX_TEAM_SIZE = 4;
class CreateTeam extends CombatBase {
    constructor() {
        super(
            new SlashCommandBuilder()
                .setName('create_team')
                .setDescription('Create a team for battle - choose a slot from 1-9 to edit'),
        );
    }

    override async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        await interaction.deferReply(); // Acknowledge the interaction immediately

        const teamNumber = interaction.options.getInteger('number');

        if (!teamNumber || teamNumber < 1 || teamNumber > 9) {
            await interaction.editReply('Please choose a number between 1-9!');
            return;
        }

        const cards = (await fetchInventory(interaction)).map((item) => item.card);

        const tempTeam = new Map<string, Card>();

        const initalTeamCardIDs = await this.getInitialTeamCards(interaction.user.id, teamNumber);

        for (const cardID of initalTeamCardIDs) {
            tempTeam.set(cardID, getCard(cardID));
        }

        await interaction.reply({
            content: `Select your team (${tempTeam.size}/${MAX_TEAM_SIZE} selected)`,
            components: this.buildTeamPageButtons(cards, 0, tempTeam), // page 0
            ephemeral: true,
        });

        const msg = (await interaction.fetchReply()) as Message;

        this.createCollector(interaction.user.id, msg, cards, tempTeam, teamNumber);
    }

    async getInitialTeamCards(uuid: string, teamNum: number): Promise<string[]> {
        // Check if user exists
        const { data: existingTeam } = await supabase
            .from('team_ids')
            .select('id')
            .match({ user_id: uuid, team_number: teamNum })
            .single();

        let teamID = existingTeam.id;

        if (!existingTeam) {
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

        return sortedRows.map((row) => row.card_uuid);
    }

    buildTeamPageButtons(
        roster: Card[],
        page: number,
        tempTeam: Map<string, Card>,
        disabled: boolean = false,
    ) {
        const PAGE_SIZE = 5;
        const rows: ActionRowBuilder<ButtonBuilder>[] = [];
        const start = page * PAGE_SIZE;
        const end = Math.min(start + PAGE_SIZE, roster.length);
        // Character buttons
        const charRow = new ActionRowBuilder<ButtonBuilder>();
        roster.slice(start, end).forEach((card) => {
            const selected = tempTeam.has(card.id);
            charRow.addComponents(
                new ButtonBuilder()
                    .setCustomId(`select_${page}_${card.id}`)
                    .setLabel(selected ? `✅ ${card.name}` : card.name)
                    .setStyle(selected ? ButtonStyle.Success : ButtonStyle.Primary)
                    .setDisabled(disabled),
            );
        });
        rows.push(charRow);

        // Navigation + confirm row
        const navRow = new ActionRowBuilder<ButtonBuilder>();
        if (page > 0)
            navRow.addComponents(
                new ButtonBuilder()
                    .setCustomId(`page_${page - 1}`)
                    .setLabel('⬅️')
                    .setStyle(ButtonStyle.Secondary),
            );
        if (end < roster.length)
            navRow.addComponents(
                new ButtonBuilder()
                    .setCustomId(`page_${page + 1}`)
                    .setLabel('➡️')
                    .setStyle(ButtonStyle.Secondary),
            );
        navRow.addComponents(
            new ButtonBuilder()
                .setCustomId('confirm')
                .setLabel('Confirm Team')
                .setStyle(ButtonStyle.Success),
        );
        rows.push(navRow);

        return rows;
    }

    createCollector(
        userId: string,
        message: Message,
        roster: Card[],
        tempTeam: Map<string, Card>,
        teamNumber: number,
    ) {
        const collector = message.createMessageComponentCollector({ time: 300_000 });

        collector.on('collect', async (i) => {
            collector.resetTimer();
            // Adding character to team
            if (i.customId.startsWith('select_')) {
                // Format of `select_${page}_${card.id}`
                const [, page, charId] = i.customId.split('_');

                if (tempTeam.has(charId)) {
                    // deselect
                    tempTeam.delete(charId);
                } else if (tempTeam.size < MAX_TEAM_SIZE) {
                    tempTeam.set(
                        charId,
                        roster.find((character) => character.id === charId),
                    );
                }

                const disabled = tempTeam.size >= MAX_TEAM_SIZE;

                await i.update({
                    content: `Select your team (${tempTeam.size}/${MAX_TEAM_SIZE} selected)`,
                    components: this.buildTeamPageButtons(
                        roster,
                        parseInt(page),
                        tempTeam,
                        disabled,
                    ),
                });
            }

            // Pagination
            else if (i.customId.startsWith('page_')) {
                const page = parseInt(i.customId.split('_')[1]);
                await i.update({
                    content: `Select your team (${tempTeam.size}/${MAX_TEAM_SIZE} selected)`,
                    components: this.buildTeamPageButtons(roster, page, tempTeam),
                });
            }

            // Confirm team
            else if (i.customId === 'confirm') {
                if (tempTeam.size < 1) {
                    await i.followUp({
                        content: `You need at least ${1} character in your team!`,
                        ephemeral: true,
                    });
                    return;
                }

                const names = [];

                const rows = [];
                let k = 1;
                for (const [key, value] of tempTeam) {
                    rows.push({
                        user_id: userId,
                        team_number: teamNumber,
                        card_id: key,
                        slot_number: k,
                    });
                    k++;

                    names.push(value.name);
                }
                // Save selection permanently in Supabase
                await supabase
                    .from('team_slots')
                    .upsert(rows, { onConflict: 'user_id,team_number,slot_number' });

                await i.update({
                    content: `Team confirmed: ${names.join(', ')}`,
                    components: [],
                });

                // tempSelectedTeams.delete(userId);
                collector.stop();
            }
        });

        collector.on('end', () => {
            // tempSelectedTeams.delete(userId);
        });
    }
}

export default CreateTeam;
