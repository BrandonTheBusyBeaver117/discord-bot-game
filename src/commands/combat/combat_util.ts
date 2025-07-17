import { supabase } from '../..';
import { StatusEffectClassMap } from './effects/effects';
import { StatusEffect } from './effects/status_effect_base';

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
}

export class Combatant {
    name: string;
    baseStats: Stats;
    currentStats: Stats;
    statusEffects: StatusEffect[];
    flags: Flags;
    teamId: string;

    public constructor(config: CombatantConfig) {
        this.name = config.name;
        this.baseStats = config.stats;
        this.currentStats = config.stats;
        this.statusEffects = config.statusEffects ?? [];
        this.flags = config.flags ?? {};
        this.teamId = config.teamId;
    }

    isAlive(): boolean {
        return this.currentStats.health > 0;
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

    endOfTurn() {}
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
    activeCombatants: Combatant[];
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

                teamId: user.teamId,
            }),
        );
        return;
    }

    const statusEffectGenerator = StatusEffectClassMap[effect.toLowerCase()];

    user.statusEffects.push(statusEffectGenerator(user, opponent));
}
function processTurn(battleState: BattleState, move: Move) {
    // Turn Starts
    // Resetting active combatants
    battleState.activeCombatants = [];

    battleState.allCombatants.forEach((combatant) => {
        // Tick all start turn effects
        combatant.statusEffects.forEach((effect) => effect.tick('startTurn'));

        // If alive and turn is not skipped, you are an active combatant
        if (!combatant.flags.skipTurn && combatant.isAlive()) {
            battleState.activeCombatants.push(combatant);
        }
    });

    // Puts largest speed stat first
    battleState.activeCombatants.sort((a, b) => b.currentStats.speed - a.currentStats.speed);

    // ========================================================
    // Choose Moves

    battleState.allCombatants.forEach((combatant) => {
        // Tick all before action effects
        combatant.statusEffects.forEach((effect) => effect.tick('beforeAction'));
    });

    // Now we get moves or wtv
    // const moves = Move

    // ========================================================
    // Execute Moves

    battleState.activeCombatants.forEach((combatant) => {
        // // Choose move (manual or AI/autoplay)
        // const chosenMove = chooseMove(combatant);

        combatant.statusEffects.forEach((effect) => effect.tick('beforeMove'));

        // // Execute move
        // executeMove(chosenMove, combatant, target, battleState);

        combatant.statusEffects.forEach((effect) => effect.tick('afterMove'));
    });

    // ========================================================
    // End of turn

    // Apply end-of-turn effects
    battleState.allCombatants.forEach((combatant) => {
        combatant.statusEffects.forEach((effect) => effect.tick('endTurn'));
    });
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

        case 'single':
            for (const effect of move.effects) {
                applyStatusEffect(effect, user, opponent, battleState);
            }

            if (Math.random() > move.accuracy * user.currentStats.accuracy) {
                console.log(`${user.name} missed!`);

                opponent.addToStat('health', -move.damage);

                // If the opponent can copy, and the current move isn't a copy, then copy
                // imo this should be counter but wtv
                if (opponent.flags.canCopy && move.copy === false) {
                    executeMove({ ...move, copy: true }, opponent, user, battleState);
                }
                return;
            }

        default:
            console.log('what the');
    }
}
