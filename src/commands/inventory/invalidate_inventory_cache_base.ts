import CommandBase from '../command_base';
import InventoryBase from './inventory_base';
import { invalidateInventoryCache } from './inventory_util';

class InvalidateInventoryCacheBase extends InventoryBase {
    override async onSuccess(interaction): Promise<void> {
        invalidateInventoryCache(interaction.user.id);
    }
}

export default InvalidateInventoryCacheBase;
