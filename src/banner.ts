import { Card, getRarity } from './get_cards';
import nodeCron from 'node-cron';

/** Distributions in percentages */
type Distribution = {
    common: number;
    rare: number;
    epic: number;
    legendary: number;
};

class DistributionValidator {
    common: number;
    rare: number;
    epic: number;
    legendary: number;

    constructor(distribution: Distribution) {
        const { common, rare, epic, legendary } = distribution;
        const total = common + rare + epic + legendary;

        if (total !== 100) {
            throw new Error('The sum of all distribution percentages must equal 100.');
        }

        Object.assign(this, distribution);

        // this.common = common;
        // this.rare = rare;
        // this.epic = epic;
        // this.legendary = legendary;
    }
}
const defaultDistribution: Distribution = new DistributionValidator({
    common: 60,
    rare: 30,
    epic: 9.75,
    legendary: 0.25,
});

type BannerConfig = {
    name: string;
    common: Array<Card>;
    rare: Array<Card>;
    epic: Array<Card>;
    legendary: Array<Card>;
    distribution: Distribution;
};

export class Banner {
    name: string;
    common: Array<Card>;
    rare: Array<Card>;
    epic: Array<Card>;
    legendary: Array<Card>;
    distribution: Distribution;

    constructor(config: BannerConfig) {
        Object.assign(this, config);
    }

    getCard(): Card {
        const random = Math.random() * 100;

        let rarity = '';

        if (random < this.distribution.common) {
            rarity = 'common';
        } else if (random < this.distribution.common + this.distribution.rare) {
            rarity = 'rare';
        } else if (
            random <
            this.distribution.common + this.distribution.rare + this.distribution.epic
        ) {
            rarity = 'epic';
        } else {
            rarity = 'legendary';
        }

        const randomIndex = Math.floor(Math.random() * this[rarity].length);
        const card = this[rarity][randomIndex];

        return card;
    }

    private joinCards(rarity: string): string {
        return `${rarity.charAt(0).toUpperCase() + rarity.slice(1)}: ${this[rarity].map((card: Card) => card.name).join(', ')}`;
    }

    getCardsInBannerStringified(): string {
        return (
            `${this.joinCards('common')}\n` +
            `${this.joinCards('rare')}\n` +
            `${this.joinCards('epic')}\n` +
            `${this.joinCards('legendary')}\n`
        );
    }
}

// const gen3Banner: BannerConfig = {
//     name: 'Gen 3',
//     common: [{ name: 'treecko' }, { name: 'torchic' }, { name: 'mudkip' }, { name: 'whismur' }],
//     rare: [{ name: 'walrein' }, { name: 'milotic' }, { name: 'altaria' }],
//     epic: [{ name: 'metagross' }, { name: 'registeel' }],
//     legendary: [{ name: 'rayquaza' }],
//     distribution: defaultDistribution,
// };

/**
 * A function to help pick out the cards of a certain rarity for your banner
 * @param pool The possible cards for this rarity
 * @param numCards How many cards you want in this rairty
 * @returns The array for the rarity
 */
const getRandomCards = (pool: Card[], numCards: number): Card[] => {
    // Make copy so we can remove elements and ensure unique cards
    const poolCopy = pool.slice();
    const cards = [];

    for (let i = 0; i < numCards; i++) {
        const randomElementIndex = Math.floor(Math.random() * poolCopy.length);

        // console.log(randomElementIndex);

        cards.push(...poolCopy.splice(randomElementIndex, 1));
    }

    return cards;
};

export const Banners: Banner[] = [
    // new Banner(gen3Banner),
];

const generateRandomBanner = (): Banner => {
    const randomBannerConfig: BannerConfig = {
        name: 'Random',
        common: getRandomCards(getRarity('common'), 4),
        rare: getRandomCards(getRarity('rare'), 3),
        epic: getRandomCards(getRarity('epic'), 2),
        legendary: getRandomCards(getRarity('legendary'), 1),
        distribution: defaultDistribution,
    };

    return new Banner(randomBannerConfig);
};

// idk, just in case we don't run the scheduler for some reason
let randomBanner = generateRandomBanner();

export const getCurrentRandomBanner = (): Banner => randomBanner;

export const startRandomBannerScheduler = (): void => {
    // Generate immediately at startup
    randomBanner = generateRandomBanner();
    console.log(`Random Banner initialized at ${new Date().toLocaleTimeString()}`);

    // Then update every hour on the hour
    nodeCron.schedule('0 * * * *', () => {
        randomBanner = generateRandomBanner();
        console.log(`Random Banner updated at ${new Date().toLocaleTimeString()}`);
    });
};
