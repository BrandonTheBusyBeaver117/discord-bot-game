import { Combatant } from '../combat_util';
import { StatusEffect } from './status_effect_base';

export class Bleed extends StatusEffect {
    constructor(user: Combatant) {
        super({ user: user, name: 'bleed', expiresOn: 'endTurn', duration: 2 });
    }

    override beforeMove(): void {
        this.user.addFromBaseStat('health', -0.1);
    }
}
