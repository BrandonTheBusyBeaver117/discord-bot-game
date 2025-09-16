import { CommandInteraction } from 'discord.js';

import { supabase } from '../..';
import { Card, getCard } from '../../get_cards';

export type Inventory = {
    card: Card;
    quantity: number;
}[];

export const fetchUserCards = async (userID: string, cardIDs: string[]): Promise<Inventory> => {
    const { data: inventoryData, error: inventoryError } = await supabase
        .from('inventory')
        .select('card_id, quantity')
        .eq('user_id', userID)
        .in('card_id', cardIDs);

    if (inventoryError) {
        console.error('Failed to fetch cards:', inventoryError);
        return;
    }

    // Basically the supabase response returns just the ids, but we convert to cards
    return inventoryData.map((item) => {
        return {
            ...item,
            card: getCard(item.card_id),
        };
    });
};

export const fetchInventory = async (userID: string): Promise<Inventory | void> => {
    const { data: inventoryData, error: inventoryError } = await supabase
        .from('inventory')
        .select('card_id, quantity')
        .eq('user_id', userID);

    if (inventoryError) {
        console.error('Failed to fetch inventory:', inventoryError);
        return;
    }

    // Basically the supabase response returns just the ids, but we convert to cards
    return inventoryData.map((item) => {
        return {
            ...item,
            card: getCard(item.card_id),
        };
    });
};

export const textifyInventory = (inventoryData: Inventory): string => {
    if (inventoryData.length == 0) return 'Your inventory is empty';

    return inventoryData.map((item) => `**${item.card.name}** x${item.quantity}`).join('\n');
};

interface CachedInventory {
    inventory: Inventory;
    timestamp: number;
}

// Map cache: userId → CachedInventory
export const inventoryCache = new Map<string, CachedInventory>();
export const CACHE_TTL = 30_000; // 30 seconds

// --- Background cleanup ---
setInterval(() => {
    const now = Date.now();
    for (const [userId, cached] of inventoryCache.entries()) {
        if (now - cached.timestamp > CACHE_TTL) {
            inventoryCache.delete(userId);
            console.log(`🧹 Cleared expired cache for user ${userId}`);
        }
    }
}, 60_000); // prune every 1 minute

export const invalidateInventoryCache = (userUUID: string): void => {
    if (inventoryCache.has(userUUID)) {
        inventoryCache.delete(userUUID);
        console.log('invalidated!');
    }
};
