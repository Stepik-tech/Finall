import { useState, useEffect, useCallback } from 'react';
import type { UserType, Group, Ticket, Log, ShopItem, Purchase, Chat, Notification } from '@/types';

// Storage keys
const STORAGE_KEYS = {
  USERS: 'sunday_app_users',
  GROUPS: 'sunday_app_groups',
  TICKETS: 'sunday_app_tickets',
  LOGS: 'sunday_app_logs',
  SHOP_ITEMS: 'sunday_app_shop_items',
  PURCHASES: 'sunday_app_purchases',
  CHATS: 'sunday_app_chats',
  NOTIFICATIONS: 'sunday_app_notifications',
  CURRENT_USER: 'sunday_app_current_user',
};

// Initialize database with default data
export function initDatabase() {
  // Initialize users if not exists
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    const defaultUsers: UserType[] = [
      {
        id: 1,
        vkId: '1080373719',
        username: 'Владелец',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=owner',
        banner: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=1200',
        lvl: 5,
        balls: 9999,
        position: 'Владелец',
        warnings: 0,
        reprimands: 0,
        is_online: true,
        last_seen: new Date().toISOString(),
        created_at: new Date().toISOString(),
        permissions: ['all'],
        isBanned: false,
        ghostMode: false,
        messagesClosed: false,
      },
    ];
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(defaultUsers));
  }

  // Initialize shop items if not exists
  if (!localStorage.getItem(STORAGE_KEYS.SHOP_ITEMS)) {
    const defaultItems: ShopItem[] = [
      {
        id: '1',
        name: 'Снятие выговора',
        description: 'Снимает один выговор с вашего аккаунта',
        price: 60,
        type: 'remove_reprimand',
        created_by: 1,
        created_at: new Date().toISOString(),
      },
      {
        id: '2',
        name: 'Снятие предупреждения',
        description: 'Снимает одно предупреждение с вашего аккаунта',
        price: 40,
        type: 'remove_warning',
        created_by: 1,
        created_at: new Date().toISOString(),
      },
    ];
    localStorage.setItem(STORAGE_KEYS.SHOP_ITEMS, JSON.stringify(defaultItems));
  }

  // Initialize empty arrays for other data
  Object.values(STORAGE_KEYS).forEach(key => {
    if (!localStorage.getItem(key) && key !== STORAGE_KEYS.USERS && key !== STORAGE_KEYS.SHOP_ITEMS && key !== STORAGE_KEYS.CURRENT_USER) {
      localStorage.setItem(key, JSON.stringify([]));
    }
  });
}

// Generic get function
function getItem<T>(key: string): T[] {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

// Generic set function
function setItem<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

// Users
export function getUsers(): UserType[] {
  return getItem<UserType>(STORAGE_KEYS.USERS);
}

export function getUserById(id: number): UserType | undefined {
  return getUsers().find(u => u.id === id);
}

export function getUserByVkId(vkId: string): UserType | undefined {
  return getUsers().find(u => u.vkId === vkId);
}

export function saveUser(user: UserType): void {
  const users = getUsers();
  const index = users.findIndex(u => u.id === user.id);
  if (index >= 0) {
    users[index] = user;
  } else {
    users.push(user);
  }
  setItem(STORAGE_KEYS.USERS, users);
  broadcastChange('users', users);
}

export function deleteUser(id: number): void {
  const users = getUsers().filter(u => u.id !== id);
  setItem(STORAGE_KEYS.USERS, users);
  broadcastChange('users', users);
}

// Current user
export function getCurrentUser(): UserType | null {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function setCurrentUser(user: UserType | null): void {
  if (user) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }
  broadcastChange('currentUser', user);
}

// Groups
export function getGroups(): Group[] {
  return getItem<Group>(STORAGE_KEYS.GROUPS);
}

export function saveGroup(group: Group): void {
  const groups = getGroups();
  const index = groups.findIndex(g => g.id === group.id);
  if (index >= 0) {
    groups[index] = group;
  } else {
    groups.push(group);
  }
  setItem(STORAGE_KEYS.GROUPS, groups);
  broadcastChange('groups', groups);
}

export function deleteGroup(id: string): void {
  const groups = getGroups().filter(g => g.id !== id);
  setItem(STORAGE_KEYS.GROUPS, groups);
  broadcastChange('groups', groups);
}

// Tickets
export function getTickets(): Ticket[] {
  return getItem<Ticket>(STORAGE_KEYS.TICKETS);
}

export function saveTicket(ticket: Ticket): void {
  const tickets = getTickets();
  const index = tickets.findIndex(t => t.id === ticket.id);
  if (index >= 0) {
    tickets[index] = ticket;
  } else {
    tickets.push(ticket);
  }
  setItem(STORAGE_KEYS.TICKETS, tickets);
  broadcastChange('tickets', tickets);
}

// Logs
export function getLogs(): Log[] {
  return getItem<Log>(STORAGE_KEYS.LOGS);
}

export function addLog(log: Log): void {
  const logs = getLogs();
  logs.unshift(log);
  setItem(STORAGE_KEYS.LOGS, logs);
  broadcastChange('logs', logs);
}

// Shop items
export function getShopItems(): ShopItem[] {
  return getItem<ShopItem>(STORAGE_KEYS.SHOP_ITEMS);
}

export function saveShopItem(item: ShopItem): void {
  const items = getShopItems();
  const index = items.findIndex(i => i.id === item.id);
  if (index >= 0) {
    items[index] = item;
  } else {
    items.push(item);
  }
  setItem(STORAGE_KEYS.SHOP_ITEMS, items);
  broadcastChange('shopItems', items);
}

export function deleteShopItem(id: string): void {
  const items = getShopItems().filter(i => i.id !== id);
  setItem(STORAGE_KEYS.SHOP_ITEMS, items);
  broadcastChange('shopItems', items);
}

// Purchases
export function getPurchases(): Purchase[] {
  return getItem<Purchase>(STORAGE_KEYS.PURCHASES);
}

export function savePurchase(purchase: Purchase): void {
  const purchases = getPurchases();
  purchases.push(purchase);
  setItem(STORAGE_KEYS.PURCHASES, purchases);
  broadcastChange('purchases', purchases);
}

// Chats
export function getChats(): Chat[] {
  return getItem<Chat>(STORAGE_KEYS.CHATS);
}

export function saveChat(chat: Chat): void {
  const chats = getChats();
  const index = chats.findIndex(c => c.id === chat.id);
  if (index >= 0) {
    chats[index] = chat;
  } else {
    chats.push(chat);
  }
  setItem(STORAGE_KEYS.CHATS, chats);
  broadcastChange('chats', chats);
}

// Notifications
export function getNotifications(): Notification[] {
  return getItem<Notification>(STORAGE_KEYS.NOTIFICATIONS);
}

export function addNotification(notification: Notification): void {
  const notifications = getNotifications();
  notifications.unshift(notification);
  setItem(STORAGE_KEYS.NOTIFICATIONS, notifications);
  broadcastChange('notifications', notifications);
}

export function markNotificationAsRead(id: string): void {
  const notifications = getNotifications();
  const index = notifications.findIndex(n => n.id === id);
  if (index >= 0) {
    notifications[index].read = true;
    setItem(STORAGE_KEYS.NOTIFICATIONS, notifications);
    broadcastChange('notifications', notifications);
  }
}

// Broadcast channel for real-time sync
let broadcastChannel: BroadcastChannel | null = null;

try {
  broadcastChannel = new BroadcastChannel('sunday_app_sync');
} catch {
  // BroadcastChannel not supported
}

function broadcastChange(type: string, data: unknown) {
  if (broadcastChannel) {
    broadcastChannel.postMessage({ type, data, timestamp: Date.now() });
  }
  // Also dispatch custom event for same-tab updates
  window.dispatchEvent(new CustomEvent('sunday_app_update', { detail: { type, data } }));
}

// Hook for real-time sync
export function useRealtimeSync(callback: (type: string, data: unknown) => void) {
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      callback(event.data.type, event.data.data);
    };

    const handleCustomEvent = (event: CustomEvent) => {
      callback(event.detail.type, event.detail.data);
    };

    if (broadcastChannel) {
      broadcastChannel.addEventListener('message', handleMessage);
    }
    window.addEventListener('sunday_app_update', handleCustomEvent as EventListener);

    return () => {
      if (broadcastChannel) {
        broadcastChannel.removeEventListener('message', handleMessage);
      }
      window.removeEventListener('sunday_app_update', handleCustomEvent as EventListener);
    };
  }, [callback]);
}

// Hook for current user
export function useCurrentUser() {
  const [user, setUser] = useState<UserType | null>(getCurrentUser());

  useEffect(() => {
    const handleUpdate = (event: CustomEvent) => {
      if (event.detail.type === 'currentUser') {
        setUser(event.detail.data);
      }
    };

    window.addEventListener('sunday_app_update', handleUpdate as EventListener);
    return () => window.removeEventListener('sunday_app_update', handleUpdate as EventListener);
  }, []);

  const updateUser = useCallback((newUser: UserType | null) => {
    setCurrentUser(newUser);
    setUser(newUser);
  }, []);

  return { user, setUser: updateUser };
}
