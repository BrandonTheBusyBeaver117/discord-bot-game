import CommandBase from '../command_base';
import { invalidateInventoryCache } from '../inventory/inventory_util';

class RollBase extends CommandBase {
    override async onSuccess(interaction): Promise<void> {
        invalidateInventoryCache(interaction.user.id);
    }
}

export default RollBase;
