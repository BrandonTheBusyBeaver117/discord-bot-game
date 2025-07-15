import { Combatant } from '../combat_util';
import { StatusEffect } from './status_effect_base';

export class Accelerate extends StatusEffect {
    constructor(user: Combatant) {
        super({ user: user, name: 'accel', expiresOn: 'startTurn', duration: 1 });
    }

    override onTurnStart(): void {
        this.user.addFromBaseStat('speed', 0.2);
    }
}
