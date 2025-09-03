import { Combatant } from '../combat_util';
import { StatusEffect } from './status_effect_base';

export class Confuse extends StatusEffect {
    constructor(user: Combatant) {
        super({ user: user, name: 'confuse', expiresOn: 'endTurn', duration: 1 });
    }

    override beforeMove(): void {
        this.user.addFromBaseStat('accuracy', -0.33);
    }
}
