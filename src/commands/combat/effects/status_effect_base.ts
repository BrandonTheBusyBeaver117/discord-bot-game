import { Combatant } from '../combat_util';

export type EffectState =
    | 'startTurn'
    | 'endTurn'
    | 'beforeAction'
    | 'afterAction'
    | 'beforeMove'
    | 'afterMove'
    | 'beforeReceiveHit'
    | 'afterReceiveHit';

export interface StatusEffectConfig {
    name: string;
    user: Combatant;
    expiresOn: 'startTurn' | 'endTurn' | 'afterUses' | 'immediate' | 'manual';
    duration?: number;
}

export class StatusEffect {
    name: string;
    user: Combatant;
    expiresOn: 'startTurn' | 'endTurn' | 'afterUses' | 'immediate' | 'manual';
    duration: number;
    // appliedTurn: number;
    expired: boolean;

    constructor(config: StatusEffectConfig) {
        this.name = config.name;
        this.user = config.user;
        this.expiresOn = config.expiresOn;
        this.duration = config.duration ?? 0;

        this.onApply();

        if (this.expiresOn === 'immediate') {
            this.setExpired();
        }
    }

    // Any immediate effects or cleanup
    onApply(): void {}
    onExpire(): void {}

    // For all teams at turn start/end
    onTurnStart(): void {}
    onTurnEnd(): void {}

    // // Before actually selecting the move
    // // Mostly for skipturn
    // beforeAction(): void {}
    // afterAction(): void {}

    // Your actual attack
    // Ik it's a little confusing but whether to apply the move's effect
    // Before the actual hit itself, or after we've made the move
    beforeMove(): void {}
    afterMove(): void {}

    // Defense
    beforeReceiveHit(): void {}
    afterReceiveHit(): void {}

    // The effect will always run first before ticking
    // But if it's expired, it shall not run
    tick(phase: EffectState) {
        if (this.expired) return;

        switch (phase) {
            case 'startTurn':
                this.onTurnStart();
                break;
            case 'endTurn':
                this.onTurnEnd();
                break;
            case 'beforeMove':
                this.beforeMove();
                break;
            case 'afterMove':
                this.afterMove();
                break;
            case 'beforeReceiveHit':
                this.beforeReceiveHit();
                break;
            case 'afterReceiveHit':
                this.afterReceiveHit();
                break;
            default:
                console.log('what the heckky');
        }
        if (phase === this.expiresOn) {
            this.tickDuration();

            console.log(this.name + ' has ticked for' + this.user.name);
            console.log(phase);
            console.log(this.duration);
        }
    }

    tickDuration(): void {
        this.duration--;
        if (this.duration <= 0) {
            this.setExpired();
        }
    }

    setExpired(): void {
        console.log(this.name + 'has expired');
        this.expired = true;
        this.onExpire();
    }
}
