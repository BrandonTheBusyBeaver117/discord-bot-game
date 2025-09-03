import { Combatant } from '../combat_util';
import { StatusEffect } from './status_effect_base';

export class Fortify extends StatusEffect {
    constructor(user: Combatant) {
        super({ user: user, name: 'fortify', expiresOn: 'endTurn', duration: 2 });
    }

    override onApply(): void {
        this.user.addFromBaseStat('defense', 0.05);
    }

    override onTurnStart(): void {
        this.user.addFromBaseStat('defense', 0.05);
    }
}
