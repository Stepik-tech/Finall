import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Crown,
  Users,
  Shield,
  Database,
  Settings,
  AlertTriangle,
  Trash2,
  Download,
  MessageSquare,
  Bell,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getUsers, getGroups, getTickets, getLogs, getShopItems, getPurchases, getChats, getNotifications } from '@/hooks/useStorage';
import type { UserType } from '@/types';

interface OwnerPanelProps {
  currentUser: UserType;
}

export default function OwnerPanel({ currentUser }: OwnerPanelProps) {
  const [stats, setStats] = useState({
    users: 0,
    groups: 0,
    tickets: 0,
    logs: 0,
    shopItems: 0,
    purchases: 0,
    chats: 0,
    notifications: 0,
  });
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearType, setClearType] = useState<string>('');

  useEffect(() => {
    setStats({
      users: getUsers().length,
      groups: getGroups().length,
      tickets: getTickets().length,
      logs: getLogs().length,
      shopItems: getShopItems().length,
      purchases: getPurchases().length,
      chats: getChats().length,
      notifications: getNotifications().length,
    });
  }, []);

  const handleClearData = () => {
    switch (clearType) {
      case 'logs':
        localStorage.setItem('sunday_app_logs', JSON.stringify([]));
        break;
      case 'tickets':
        localStorage.setItem('sunday_app_tickets', JSON.stringify([]));
        break;
      case 'notifications':
        localStorage.setItem('sunday_app_notifications', JSON.stringify([]));
        break;
      case 'all':
        // Keep only users and shop items
        localStorage.setItem('sunday_app_groups', JSON.stringify([]));
        localStorage.setItem('sunday_app_tickets', JSON.stringify([]));
        localStorage.setItem('sunday_app_logs', JSON.stringify([]));
        localStorage.setItem('sunday_app_purchases', JSON.stringify([]));
        localStorage.setItem('sunday_app_chats', JSON.stringify([]));
        localStorage.setItem('sunday_app_notifications', JSON.stringify([]));
        break;
    }
    setShowClearConfirm(false);
    setClearType('');
    // Refresh stats
    setStats({
      users: getUsers().length,
      groups: getGroups().length,
      tickets: getTickets().length,
      logs: getLogs().length,
      shopItems: getShopItems().length,
      purchases: getPurchases().length,
      chats: getChats().length,
      notifications: getNotifications().length,
    });
  };

  const handleExportData = () => {
    const data = {
      users: getUsers(),
      groups: getGroups(),
      tickets: getTickets(),
      logs: getLogs(),
      shopItems: getShopItems(),
      purchases: getPurchases(),
      chats: getChats(),
      notifications: getNotifications(),
      exportDate: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sunday-app-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const StatCard = ({ icon: Icon, label, value, color }: { icon: typeof Users; label: string; value: number; color: string }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 rounded-2xl bg-white/5 border border-white/10"
    >
      <div className={`p-3 rounded-xl ${color} w-fit mb-4`}>
        <Icon className="w-6 h-6" />
      </div>
      <p className="text-3xl font-bold text-white">{value}</p>
      <p className="text-slate-400 text-sm">{label}</p>
    </motion.div>
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-violet-500/20">
            <Crown className="w-6 h-6 text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Панель владельца</h1>
            <p className="text-slate-400">Полный контроль над системой</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 p-4">
        <Tabs defaultValue="stats" className="w-full">
          <TabsList className="w-full bg-white/5 border border-white/10 mb-4">
            <TabsTrigger value="stats" className="flex-1 data-[state=active]:bg-violet-600">
              Статистика
            </TabsTrigger>
            <TabsTrigger value="database" className="flex-1 data-[state=active]:bg-violet-600">
              База данных
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex-1 data-[state=active]:bg-violet-600">
              Настройки
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stats" className="space-y-6">
            {/* Main Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={Users} label="Пользователи" value={stats.users} color="bg-violet-500/20 text-violet-400" />
              <StatCard icon={MessageSquare} label="Группы" value={stats.groups} color="bg-emerald-500/20 text-emerald-400" />
              <StatCard icon={Shield} label="Тикеты" value={stats.tickets} color="bg-amber-500/20 text-amber-400" />
              <StatCard icon={Database} label="Логи" value={stats.logs} color="bg-cyan-500/20 text-cyan-400" />
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={Database} label="Товары" value={stats.shopItems} color="bg-fuchsia-500/20 text-fuchsia-400" />
              <StatCard icon={Database} label="Покупки" value={stats.purchases} color="bg-rose-500/20 text-rose-400" />
              <StatCard icon={MessageSquare} label="Чаты" value={stats.chats} color="bg-blue-500/20 text-blue-400" />
              <StatCard icon={Bell} label="Уведомления" value={stats.notifications} color="bg-orange-500/20 text-orange-400" />
            </div>

            {/* Online Users */}
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                Пользователи онлайн
              </h3>
              <div className="flex flex-wrap gap-2">
                {getUsers()
                  .filter(u => u.is_online)
                  .map(user => (
                    <div key={user.id} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5">
                      <img
                        src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
                        alt={user.username}
                        className="w-8 h-8 rounded-full"
                      />
                      <span className="text-sm text-white">{user.username}</span>
                    </div>
                  ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="database" className="space-y-4">
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <Database className="w-5 h-5 text-violet-400" />
                Управление данными
              </h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                  <div>
                    <p className="font-medium text-white">Экспорт данных</p>
                    <p className="text-sm text-slate-400">Скачать все данные в JSON формате</p>
                  </div>
                  <Button onClick={handleExportData} variant="outline" className="border-white/10">
                    <Download className="w-4 h-4 mr-2" />
                    Экспорт
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                  <div>
                    <p className="font-medium text-white">Очистить логи</p>
                    <p className="text-sm text-slate-400">Удалить все записи логов ({stats.logs})</p>
                  </div>
                  <Button 
                    onClick={() => { setClearType('logs'); setShowClearConfirm(true); }}
                    variant="outline" 
                    className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Очистить
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                  <div>
                    <p className="font-medium text-white">Очистить тикеты</p>
                    <p className="text-sm text-slate-400">Удалить все тикеты ({stats.tickets})</p>
                  </div>
                  <Button 
                    onClick={() => { setClearType('tickets'); setShowClearConfirm(true); }}
                    variant="outline" 
                    className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Очистить
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                  <div>
                    <p className="font-medium text-white">Очистить уведомления</p>
                    <p className="text-sm text-slate-400">Удалить все уведомления ({stats.notifications})</p>
                  </div>
                  <Button 
                    onClick={() => { setClearType('notifications'); setShowClearConfirm(true); }}
                    variant="outline" 
                    className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Очистить
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                  <div>
                    <p className="font-medium text-red-400 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Полная очистка
                    </p>
                    <p className="text-sm text-slate-400">Удалить все данные кроме пользователей и товаров</p>
                  </div>
                  <Button 
                    onClick={() => { setClearType('all'); setShowClearConfirm(true); }}
                    variant="destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Очистить всё
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5 text-violet-400" />
                Настройки системы
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                  <div>
                    <p className="font-medium text-white">Режим призрака</p>
                    <p className="text-sm text-slate-400">Скрывать ваш статус онлайн</p>
                  </div>
                  <Switch checked={currentUser.ghostMode} />
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                  <div>
                    <p className="font-medium text-white">Личные сообщения</p>
                    <p className="text-sm text-slate-400">Разрешить другим писать вам</p>
                  </div>
                  <Switch checked={!currentUser.messagesClosed} />
                </div>

                <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/20">
                  <h4 className="font-medium text-violet-400 mb-2">Информация о системе</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Версия:</span>
                      <span className="text-white">2026.1.0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Хранилище:</span>
                      <span className="text-white">LocalStorage</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Владелец:</span>
                      <span className="text-white">{currentUser.username}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </ScrollArea>

      {/* Clear Confirm Dialog */}
      <Dialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <DialogContent className="bg-slate-950 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="w-5 h-5" />
              Подтверждение удаления
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <p className="text-slate-400">
              Вы уверены, что хотите удалить {clearType === 'all' ? 'все данные' : 
                clearType === 'logs' ? 'все логи' :
                clearType === 'tickets' ? 'все тикеты' :
                'все уведомления'}?
              <br />
              <span className="text-red-400">Это действие нельзя отменить!</span>
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 border-white/10"
              >
                Отмена
              </Button>
              <Button
                onClick={handleClearData}
                variant="destructive"
                className="flex-1"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Удалить
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
