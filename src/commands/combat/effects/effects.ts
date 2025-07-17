import { Combatant } from '../combat_util';
import { Accelerate } from './accelerate';
import { Bleed } from './bleed';
import { Buff } from './buff';
import { Burn } from './burn';
import { Confuse } from './confuse';
import { Copy } from './copy';
import { Critical } from './critical';
import { Fortify } from './fortify';
import { Immune } from './immune';
import { Luck } from './luck';
import { Regenerate } from './regenerate';
import { Slow } from './slow';
import { StatusEffect } from './status_effect_base';
import { Stun } from './stun';
import { Weaken } from './weaken';

export const StatusEffectClassMap: Record<
    string,
    (user: Combatant, opponent: Combatant) => StatusEffect
> = {
    regenerate: (user) => new Regenerate(user),
    bleed: (opponent) => new Bleed(opponent),
    burn: (opponent) => new Burn(opponent),
    fortify: (user) => new Fortify(user),
    critical: (user) => new Critical(user),
    luck: (user) => new Luck(user),
    accel: (user) => new Accelerate(user),
    buff: (user) => new Buff(user),
    immune: (user) => new Immune(user),
    copy: (user) => new Copy(user),
    stun: (opponent) => new Stun(opponent),
    slow: (opponent) => new Slow(opponent),
    weaken: (opponent) => new Weaken(opponent),
    confuse: (opponent) => new Confuse(opponent),
};
