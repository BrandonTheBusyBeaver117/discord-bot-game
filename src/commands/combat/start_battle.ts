import { ActionRowBuilder, ButtonBuilder, SlashCommandBuilder } from '@discordjs/builders';
import {
    ButtonInteraction,
    ButtonStyle,
    Client,
    CommandInteraction,
    EmbedBuilder,
    Message,
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
        const message = await interaction.reply({
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
        return new Promise<CombatantAction>(async (resolve) => {
            let chosenMove: Move | null = null;
            let chosenTarget: Combatant | null = null;

            // Row 1: moves
            const moveRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
                ...combatant.moves.map((m, idx) =>
                    new ButtonBuilder()
                        .setCustomId(`move-${idx}`)
                        .setLabel(m.name)
                        .setStyle(ButtonStyle.Primary),
                ),
            );

            // Row 2: targets
            const targetRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
                ...opponentCombatants.map((target, idx) =>
                    new ButtonBuilder()
                        .setCustomId(`target-${idx}`)
                        .setLabel(target.name)
                        .setStyle(ButtonStyle.Secondary),
                ),
            );

            // Row 3: confirm (disabled at first)
            const confirmRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder()
                    .setCustomId('confirm')
                    .setLabel('Confirm')
                    .setStyle(ButtonStyle.Success)
                    .setDisabled(true),
            );

            const message = await interaction.followUp({
                content: `Choose an action for **${combatant.name}**`,
                components: [moveRow, targetRow, confirmRow],
                ephemeral: true,
                fetchReply: true,
            });

            const collector = (message as Message).createMessageComponentCollector({
                time: 60_000,
                filter: (i) => i.user.id === interaction.user.id,
            });

            collector.on('collect', async (i) => {
                let updatedContent = `Choose an action for **${combatant.name}**`;

                // Move selected
                if (i.customId.startsWith('move-')) {
                    const idx = parseInt(i.customId.replace('move-', ''));
                    chosenMove = combatant.moves[idx];

                    // Reset styles to Primary, highlight the chosen one
                    moveRow.components.forEach((btn, j) => {
                        (btn as ButtonBuilder).setStyle(
                            j === idx ? ButtonStyle.Success : ButtonStyle.Primary,
                        );
                    });
                }

                // Target selected
                if (i.customId.startsWith('target-')) {
                    const idx = parseInt(i.customId.replace('target-', ''));
                    chosenTarget = opponentCombatants[idx];

                    // Reset styles to Secondary, highlight the chosen one
                    targetRow.components.forEach((btn, j) => {
                        (btn as ButtonBuilder).setStyle(
                            j === idx ? ButtonStyle.Success : ButtonStyle.Secondary,
                        );
                    });
                }

                // Update confirm button state
                if (chosenMove && chosenTarget) {
                    confirmRow.components[0].setDisabled(false);
                    updatedContent = `Move: **${chosenMove.name}**\nTarget: **${chosenTarget.name}**\nClick confirm to lock in.`;
                }

                // Confirm selected
                if (i.customId === 'confirm') {
                    await i.update({
                        content: `✅ Action locked: **${chosenMove?.name}** on **${chosenTarget?.name}**.`,
                        components: [],
                    });
                    collector.stop();
                    return resolve({
                        uuid: combatant.uuid,
                        move: chosenMove!,
                        target: chosenTarget!,
                    });
                }

                // Update the message for move/target selection
                await i.update({
                    content: updatedContent,
                    components: [moveRow, targetRow, confirmRow],
                });
            });

            collector.on('end', async () => {
                if (!chosenMove || !chosenTarget) {
                    // Timeout case
                    await (message as Message).edit({
                        content: `⏳ Action selection timed out.`,
                        components: [],
                    });
                }
            });
        });
    }

    private async getUserActions(
        interaction: CommandInteraction | ButtonInteraction | MessageComponentInteraction,
        userCombatants: Combatant[],
        opponentCombatants: Combatant[],
    ): Promise<[string, CombatantAction][]> {
        const results: [string, CombatantAction][] = [];

        console.log('we are getting user actions');

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

        console.log('we are getting all actions');

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
        // // This still broken
        // // Fix later
        // const [teamA, teamB] = await Promise.all([
        //     [
        //         new Combatant({
        //             name: 'Zephyr',
        //             stats: { health: 8500, damage: 18, defense: 10, speed: 50, accuracy: 1 },
        //             teamId: 'a',
        //             moves: [
        //                 {
        //                     name: 'Copycat',
        //                     type: 'normal',
        //                     damage: 0,
        //                     effects: ['copy'],
        //                     target: 'single',
        //                     copy: false,
        //                     accuracy: 1.0,
        //                 },
        //             ],
        //         }),
        //     ],
        //     [
        //         new Combatant({
        //             name: 'Zephyr',
        //             stats: { health: 8500, damage: 18, defense: 10, speed: 50, accuracy: 1 },
        //             teamId: 'a',
        //             moves: [
        //                 {
        //                     name: 'Copycat',
        //                     type: 'normal',
        //                     damage: 0,
        //                     effects: ['copy'],
        //                     target: 'single',
        //                     copy: false,
        //                     accuracy: 1.0,
        //                 },
        //             ],
        //         }),
        //     ],
        // ]);

        const [teamA, teamB] = [
            [
                new Combatant({
                    name: 'Apple',
                    stats: { health: 100, damage: 18, defense: 4, speed: 50, accuracy: 1 },
                    teamId: 'a',
                    moves: [
                        {
                            name: 'punch',
                            type: 'normal',
                            damage: 10,
                            effects: [],
                            target: 'single',
                            copy: false,
                            accuracy: 1.0,
                        },
                    ],
                }),
            ],
            [
                new Combatant({
                    name: 'Banana',
                    stats: { health: 150, damage: 18, defense: 5, speed: 5, accuracy: 1 },
                    teamId: 'b',
                    moves: [
                        {
                            name: 'slam',
                            type: 'normal',
                            damage: 500,
                            effects: [],
                            target: 'single',
                            copy: false,
                            accuracy: 1.0,
                        },
                    ],
                }),
            ],
        ];

        let playBattle = true;

        const uponWinning = (winningTeam: 'a' | 'b') => {
            interactionA.followUp({
                content: `Team ${winningTeam.toUpperCase()} has won`,
            });
            console.log(winningTeam);
            playBattle = false;
        };

        const battleState = new BattleState(teamA, teamB);
        const battle = new Battle(battleState, uponWinning);

        while (playBattle) {
            await battle.processTurn(
                (queue) => {
                    console.log('the thingy is being run');
                    return this.getAllActions(queue, battleState, interactionA, interactionB);
                },
                async (message) => {
                    console.log(message);

                    await interactionA.followUp({
                        content: message,
                    });
                },
            );
        }

        console.log('battle finished');
    }
}

export default StartBattle;
