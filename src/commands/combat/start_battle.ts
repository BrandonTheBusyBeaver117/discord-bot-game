import { ActionRowBuilder, ButtonBuilder, SlashCommandBuilder } from '@discordjs/builders';
import { ButtonStyle, Client, CommandInteraction, EmbedBuilder } from 'discord.js';

import CombatBase from './combat_base';
import { Battle, BattleState, Combatant, Move } from './combat_util';

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

        const message = await interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setTitle(interaction.user.username + ' challenges you to a battle!')
                    .setDescription('Do you accept?'),
                // .setImage(`https://res.cloudinary.com/anicardimages/image/upload/images/${card.id}`)
            ],
            components: [row],
        });

        const startCollector = () => {
            let oppUUID: string;

            const collector = message.createMessageComponentCollector({
                time: 60_000, // 60 s from creation
            });

            collector.on('collect', async (collectorInteraction) => {
                if (collectorInteraction.customId === 'accept') {
                    oppUUID = collectorInteraction.user.id;
                }

                // kill collector
                collector.stop();
            });

            collector.on('end', () => {
                declineButton.setDisabled(true);
                acceptButton.setDisabled(true);
                // Sets the row to be disabled
                message.edit({ components: [row] }).catch(() => {});

                if (oppUUID) {
                    this.startBattle(interaction.user.id, oppUUID);
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

    private async getUserMoves(
        userUUID: string,
        combatants: Combatant[],
    ): Promise<[string, Move][]> {
        const moveList = [];

        for (const combatant of combatants) {
            const moveOptions = combatant.moves;

            let message = `Choose a move for **${combatant.name}**:\n`;
            for (let i = 0; i < moveOptions.length; i++) {
                message += `${i}: ${moveOptions[i].name}`;
            }

            // send msg to user

            moveList.push([combatant.uuid, moveList[0]]);
        }

        return moveList;
    }

    private async getUserOpponents(
        userUUID: string,
        userCombatants: Combatant[],
        opponentCombatants: Combatant[],
    ): Promise<[string, Combatant][]> {
        // technically not necessary since we should have alr filtered them...
        const validTargets = opponentCombatants.filter((combatant) => combatant.isAlive());

        const targetList = [];

        for (const combatant of userCombatants) {
            let message = `Choose a target for **${combatant.name}**:\n`;
            for (let i = 0; i < validTargets.length; i++) {
                message += `${i}: ${validTargets[i].name}`;
            }

            // send msg to user

            targetList.push([combatant.uuid, targetList[0]]);
        }

        return targetList;
    }

    private async getAllMoves(
        queue: Combatant[],
        uuidA: string,
        uuidB: string,
    ): Promise<Map<string, Move>> {
        const moveMap = new Map<string, Move>();

        const [moveListA, moveListB] = await Promise.all([
            this.getUserMoves(
                uuidA,
                queue.filter((combatant) => combatant.teamId === 'a'),
            ),
            this.getUserMoves(
                uuidB,
                queue.filter((combatant) => combatant.teamId === 'b'),
            ),
        ]);

        moveListA.forEach(([uuid, move]) => moveMap.set(uuid, move));
        moveListB.forEach(([uuid, move]) => moveMap.set(uuid, move));

        return moveMap;
    }

    private async getAllTargets(
        queue: Combatant[],
        battleState: BattleState,
        uuidA: string,
        uuidB: string,
    ): Promise<Map<string, Combatant>> {
        const targetMap = new Map<string, Combatant>();

        const [targetListA, targetListB] = await Promise.all([
            this.getUserOpponents(
                uuidA,
                queue.filter((combatant) => combatant.teamId === 'a'),
                battleState.teams.b.filter((combatant) => combatant.isAlive()),
            ),
            this.getUserOpponents(
                uuidB,
                queue.filter((combatant) => combatant.teamId === 'b'),
                battleState.teams.a.filter((combatant) => combatant.isAlive()),
            ),
        ]);

        targetListA.forEach(([uuid, target]) => targetMap.set(uuid, target));
        targetListB.forEach(([uuid, target]) => targetMap.set(uuid, target));

        return targetMap;
    }

    private async startBattle(uuidA: string, uuidB: string) {
        // send ephemeral message to A and B for characters

        // idk how i should go about this
        // but essentially i should try to call both a and b at the same time
        // only when i get both results, i create battlestate

        // const teamA = await this.getInitialCharacters(uuidA);
        // const teamB = await this.getInitialCharacters(uuidB);

        const [teamA, teamB] = await Promise.all([
            this.getInitialCharacters(uuidA),
            this.getInitialCharacters(uuidB),
        ]);

        let playBattle = true;

        const uponWinning = (winningTeam: 'a' | 'b') => {
            console.log(winningTeam);
            playBattle = false;
        };

        const battleState = new BattleState(teamA, teamB);
        const battle = new Battle(battleState, uponWinning);

        while (playBattle) {
            battle.processTurn(
                (queue) => this.getAllMoves(queue, uuidA, uuidB),
                (queue) => this.getAllTargets(queue, battleState, uuidA, uuidB),
            );
        }
    }
}

export default StartBattle;
