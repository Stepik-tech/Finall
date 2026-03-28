// User types
export interface UserType {
  id: number;
  vkId: string;
  username: string;
  avatar?: string;
  banner?: string;
  lvl: number;
  balls: number;
  position?: string;
  warnings: number;
  reprimands: number;
  is_online: boolean;
  last_seen: string;
  created_at: string;
  permissions: string[];
  isBanned: boolean;
  banReason?: string;
  banUntil?: string;
  ghostMode: boolean;
  messagesClosed: boolean;
}

// Group types
export interface Group {
  id: string;
  name: string;
  avatar?: string;
  description?: string;
  creatorId: number;
  members: number[];
  admins: number[];
  pinnedMessage?: MessageType;
  created_at: string;
}

// Message types
export interface MessageType {
  id: string;
  groupId?: string;
  chatId?: string;
  senderId: number;
  text: string;
  attachments?: Attachment[];
  replyTo?: string;
  edited?: boolean;
  editedAt?: string;
  deletedFor?: number[];
  created_at: string;
}

export interface Attachment {
  type: 'image' | 'file';
  url: string;
  name?: string;
}

// Chat types (private messages)
export interface Chat {
  id: string;
  participants: number[];
  messages: MessageType[];
  lastMessage?: MessageType;
  unreadCount: number;
  updated_at: string;
}

// Ticket types
export interface Ticket {
  id: string;
  userId: number;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'closed';
  priority: 'low' | 'medium' | 'high';
  responses: TicketResponse[];
  created_at: string;
  updated_at: string;
  closedBy?: number;
  closeReason?: string;
}

export interface TicketResponse {
  id: string;
  ticketId: string;
  userId: number;
  text: string;
  created_at: string;
}

// Log types
export interface Log {
  id: string;
  type: 'balls' | 'warning' | 'reprimand' | 'ban' | 'unban' | 'level_change' | 'position_change' | 'purchase' | 'other';
  userId: number;
  targetId?: number;
  description: string;
  oldValue?: unknown;
  newValue?: unknown;
  created_by: number;
  created_at: string;
}

// Shop item types
export interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  type: 'remove_warning' | 'remove_reprimand' | 'other';
  created_by: number;
  created_at: string;
}

export interface Purchase {
  id: string;
  itemId: string;
  userId: number;
  itemName: string;
  price: number;
  status: 'pending' | 'completed' | 'cancelled';
  created_at: string;
}

// Notification types
export interface Notification {
  id: string;
  userId: number;
  title: string;
  message: string;
  type: 'ticket' | 'message' | 'group' | 'purchase' | 'system';
  read: boolean;
  link?: string;
  created_at: string;
}

// Level colors
export const LEVEL_COLORS: Record<number, string> = {
  0: '#9CA3AF', // Gray - User
  1: '#10B981', // Emerald - Junior Mod
  2: '#3B82F6', // Blue - Moderator
  3: '#8B5CF6', // Violet - Senior Mod
  4: '#F59E0B', // Amber - Admin
  5: '#EF4444', // Red - Owner
};

// Level names
export const LEVEL_NAMES: Record<number, string> = {
  0: 'Пользователь',
  1: 'Младший модератор',
  2: 'Модератор',
  3: 'Старший модератор',
  4: 'Администратор',
  5: 'Владелец',
};

// Get username color based on level
export function getUsernameColor(level: number): string {
  return LEVEL_COLORS[level] || LEVEL_COLORS[0];
}

// Get rank name
export function getRankName(level: number): string {
  return LEVEL_NAMES[level] || LEVEL_NAMES[0];
}

// Check if user can access feature
export function canAccess(userLevel: number, requiredLevel: number): boolean {
  return userLevel >= requiredLevel;
}

// Rating calculation
export function calculateRating(balls: number, warnings: number, reprimands: number): number {
  return balls - (warnings * 15) - (reprimands * 30);
}
