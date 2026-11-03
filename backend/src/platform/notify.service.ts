// Notification dispatch for platform events (requirement E).
//
// What works today with zero external config:
//   - persistent in-app notification inbox per user (GET /api/v1/me/notifications)
// What activates once credentials are supplied (no fabricated delivery):
//   - outbound push via PUSH_WEBHOOK_URL (Cloud Function / Firebase v1 relay).
//     The backend POSTs { token, title, body, data } to that endpoint; the
//     relay holds the FCM v1 OAuth credentials. The API bundle never contains
//     a server key.
import { Injectable } from '@nestjs/common';
import { PlatformStoreService } from './store.service';
import { NotificationType, UserNotification } from './types';

@Injectable()
export class NotifyService {
  constructor(private readonly store: PlatformStoreService) {}

  /**
   * Record an event notification for a user and fan it out to the
   * configured push transport (best-effort; delivery failures are logged,
   * never allowed to fail the business transaction).
   */
  async notifyUser(
    userId: string,
    tenantId: string,
    type: NotificationType,
    title: string,
    body: string,
    ref?: { entityType?: string; entityId?: string },
  ): Promise<UserNotification> {
    const n = await this.store.addNotification({
      userId, tenantId, type, title, body,
      entityType: ref?.entityType, entityId: ref?.entityId,
    });

    const kind = type === 'ANNOUNCEMENT' ? 'announcements' : type.startsWith('QUOTATION') ? 'quotations' : 'orderUpdates';
    for (const device of this.store.tokensOf(userId)) {
      if (!device.preferences[kind]) continue; // user opted out on this device
      this.pushToDevice(device.token, n);
    }
    return n;
  }

  private pushToDevice(token: string, n: UserNotification): void {
    const endpoint = process.env.PUSH_WEBHOOK_URL;
    if (!endpoint) return; // transport not configured yet — inbox record still stands
    const payload = JSON.stringify({
      to: token,
      notification: { title: n.title, body: n.body },
      data: { type: n.type, entityType: n.entityType || '', entityId: n.entityId || '' },
    });
    fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...(process.env.PUSH_WEBHOOK_TOKEN ? { authorization: `Bearer ${process.env.PUSH_WEBHOOK_TOKEN}` } : {}) },
      body: payload,
    }).catch((err) => console.warn('[notify] push transport failed:', err.message));
  }
}
