import { Combatant } from '../combat_util';
import { StatusEffect } from './status_effect_base';

export class Slow extends StatusEffect {
    constructor(user: Combatant) {
        super({ user: user, name: 'slow', expiresOn: 'startTurn', duration: 1 });
    }

    override onTurnStart(): void {
        this.user.addFromBaseStat('speed', -0.2);
    }
}
