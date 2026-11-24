import { fetchApi } from "@/lib/api";
import type { NotificationPage, PortalNotification } from "@/lib/types/notification";

export const notificationService = {
  list(page = 0, size = 20, signal?: AbortSignal) {
    const safePage = Number.isInteger(page) && page >= 0 ? page : 0;
    const safeSize = Number.isInteger(size) ? Math.min(50, Math.max(1, size)) : 20;
    return fetchApi<NotificationPage>(`/notifications?page=${safePage}&size=${safeSize}`, { signal });
  },
  unreadCount(signal?: AbortSignal) {
    return fetchApi<{ unreadCount: number }>("/notifications/unread-count", { signal });
  },
  markRead(id: string) {
    return fetchApi<PortalNotification>(`/notifications/${encodeURIComponent(id)}/read`, { method: "PATCH" });
  },
  markAllRead() {
    return fetchApi<{ unreadCount: number }>("/notifications/read-all", { method: "PATCH" });
  },
};

/** Notifications may navigate within the portal, never to an external URL or executable scheme. */
export function safeNotificationLink(value: string | null | undefined): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//") || /[\\\u0000-\u0020\u007f]/.test(value) || /%(?:2f|5c|0[0-9a-f]|1[0-9a-f]|7f)/i.test(value)) return null;
  try {
    const url = new URL(value, "https://portal.invalid");
    return url.origin === "https://portal.invalid" ? `${url.pathname}${url.search}${url.hash}` : null;
  } catch {
    return null;
  }
}
