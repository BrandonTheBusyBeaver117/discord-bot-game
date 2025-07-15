import { Combatant } from '../combat_util';
import { StatusEffect } from './status_effect_base';

export class Slow extends StatusEffect {
    constructor(user: Combatant) {
        super({ user: user, name: 'weaken', expiresOn: 'afterUses', duration: 1 });
    }

    override beforeMove(): void {
        this.user.addFromBaseStat('damage', -0.2);
    }
}
