import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, Ticket, MessageSquare, ShoppingBag, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getNotifications, markNotificationAsRead } from '@/hooks/useStorage';
import type { Notification, UserType } from '@/types';

interface NotificationBellProps {
  currentUser: UserType;
}

export default function NotificationBell({ currentUser }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const loadNotifications = () => {
      const allNotifications = getNotifications();
      const userNotifications = allNotifications.filter(
        n => n.userId === currentUser.id || n.userId === 0
      );
      setNotifications(userNotifications);
    };

    loadNotifications();
    const interval = setInterval(loadNotifications, 1000);
    return () => clearInterval(interval);
  }, [currentUser.id]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAsRead = (id: string) => {
    markNotificationAsRead(id);
    setNotifications(getNotifications().filter(
      n => n.userId === currentUser.id || n.userId === 0
    ));
  };

  const handleMarkAllAsRead = () => {
    notifications.filter(n => !n.read).forEach(n => {
      markNotificationAsRead(n.id);
    });
    setNotifications(getNotifications().filter(
      n => n.userId === currentUser.id || n.userId === 0
    ));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'ticket': return <Ticket className="w-4 h-4 text-amber-400" />;
      case 'message': return <MessageSquare className="w-4 h-4 text-violet-400" />;
      case 'purchase': return <ShoppingBag className="w-4 h-4 text-cyan-400" />;
      case 'group': return <MessageSquare className="w-4 h-4 text-emerald-400" />;
      default: return <AlertCircle className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative hover:bg-white/10"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 top-full mt-2 w-80 z-50 rounded-2xl bg-slate-950 border border-white/10 shadow-2xl overflow-hidden"
            >
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <h3 className="font-semibold text-white">Уведомления</h3>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMarkAllAsRead}
                    className="text-xs text-violet-400 hover:text-violet-300"
                  >
                    <Check className="w-3 h-3 mr-1" />
                    Прочитать все
                  </Button>
                )}
              </div>

              <ScrollArea className="max-h-80">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <Bell className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">Нет уведомлений</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {notifications.map((notification) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={`p-4 hover:bg-white/5 transition-colors ${
                          !notification.read ? 'bg-violet-500/5' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-white/5">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-white text-sm">{notification.title}</p>
                            <p className="text-slate-400 text-sm truncate">{notification.message}</p>
                            <p className="text-xs text-slate-500 mt-1">
                              {new Date(notification.created_at).toLocaleString('ru-RU')}
                            </p>
                          </div>
                          {!notification.read && (
                            <button
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="p-1 hover:bg-white/10 rounded"
                            >
                              <Check className="w-4 h-4 text-violet-400" />
                            </button>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
