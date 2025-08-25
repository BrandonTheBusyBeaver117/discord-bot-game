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
                .setDescription('Create a team for battle')
                .addIntegerOption((option) => {
                    return option
                        .setName('number')
                        .setDescription('Choose a slot from 1-9 to edit')
                        .setRequired(true);
                }),
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

        const { teamID, cardIDs } = await this.getInitialTeamCards(interaction.user.id, teamNumber);

        for (const cardID of cardIDs) {
            tempTeam.set(cardID, getCard(cardID));
        }

        await interaction.editReply({
            content: `Select your team (${tempTeam.size}/${MAX_TEAM_SIZE} selected)`,
            components: this.buildTeamPageButtons(cards, 0, tempTeam), // page 0
            // ephemeral: true,
        });

        const msg = (await interaction.fetchReply()) as Message;

        this.createCollector(interaction.user.id, msg, cards, tempTeam, teamID);
    }

    async getInitialTeamCards(
        uuid: string,
        teamNum: number,
    ): Promise<{
        teamID: string;
        cardIDs: string[];
    }> {
        // Check if user exists
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

    buildTeamPageButtons(
        roster: Card[],
        page: number,
        tempTeam: Map<string, Card>,
        disabled: boolean = false,
    ) {
        // Cannot exceed 5
        const ROW_SIZE = 4;

        // We only want 2 rows so we have room for other rows
        const NUM_ROWS = 2;

        const PAGE_SIZE = ROW_SIZE * NUM_ROWS;

        const rows: ActionRowBuilder<ButtonBuilder>[] = [];
        const start = page * PAGE_SIZE;
        const end = Math.min(start + PAGE_SIZE, roster.length);

        // ✅ Show currently selected characters (row of deselect buttons)
        if (tempTeam.size > 0) {
            const selectedRow = new ActionRowBuilder<ButtonBuilder>();

            for (const [cardId, card] of tempTeam) {
                const card = roster.find((c) => c.id === cardId);
                if (!card) continue;

                selectedRow.addComponents(
                    // scuffed af, but as long as it starts with "select"
                    // Then it will run select logic
                    // We attach the remove to it to make it a "unique" id
                    new ButtonBuilder()
                        .setCustomId(`selectREMOVE_${page}_${card.id}`)
                        .setLabel(`❌ ${card.name}`)
                        .setStyle(ButtonStyle.Danger),
                );
            }

            rows.push(selectedRow);
        }

        // const spacerRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        //     new ButtonBuilder()
        //         .setCustomId('spacer')
        //         .setLabel('       ')
        //         .setStyle(ButtonStyle.Secondary)
        //         .setDisabled(true),
        // );

        // rows.push(spacerRow);

        // Split characters into chunks of 4
        const pageCards = roster.slice(start, end);
        const chunks: (typeof pageCards)[] = [];
        for (let i = 0; i < pageCards.length; i += ROW_SIZE) {
            chunks.push(pageCards.slice(i, i + ROW_SIZE));
        }

        // Build rows from chunks
        for (const chunk of chunks) {
            const row = new ActionRowBuilder<ButtonBuilder>();
            for (const card of chunk) {
                const selected = tempTeam.has(card.id);
                row.addComponents(
                    new ButtonBuilder()
                        .setCustomId(`select_${page}_${card.id}`)
                        .setLabel(selected ? `✅ ${card.name}` : card.name)
                        .setStyle(selected ? ButtonStyle.Success : ButtonStyle.Primary)
                        .setDisabled(disabled),
                );
            }
            rows.push(row);
        }

        // Navigation + confirm row
        const navRow = new ActionRowBuilder<ButtonBuilder>();

        navRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`page_${page - 1}`)
                .setLabel('⬅️')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(page <= 0),
        );

        navRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`page_${page + 1}`)
                .setLabel('➡️')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(page >= roster.length),
        );

        navRow.addComponents(
            new ButtonBuilder()
                .setCustomId('cancel')
                .setLabel('Cancel Team')
                .setStyle(ButtonStyle.Danger),
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
        teamID: string,
    ) {
        const collector = message.createMessageComponentCollector({ time: 300_000 });

        collector.on('collect', async (i) => {
            collector.resetTimer();
            // Adding character to team
            if (i.customId.startsWith('select')) {
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

            // Cancel team
            else if (i.customId === 'cancel') {
                await i.update({
                    content: `Team creation cancelled`,
                    components: [],
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
                        team_id: teamID,
                        slot_number: k,
                        card_uuid: key,
                    });
                    k++;

                    names.push(value.name);
                }

                // Save selection permanently in Supabase
                const { data, error } = await supabase
                    .from('team_slots')
                    .upsert(rows, { onConflict: 'team_id,slot_number' });

                if (error) {
                    await i.update({
                        content: `Unable to save team`,
                        components: [],
                    });

                    console.log(error);
                    return;
                }

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
