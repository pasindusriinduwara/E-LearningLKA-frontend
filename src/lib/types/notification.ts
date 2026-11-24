export interface PortalNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  createdAt: string;
  read: boolean;
  readAt: string | null;
}

export interface NotificationPage {
  items: PortalNotification[];
  unreadCount: number;
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}
