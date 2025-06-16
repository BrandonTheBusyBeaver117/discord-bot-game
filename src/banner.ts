import Characters from './characters';
import fs from 'fs';
import path from 'path';

type Cards = {
    name: string;
};

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
    common: Array<Cards>;
    rare: Array<Cards>;
    epic: Array<Cards>;
    legendary: Array<Cards>;
    distribution: Distribution;
};

export class Banner {
    name: string;
    common: Array<Cards>;
    rare: Array<Cards>;
    epic: Array<Cards>;
    legendary: Array<Cards>;
    distribution: Distribution;

    constructor(config: BannerConfig) {
        Object.assign(this, config);
    }

    getCard(): Cards {
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
        return `${rarity.charAt(0).toUpperCase() + rarity.slice(1)}: ${this[rarity].map((card: Cards) => card.name).join(', ')}`;
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

const defaultBannerConfig: BannerConfig = {
    name: 'Default',
    common: [
        { name: 'pikachu' },
        { name: 'bulbasaur' },
        { name: 'squirtle' },
        { name: 'charmander' },
    ],
    rare: [{ name: 'butterfree' }, { name: 'hitmonchan' }, { name: 'onix' }],
    epic: [{ name: 'gyarados' }, { name: 'dragonite' }],
    legendary: [{ name: 'mewtwo' }],
    distribution: defaultDistribution,
};

const gen3Banner: BannerConfig = {
    name: 'Gen 3',
    common: [{ name: 'treecko' }, { name: 'torchic' }, { name: 'mudkip' }, { name: 'whismur' }],
    rare: [{ name: 'walrein' }, { name: 'milotic' }, { name: 'altaria' }],
    epic: [{ name: 'metagross' }, { name: 'registeel' }],
    legendary: [{ name: 'rayquaza' }],
    distribution: defaultDistribution,
};

const gen4Banner: BannerConfig = {
    name: 'Gen 4',
    common: [{ name: 'turtwig' }, { name: 'chimchar' }, { name: 'piplup' }, { name: 'bidoof' }],
    rare: [{ name: 'gastrodon' }, { name: 'bastiodon' }, { name: 'drapion' }],
    epic: [{ name: 'mamoswine' }, { name: 'garchomp' }],
    legendary: [{ name: 'arceus' }],
    distribution: defaultDistribution,
};

const getRandomCards = (pool: string[], numCards: number): Cards[] => {
    const poolCopy = pool.slice();
    const elements = [];

    for (let i = 0; i < numCards; i++) {
        const randomElementIndex = Math.floor(Math.random() * poolCopy.length);

        console.log(randomElementIndex);

        elements.push(...poolCopy.splice(randomElementIndex, 1));
    }

    return elements.map((charName) => ({ name: charName }));
};

export const Banners: Banner[] = [
    new Banner(defaultBannerConfig),
    new Banner(gen3Banner),
    new Banner(gen4Banner),
];

export const GetCurrentBanner = (): Banner => {
    const randomBannerConfigPath = path.join(__dirname, '../data/random_banner.json');

    const prevRandomizedBannerConfig = JSON.parse(fs.readFileSync(randomBannerConfigPath, 'utf8'));

    if (new Date().getHours() === prevRandomizedBannerConfig.hour) {
        return new Banner(prevRandomizedBannerConfig.config);
    }

    const randomBannerConfig: BannerConfig = {
        name: 'Random',
        common: getRandomCards(Characters.common, 4),
        rare: getRandomCards(Characters.rare, 3),
        epic: getRandomCards(Characters.epic, 2),
        legendary: getRandomCards(Characters.legendary, 1),
        distribution: defaultDistribution,
    };

    const jsonifiedRandomBannerConfig = {
        hour: new Date().getHours(),
        config: randomBannerConfig,
    };

    fs.writeFileSync(randomBannerConfigPath, JSON.stringify(jsonifiedRandomBannerConfig), 'utf8');

    return new Banner(randomBannerConfig);

    // const minute = new Date().getMinutes();

    // // Quick way to cycle through banners every minute
    // const banner = Banners[minute % Banners.length];
};
