import { supabase } from '../..';

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
    statusEffects?: StatusEffectInstance[];
    flags?: Flags;
    teamId: string;
}

export class Combatant {
    name: string;
    baseStats: Stats;
    currentStats: Stats;
    statusEffects: StatusEffectInstance[];
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

// For status conditions like Burn, Bleed, Confuse, etc.

export class StatusEffect {
    name: string;
    user: Combatant;
    expiresOn: 'startTurn' | 'endTurn' | 'afterUses' | 'immediate';
    duration: number;
    appliedTurn: number;
    expired: boolean;

    // Lifecycle hooks
    onApply?: () => void;
    onExpire?: () => void;

    onTurnStart?: () => void;
    onTurnEnd?: () => void;

    beforeAction?: () => void;
    afterAction?: () => void;

    beforeMove?: () => void;
    afterMove?: () => void;

    beforeReceiveHit?: () => void;
    afterReceiveHit?: () => void;

    constructor(config: StatusEffectConfig, user: Combatant) {
        this.name = config.name;
        this.expiresOn = config.expiresOn;
        this.duration = config.duration ?? 0;
        this.appliedTurn = config.appliedTurn ?? 0;
        this.user = user;

        // Assign all optional hooks if present
        this.onApply = () => config.onApply(user, forceExpire);
        this.onExpire = config.onExpire;

        this.onTurnStart = config.onTurnStart;
        this.onTurnEnd = config.onTurnEnd;

        this.beforeAction = config.beforeAction;
        this.afterAction = config.afterAction;

        this.beforeMove = config.beforeMove;
        this.afterMove = config.afterMove;

        this.beforeReceiveHit = config.beforeReceiveHit;
        this.afterReceiveHit = config.afterReceiveHit;
    }

    tick(): void {
        if (this.duration <= 0) {
            this.expired = true;
        }

        if (this.expired) {
            this.onExpire(this.user);
        }
    }

    forceExpire(): void {
        this.expired = true;
    }
}
export interface StatusEffectConfig {
    name: string; // e.g. "Burn"
    expiresOn: 'startTurn' | 'endTurn' | 'afterUses' | 'immediate';
    duration?: number;
    appliedTurn?: number;

    // Any immediate effects or cleanup
    onApply?(user: Combatant, forceExpire: () => void): void;
    onExpire?(user: Combatant): void;

    // For all teams at turn start/end
    onTurnStart?(user: Combatant, forceExpire: () => void): void;
    onTurnEnd?(user: Combatant, forceExpire: () => void): void;

    // Before actually selecting the move
    // Mostly for skipturn
    beforeAction?(user: Combatant, forceExpire: () => void): void;
    afterAction?(user: Combatant, forceExpire: () => void): void;

    // Your actual attack
    // Ik it's a little confusing but whether to apply the move's effect
    // Before the actual hit itself, or after we've made the move
    beforeMove?(user: Combatant, forceExpire: () => void): void;
    afterMove?(user: Combatant, forceExpire: () => void): void;

    // Defense
    beforeReceiveHit?(user: Combatant, forceExpire: () => void): void;
    afterReceiveHit?(user: Combatant, forceExpire: () => void): void;

    tick(): void;
}

export interface BattleState {
    turn: number;
    teams: {
        [teamId: string]: Combatant[];
    };
    activeCombatants: Combatant[];
    log: string[];
}

// This should be from the perspective that YOU have this effect
export function processEffect(effect: string, user: Combatant): void {
    switch (effect.toLowerCase()) {
        // health
        case 'regenerate':
            user.addFromBaseStat('health', 0.3);
            break;
        case 'bleed':
        case 'shock':
            user.addFromBaseStat('health', -0.1);
            break;
        case 'burn':
            user.addFromBaseStat('health', -0.3);

            break;
        case 'fortify':
            // blocks 5% of damage
            user.addFromBaseStat('defense', 0.05);
            break;

        // buffs
        case 'critical':
            // 250% of normal damage
            user.addFromBaseStat('damage', 1.5);
            break;

        case 'luck':
            user.addFromBaseStat('accuracy', 0.5);
            break;

        case 'accel':
            user.addFromBaseStat('speed', 0.2);
            break;

        case 'buff':
            user.addFromBaseStat('damage', 0.2);
            break;

        case 'immune':
            user.flags.isImmune = true;
            break;
        case 'copy':
            user.flags.canCopy = true;
            break;
        // debuffs

        case 'slow':
            user.addFromBaseStat('speed', -0.2);
            break;

        case 'weaken':
            user.addFromBaseStat('damage', -0.2);
            break;

        case 'confuse':
            user.addFromBaseStat('accuracy', -0.33);
            break;

        case 'stun':
            user.flags.skipTurn = true;

        default:
    }
}

export function applyStatusEffect(
    effect: string,
    user: Combatant,
    opponent: Combatant,
    battleState: BattleState,
): void {
    switch (effect.toLowerCase()) {
        case 'bleed':
        case 'shock':
        case 'burn':
            opponent.statusEffects.push({
                name: effect,
                duration: 2,
                expiresOn: 'endTurn',
            });
            break;
        case 'summon':
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
            break;

        case 'regenerate':
            user.statusEffects.push({
                name: effect,
                expiresOn: 'immediate',
                onApply: (combatant) => combatant.addFromBaseStat('health', 0.3),
            });

            break;
        case 'fortify':
            user.statusEffects.push({
                name: effect,
                duration: 2,
                expiresOn: 'endTurn',
                onApply: (combatant) => combatant.addFromBaseStat('defense', 0.3),
            });
        case 'critical':
            user.statusEffects.push({
                name: effect,
                duration: 1,
                expiresOn: 'immediate',
                onApply: (combatant) => combatant.addFromBaseStat('damage', 1.5),
            });
            break;
        case 'luck':
            user.statusEffects.push({
                name: effect,
                duration: 1,
                expiresOn: 'immediate',
                onApply: (combatant) => combatant.addFromBaseStat('accuracy', 0.5),
            });
            break;
        case 'accel':
            user.statusEffects.push({
                name: effect,
                duration: 1,
                expiresOn: 'startTurn',

                beforeAction: (combatant) => combatant.addFromBaseStat('speed', 0.2),
            });
            break;
        case 'buff':
            user.statusEffects.push({
                name: effect,
                expiresOn: 'immediate',
                onApply: (combatant) => combatant.addFromBaseStat('damage', 0.2),
            });
            break;
        case 'immune':
            user.statusEffects.push({
                name: effect,
                duration: 1,
                expiresOn: 'afterUses',
                onApply: (combatant) => (combatant.flags.isImmune = true),
                onExpire: (combatant) => (combatant.flags.isImmune = false),
            });
            break;
        case 'copy':
            user.statusEffects.push({
                name: effect,
                duration: 1,
                expiresOn: 'endTurn',
            });
            break;

        case 'stun':
            opponent.statusEffects.push({
                name: effect,
                expiresOn: 'afterUses',
                duration: 1,

                beforeAction: (combatant) => (combatant.flags.skipTurn = true),
                afterAction: (combatant) => (combatant.flags.skipTurn = false),
            });
            break;
        case 'slow':
            opponent.statusEffects.push({
                name: effect,
                duration: 1,
                expiresOn: 'turn',
            });
            break;
        case 'weaken':
            opponent.statusEffects.push({
                name: effect,
                duration: 1,
                expiresOn: 'turn',
            });
            break;
        case 'confuse':
            opponent.statusEffects.push({
                name: effect,
                duration: 1,
                expiresOn: 'turn',
            });
            break;
        default:
    }
}
function processTurn(battleState: BattleState, move: Move) {
    // So far nothing is uh start of turn so just leaving this here
    // // Apply start-of-turn effects (e.g., burn, regen)
    // applyStatusEffects(combatant, 'start');

    Object.values(battleState.teams).forEach((combatantArray) => {
        // will filter out combatants that are meant to skip this turn
        // Or also dead lmao
        const filteredCombatants = combatantArray.filter(
            (combatant) => !combatant.flags.skipTurn || combatant.isAlive(),
        );

        battleState.activeCombatants.push(...filteredCombatants);
    });

    // Puts largest speed stat first
    battleState.activeCombatants.sort((a, b) => b.currentStats.speed - a.currentStats.speed);

    battleState.activeCombatants.forEach((combatant) => {
        // // Choose move (manual or AI/autoplay)
        // const chosenMove = chooseMove(combatant);
        // // Execute move
        // executeMove(chosenMove, combatant, target, battleState);
    });

    // Apply end-of-turn effects
    battleState.activeCombatants.forEach((combatant) => {
        // Cause like, these should all be end of turn...
        combatant.statusEffects.forEach((statusEffect) => {
            processEffect(statusEffect.name, combatant);
            statusEffect.duration -= 1;
        });

        // Get rid of effects that have 0 or less turns remaining
        combatant.statusEffects = combatant.statusEffects.filter(
            (statusEffect) => !(statusEffect.duration <= 0),
        );
    });

    // Update status effect durations
    // updateStatusDurations(combatant);
}

function executeMove(move: Move, user: Combatant, opponent: Combatant, battleState: BattleState) {
    // this is kinda scuffed ngl

    switch (move.target) {
        case 'global':
            battleState.teams[opponent.teamId].forEach((enemy) => {
                executeMove({ ...move, target: 'single' }, user, enemy, battleState);
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
