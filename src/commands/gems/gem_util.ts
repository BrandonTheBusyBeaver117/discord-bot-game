import { supabase } from '../..';

export const addGems = async (uuid: string, numGems: number, reason: string): Promise<number> => {
    const { data, error } = await supabase.rpc('add_gems_to_user', {
        target_user_id: uuid,
        gem_amount: numGems,
        reason: reason,
    });

    return data;
};
