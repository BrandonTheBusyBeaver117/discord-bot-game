import { stringify } from 'querystring';
import { supabase } from '../..';
import { getEffect } from './effects/effects';
import { StatusEffect } from './effects/status_effect_base';

export interface CombatantAction {
    uuid: string;
    move: Move;
    target: Combatant;
}

export interface Stats {
    health: number;
    speed: number;
    damage: number;
    accuracy: number;
    defense: number;
}

export interface Move {
    name: string;
    type: string;
    damage: number;
    effects: string[];
    target: 'global' | 'consecutive' | 'single';

    copy: boolean;
    accuracy: number;
}

const effectType = {
    buff: new Set(['fortify', 'critical', 'luck', 'accel', 'buff', 'immune', 'copy']),
    debuff: new Set(['bleed', 'shock', 'slow', 'weaken', 'confuse', 'burn', 'stun']),
    health: new Set(['regenerate', 'bleed', 'shock', 'burn']),
};

interface CombatantConfig {
    name: string;
    stats: Stats;
    statusEffects?: StatusEffect[];
    flags?: Flags;
    teamId: string;
    moves: Move[];
}

export class Combatant {
    name: string;
    baseStats: Stats;
    currentStats: Stats;
    statusEffects: StatusEffect[];
    flags: Flags;
    teamId: string;
    moves: Move[];
    uuid: string;

    public constructor(config: CombatantConfig) {
        this.name = config.name;
        this.baseStats = config.stats;
        this.currentStats = config.stats;
        this.statusEffects = config.statusEffects ?? [];
        this.flags = config.flags ?? {};
        this.teamId = config.teamId;
        this.moves = config.moves;

        // Kinda cursed but works
        // The unique identifier is just name + teamid
        // IF it alr exists that's a big no no, but we should check for duplicates outside this
        this.uuid = this.name + this.teamId;
    }

    isAlive(): boolean {
        return this.currentStats.health > 0;
    }

    canAct(): boolean {
        // To be active, your turn is not skipped
        // AND you are alive
        return !this.flags.skipTurn && this.isAlive();
    }

    forceSetStat(stat: keyof Stats, newStat: number) {
        this.currentStats[stat] = newStat;
    }

    setStat(stat: keyof Stats, newStat: number) {
        if (!this.modificationAllowed(stat, newStat)) return;

        this.currentStats[stat] = newStat;
    }

    addToStat(stat: keyof Stats, val: number) {
        if (!this.modificationAllowed(stat, val)) return;

        this.currentStats[stat] += val;
    }

    addFromBaseStat(stat: keyof Stats, percentage: number) {
        if (!this.modificationAllowed(stat, percentage)) return;

        this.currentStats[stat] += this.baseStats[stat] * percentage;
    }

    modificationAllowed(stat: keyof Stats, value: number): boolean {
        // So if it's immune, and trying to decrease a stat that's not health
        // we skip
        if (this.flags.isImmune && stat !== 'health' && value < 0) {
            return false;
        }

        return true;
    }

    endOfTurn() {
        this.currentStats = {
            ...this.baseStats,
            health: this.currentStats.health,
        };

        this.statusEffects = this.statusEffects.filter((effect) => !effect.expired);
    }
}

export class Spirit extends Combatant {
    public constructor(config: CombatantConfig) {
        super(config);
    }

    override endOfTurn(): void {
        // Basically this should work as long as we always modify using the set stat methods
        // because overriden methods should always check if modification is allowed
        super.endOfTurn();
        this.forceSetStat('health', this.currentStats.health - 1);
    }

    override modificationAllowed(stat: keyof Stats, value: number): boolean {
        // Essentially no one should be modifying the health of a sprit but us
        if (stat === 'health') {
            return false;
        }

        // then we just check the regular conditions of immune and stuff
        return super.modificationAllowed(stat, value);
    }
}
// For temporary effects like "Immune Next Turn", "Summoned"
export interface Flags {
    isImmune?: boolean;
    skipTurn?: boolean;
    summonedBy?: string; // for Curse summon
    canCopy?: boolean;
}

export class BattleState {
    phases: ['start_turn', 'action'];
    turn: number;
    teams: {
        a: Combatant[];
        b: Combatant[];
    };
    allCombatants: Combatant[];
    log: string[];

    constructor(teamA: Combatant[], teamB: Combatant[]) {
        this.allCombatants = [...teamA, ...teamB];
        this.teams = {
            a: [...teamA],
            b: [...teamB],
        };

        this.turn = 0;
    }
}

export function applyStatusEffect(
    effect: string,
    user: Combatant,
    opponent: Combatant,
    battleState: BattleState,
): void {
    effect = effect.toLowerCase();

    if (effect == 'summon') {
        battleState.teams[user.teamId].push(
            new Spirit({
                name: 'cursed summon',

                stats: { ...user.baseStats, health: 3, damage: 0.2 * user.baseStats.damage },

                statusEffects: [], // effects currently applied
                flags: {
                    isImmune: true,
                    summonedBy: user.name,
                },
                moves: [
                    {
                        name: 'haunt',
                        type: 'ghost',
                        damage: 1,
                        copy: false,
                        accuracy: 1,
                        effects: [],
                        target: 'single',
                    },
                ],

                teamId: user.teamId,
            }),
        );
        return;
    }

    user.statusEffects.push(getEffect(effect.toLowerCase(), user, opponent));
}

function buildTurnQueue(combatants: Combatant[]) {
    return combatants
        .filter((combatant) => combatant.canAct())
        .sort((a, b) => b.currentStats.speed - a.currentStats.speed);
}

type PossibleWinners = 'draw' | 'a' | 'b';
export class Battle {
    battleState: BattleState;
    uponWinning: (winningTeam: string) => any;

    constructor(state: BattleState, uponWinning: (winningTeam: string) => any) {
        this.battleState = state;
        this.uponWinning = uponWinning;
    }

    async processTurn(
        infoSupplier: (combatants: Combatant[]) => Promise<Map<string, CombatantAction>>,
    ) {
        // Turn Starts
        // Resetting active combatants

        this.battleState.allCombatants.forEach((combatant) => {
            // Tick all start turn effects
            combatant.statusEffects.forEach((effect) => effect.tick('startTurn'));
        });

        console.log('tick start');

        let queue: Combatant[] = buildTurnQueue(this.battleState.allCombatants);

        // ========================================================
        // Select Moves

        const decisionMap = await infoSupplier(queue);
        // const moveMap: Map<string, Move> = await moveMapSupplier(queue);
        // const opponentMap: Map<string, Combatant> = await opponentMapSupplier(queue);

        // ========================================================
        // Execute Moves

        console.log('execution');
        while (queue.length > 0) {
            // Finds the fastest combatant
            const combatant = queue[0];

            combatant.statusEffects.forEach((effect) => effect.tick('beforeMove'));

            const decision = decisionMap.get(combatant.uuid);

            executeMove(decision.move, combatant, decision.target, this.battleState);

            combatant.statusEffects.forEach((effect) => effect.tick('afterMove'));

            // The only downside of this approach is that if you are taken out of the queue
            // You cannot be put back in
            // idk, we can cross the bridge of cleansing stuns or revivals later
            queue.shift();

            queue = buildTurnQueue(queue);
            console.log('updated quque');
            console.log(queue.map((combatant) => combatant.uuid));
        }

        // ========================================================
        // End of turn

        // Apply end-of-turn effects
        this.battleState.allCombatants.forEach((combatant) => {
            combatant.statusEffects.forEach((effect) => effect.tick('endTurn'));

            combatant.endOfTurn();
        });

        console.log('Team a:');
        this.battleState.teams.a.forEach((combatant) => {
            console.log(`${combatant.name} health: ${combatant.currentStats.health}`);
        });

        console.log('\nTeam b:');
        this.battleState.teams.b.forEach((combatant) => {
            console.log(`${combatant.name} health: ${combatant.currentStats.health}`);
        });

        const winningTeam = this.checkWinningTeam();
        if (winningTeam) {
            this.uponWinning(winningTeam);
        }
    }

    checkWinningTeam(): PossibleWinners | false {
        let teamAAlive = false;
        let teamBAlive = false;
        this.battleState.teams.a.forEach(
            (combatant) =>
                // will only flip true if combatant is alive
                (teamAAlive = teamAAlive || combatant.isAlive()),
        );

        this.battleState.teams.b.forEach(
            (combatant) =>
                // will only flip true if combatant is alive
                (teamBAlive = teamBAlive || combatant.isAlive()),
        );

        // So at the end, if alive is false, then no one would have been alive, and we have a winner

        // If both dead, we draw
        if (teamAAlive == false && teamBAlive == false) {
            return 'draw';
        }

        if (teamAAlive == false) {
            return 'b';
        }

        if (teamBAlive == false) {
            return 'a';
        }

        // If all those failed, none must be dead

        return false;
    }

    getMoves() {}
}

function executeMove(move: Move, user: Combatant, opponent: Combatant, battleState: BattleState) {
    // this is kinda scuffed ngl

    switch (move.target) {
        case 'global':
            battleState.teams[opponent.teamId].forEach((opponent) => {
                executeMove({ ...move, target: 'single' }, user, opponent, battleState);
            });

            break;

        case 'consecutive':
            for (let i = 0; i < 4; i++) {
                // every iteration, the accuracy decreases by 20%
                const decreasingAccuracy = 1 - i * 0.2;

                executeMove(
                    { ...move, target: 'single', accuracy: decreasingAccuracy },
                    user,
                    opponent,
                    battleState,
                );
            }
            break;

        case 'single':
            if (Math.random() > move.accuracy * user.currentStats.accuracy) {
                console.log(`${user.name} missed!`);
                return;
            }

            for (const effect of move.effects) {
                applyStatusEffect(effect, user, opponent, battleState);
            }

            console.log(
                user.name +
                    ' uses ' +
                    move.name +
                    ' on ' +
                    opponent.name +
                    ' it does ' +
                    move.damage +
                    'damage',
            );

            opponent.addToStat('health', -move.damage);

            if (opponent.name == 'Zephyr') {
                console.log(opponent.flags.canCopy);
                console.log(opponent.canAct());
                console.log(move.copy === false);
            }

            // If the opponent can act, can copy, and the current move isn't a copy, then copy
            // imo this should be counter but wtv
            if (opponent.canAct() && opponent.flags.canCopy && move.copy === false) {
                executeMove({ ...move, copy: true }, opponent, user, battleState);
            }
            break;
        default:
            console.log('what the');
    }
}
