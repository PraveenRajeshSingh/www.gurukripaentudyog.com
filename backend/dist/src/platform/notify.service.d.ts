import { PlatformStoreService } from './store.service';
import { NotificationType, UserNotification } from './types';
export declare class NotifyService {
    private readonly store;
    constructor(store: PlatformStoreService);
    notifyUser(userId: string, tenantId: string, type: NotificationType, title: string, body: string, ref?: {
        entityType?: string;
        entityId?: string;
    }): Promise<UserNotification>;
    private pushToDevice;
}
