import { Combatant } from '../combat_util';
import { StatusEffect } from './status_effect_base';

export class Critical extends StatusEffect {
    constructor(user: Combatant) {
        super({ user: user, name: 'buff', expiresOn: 'immediate' });
    }

    override onApply(): void {
        this.user.addFromBaseStat('damage', 0.2);
    }
}
