import { Combatant } from '../combat_util';
import { StatusEffect } from './status_effect_base';

export class Regenerate extends StatusEffect {
    constructor(user: Combatant) {
        super({ user: user, name: 'regenerate', expiresOn: 'immediate' });
    }

    override onApply(): void {
        this.user.addFromBaseStat('health', 0.3);
    }
}
