import { Combatant } from '../combat_util';
import { StatusEffect } from './status_effect_base';

export class Critical extends StatusEffect {
    constructor(user: Combatant) {
        super({ user: user, name: 'copy', expiresOn: 'endTurn', duration: 1 });
    }

    override onApply(): void {
        this.user.flags.canCopy = true;
    }

    override onExpire(): void {
        this.user.flags.canCopy = false;
    }
}
