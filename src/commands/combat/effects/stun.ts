import { Combatant } from '../combat_util';
import { StatusEffect } from './status_effect_base';

export class Stun extends StatusEffect {
    constructor(user: Combatant) {
        super({ user: user, name: 'stun', expiresOn: 'manual' });
    }

    override beforeAction(): void {
        this.user.flags.skipTurn = true;
    }

    override onTurnStart(): void {
        this.user.flags.skipTurn = true;
    }

    override onTurnEnd(): void {
        if (this.user.flags.skipTurn) {
            this.user.flags.skipTurn = false;
            this.setExpired();
        }
    }
}
