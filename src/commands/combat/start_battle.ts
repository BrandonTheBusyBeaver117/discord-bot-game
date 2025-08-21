import { ActionRowBuilder, ButtonBuilder, SlashCommandBuilder } from '@discordjs/builders';
import {
    ButtonInteraction,
    ButtonStyle,
    Client,
    CommandInteraction,
    EmbedBuilder,
    MessageComponentInteraction,
} from 'discord.js';

import CombatBase from './combat_base';
import { Battle, BattleState, Combatant, CombatantAction, Move } from './combat_util';

class StartBattle extends CombatBase {
    constructor() {
        super(
            new SlashCommandBuilder()
                .setName('start_battle')
                .setDescription('Challenge someone to a battle!'),
        );
    }
    override async execute(interaction: CommandInteraction, client: Client): Promise<void> {
        const declineButton = new ButtonBuilder()
            .setCustomId('decline')
            .setLabel('Decline')
            .setStyle(ButtonStyle.Secondary);

        const acceptButton = new ButtonBuilder()
            .setCustomId('accept')
            .setLabel('Accept!')
            .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            declineButton,
            acceptButton,
        );

        // Initial public challenge message
        const message = await interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setTitle(`${interaction.user.username} challenges you to a battle!`)
                    .setDescription('Do you accept?'),
            ],
            components: [row],
        });

        // Collector logic
        const startCollector = () => {
            let oppInteraction: MessageComponentInteraction | null = null;

            const collector = message.createMessageComponentCollector({
                time: 60_000, // 60s timeout
            });

            collector.on('collect', async (collectorInteraction) => {
                if (collectorInteraction.customId === 'accept') {
                    oppInteraction = collectorInteraction;

                    // Instead of deferUpdate, reply ephemerally to acknowledge
                    await collectorInteraction.reply({
                        content: 'You accepted the challenge! Preparing battle…',
                        ephemeral: true,
                    });
                }

                if (collectorInteraction.customId === 'decline') {
                    await collectorInteraction.reply({
                        content: 'You declined the challenge.',
                        ephemeral: true,
                    });
                }

                collector.stop();
            });

            collector.on('end', async () => {
                declineButton.setDisabled(true);
                acceptButton.setDisabled(true);

                // Disable buttons in the public challenge message
                await message.edit({ components: [row] }).catch(() => {});

                if (oppInteraction) {
                    // Pass both interactions into battle
                    this.startBattle(
                        interaction, // CommandInteraction
                        oppInteraction, // MessageComponentInteraction
                    );
                }
            });
        };

        startCollector();
    }

    private async getInitialCharacters(uuid: string): Promise<Combatant[]> {
        return [
            new Combatant({
                name: 'Zephyr',
                stats: { health: 8500, damage: 18, defense: 10, speed: 50, accuracy: 1 },
                teamId: 'a',
                moves: [
                    {
                        name: 'Copycat',
                        type: 'normal',
                        damage: 0,
                        effects: ['copy'],
                        target: 'single',
                        copy: false,
                        accuracy: 1.0,
                    },
                ],
            }),
        ];
    }

    private async getActionForCombatant(
        interaction: CommandInteraction | ButtonInteraction | MessageComponentInteraction,
        combatant: Combatant,
        opponentCombatants: Combatant[],
    ): Promise<CombatantAction> {
        // Step 1: ask for a move
        const chosenMove = await new Promise<Move>((resolve) => {
            const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
                ...combatant.moves.map((m, idx) =>
                    new ButtonBuilder()
                        .setCustomId(`${idx}`)
                        .setLabel(m.name)
                        .setStyle(ButtonStyle.Primary),
                ),
            );

            interaction.followUp({
                content: `Choose a move for **${combatant.name}**:`,
                components: [row],
                ephemeral: true,
            });

            const collector = interaction.channel!.createMessageComponentCollector({
                time: 30_000,
                filter: (i) => i.user.id === interaction.user.id,
            });

            collector.on('collect', async (i) => {
                const idx = parseInt(i.customId);
                await i.deferUpdate();
                resolve(combatant.moves[idx]); // ✅ resolve the move
                collector.stop();
            });
        });

        // Step 2: once we have a move, ask for a target
        const chosenTarget = await new Promise<Combatant>((resolve) => {
            const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
                ...opponentCombatants.map((target) =>
                    new ButtonBuilder()
                        .setCustomId(`${target.uuid}`)
                        .setLabel(target.name)
                        .setStyle(ButtonStyle.Secondary),
                ),
            );

            interaction.followUp({
                content: `Choose a target for **${combatant.name}**’s **${chosenMove.name}**:`,
                components: [row],
                ephemeral: true,
            });

            const collector = interaction.channel!.createMessageComponentCollector({
                time: 30_000,
                filter: (i) => i.user.id === interaction.user.id,
            });

            collector.on('collect', async (i) => {
                const targetUUID = i.customId;
                await i.deferUpdate();
                resolve(opponentCombatants.find((target) => target.uuid === targetUUID)!); // ✅ resolve target
                collector.stop();
            });
        });

        // Step 3: return the full action triple
        return {
            uuid: combatant.uuid,
            move: chosenMove,
            target: chosenTarget,
        };
    }

    private async getUserActions(
        interaction: CommandInteraction | ButtonInteraction | MessageComponentInteraction,
        userCombatants: Combatant[],
        opponentCombatants: Combatant[],
    ): Promise<[string, CombatantAction][]> {
        const results: [string, CombatantAction][] = [];

        for (const combatant of userCombatants) {
            const action = await this.getActionForCombatant(
                interaction,
                combatant,
                opponentCombatants,
            );
            results.push([action.uuid, action]);
        }

        return results;
    }

    private async getAllActions(
        queue: Combatant[],
        battleState: BattleState,
        interactionA: CommandInteraction,
        interactionB: MessageComponentInteraction,
    ): Promise<Map<string, CombatantAction>> {
        const actionMap = new Map<string, CombatantAction>();

        const [actionsA, actionsB] = await Promise.all([
            this.getUserActions(
                interactionA,
                queue.filter((combatant) => combatant.teamId === 'a'),
                battleState.teams.b.filter((combatant) => combatant.isAlive()),
            ),
            this.getUserActions(
                interactionB,
                queue.filter((combatant) => combatant.teamId === 'b'),
                battleState.teams.a.filter((combatant) => combatant.isAlive()),
            ),
        ]);

        for (const [uuid, action] of [...actionsA, ...actionsB]) {
            actionMap.set(uuid, action);
        }

        return actionMap;
    }

    private async startBattle(
        interactionA: CommandInteraction,
        interactionB: MessageComponentInteraction,
    ) {
        // This still broken
        // Fix later
        const [teamA, teamB] = await Promise.all([
            [
                new Combatant({
                    name: 'Zephyr',
                    stats: { health: 8500, damage: 18, defense: 10, speed: 50, accuracy: 1 },
                    teamId: 'a',
                    moves: [
                        {
                            name: 'Copycat',
                            type: 'normal',
                            damage: 0,
                            effects: ['copy'],
                            target: 'single',
                            copy: false,
                            accuracy: 1.0,
                        },
                    ],
                }),
            ],
            [
                new Combatant({
                    name: 'Zephyr',
                    stats: { health: 8500, damage: 18, defense: 10, speed: 50, accuracy: 1 },
                    teamId: 'a',
                    moves: [
                        {
                            name: 'Copycat',
                            type: 'normal',
                            damage: 0,
                            effects: ['copy'],
                            target: 'single',
                            copy: false,
                            accuracy: 1.0,
                        },
                    ],
                }),
            ],
        ]);

        let playBattle = true;

        const uponWinning = (winningTeam: 'a' | 'b') => {
            console.log(winningTeam);
            playBattle = false;
        };

        const battleState = new BattleState(teamA, teamB);
        const battle = new Battle(battleState, uponWinning);

        while (playBattle) {
            battle.processTurn((queue) =>
                this.getAllActions(queue, battleState, interactionA, interactionB),
            );
        }
    }
}

export default StartBattle;
