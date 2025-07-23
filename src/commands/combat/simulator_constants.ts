import { Combatant, Move } from './combat_util';

const move_pool: Move[] = [
    {
        name: 'Quick Slice',
        type: 'normal',
        damage: 25,
        effects: [],
        target: 'single',
        copy: false,
        accuracy: 1.0,
    },
    {
        name: 'Bash',
        type: 'earth',
        damage: 35,
        effects: ['stun'],
        target: 'single',
        copy: false,
        accuracy: 0.85,
    },
    {
        name: 'Copycat',
        type: 'normal',
        damage: 0,
        effects: ['copy'],
        target: 'single',
        copy: false,
        accuracy: 1.0,
    },
    {
        name: 'Blaze burn',
        type: 'fire',
        damage: 45,
        effects: ['burn'],
        target: 'global',
        copy: false,
        accuracy: 0.75,
    },
    {
        name: 'K.O. Shot',
        type: 'pierce',
        damage: 30,
        effects: ['luck'],
        target: 'single',
        copy: true,
        accuracy: 0.9,
    },
    {
        name: 'Wind Step',
        type: 'wind',
        damage: 0,
        effects: ['accelerate'],
        target: 'single',
        copy: false,
        accuracy: 1.0,
    },
    {
        name: 'Soul Drain',
        type: 'dark',
        damage: 20,
        effects: ['weaken'],
        target: 'single',
        copy: false,
        accuracy: 0.85,
    },
    {
        name: 'Heal Pulse',
        type: 'light',
        damage: 0,
        effects: ['heal'],
        target: 'single',
        copy: true,
        accuracy: 1.0,
    },
    {
        name: 'Normal consecutive punches',
        type: 'normal',
        damage: 20,
        effects: [],
        target: 'consecutive',
        copy: false,
        accuracy: 0.95,
    },
    {
        name: 'Critical Strike',
        type: 'mystic',
        damage: 15,
        effects: ['critical'],
        target: 'single',
        copy: false,
        accuracy: 1.0,
    },
];

export const combatants: Combatant[] = [
    new Combatant({
        name: 'Aeris',
        stats: { health: 100, damage: 25, defense: 15, speed: 30, accuracy: 1 },
        teamId: 'a',
        moves: [
            { ...move_pool[0] }, // Quick Slice
            { ...move_pool[5] }, // Wind Step
            { ...move_pool[9] }, // Critical Strike
            { ...move_pool[8] }, // Normal punches
        ],
    }),
    new Combatant({
        name: 'Brutus',
        stats: { health: 130, damage: 35, defense: 25, speed: 20, accuracy: 0.9 },
        teamId: 'b',
        moves: [
            { ...move_pool[1] }, // Bash
            { ...move_pool[3] }, // Blaze Burn
            { ...move_pool[4] }, // K.O. Shot
            { ...move_pool[6] }, // Soul Drain
        ],
    }),
    new Combatant({
        name: 'Luma',
        stats: { health: 80, damage: 20, defense: 10, speed: 40, accuracy: 1 },
        teamId: 'a',
        moves: [
            { ...move_pool[2] }, // Copycat
            { ...move_pool[5] }, // Wind Step
            { ...move_pool[7] }, // Heal Pulse
            { ...move_pool[8] }, // Normal punches
        ],
    }),
    new Combatant({
        name: 'Gronk',
        stats: { health: 160, damage: 28, defense: 30, speed: 10, accuracy: 1 },
        teamId: 'b',
        moves: [
            { ...move_pool[1] }, // Bash
            { ...move_pool[4] }, // K.O. Shot
            { ...move_pool[6] }, // Soul Drain
            { ...move_pool[9] }, // Critical Strike
        ],
    }),
    new Combatant({
        name: 'Nova',
        stats: { health: 90, damage: 22, defense: 15, speed: 35, accuracy: 1 },
        teamId: 'a',
        moves: [
            { ...move_pool[0] }, // Quick Slice
            { ...move_pool[2] }, // Copycat
            { ...move_pool[5] }, // Wind Step
            { ...move_pool[9] }, // Critical Strike
        ],
    }),
    new Combatant({
        name: 'Ember',
        stats: { health: 95, damage: 30, defense: 10, speed: 25, accuracy: 1 },
        teamId: 'b',
        moves: [
            { ...move_pool[3] }, // Blaze Burn
            { ...move_pool[4] }, // K.O. Shot
            { ...move_pool[6] }, // Soul Drain
            { ...move_pool[8] }, // Normal punches
        ],
    }),
    new Combatant({
        name: 'Vesper',
        stats: { health: 75, damage: 20, defense: 12, speed: 45, accuracy: 1 },
        teamId: 'a',
        moves: [
            { ...move_pool[2] }, // Copycat
            { ...move_pool[5] }, // Wind Step
            { ...move_pool[7] }, // Heal Pulse
            { ...move_pool[0] }, // Quick Slice
        ],
    }),
    new Combatant({
        name: 'Titan',
        stats: { health: 150, damage: 40, defense: 20, speed: 15, accuracy: 0.9 },
        teamId: 'b',
        moves: [
            { ...move_pool[1] }, // Bash
            { ...move_pool[3] }, // Blaze Burn
            { ...move_pool[6] }, // Soul Drain
            { ...move_pool[9] }, // Critical Strike
        ],
    }),
    new Combatant({
        name: 'Zephyr',
        stats: { health: 85, damage: 18, defense: 10, speed: 50, accuracy: 1 },
        teamId: 'a',
        moves: [
            { ...move_pool[0] }, // Quick Slice
            { ...move_pool[5] }, // Wind Step
            { ...move_pool[7] }, // Heal Pulse
            { ...move_pool[2] }, // Copycat
        ],
    }),
    new Combatant({
        name: 'Shade',
        stats: { health: 110, damage: 27, defense: 17, speed: 28, accuracy: 1 },
        teamId: 'b',
        moves: [
            { ...move_pool[4] }, // K.O. Shot
            { ...move_pool[6] }, // Soul Drain
            { ...move_pool[8] }, // Normal punches
            { ...move_pool[9] }, // Critical Strike
        ],
    }),
];
