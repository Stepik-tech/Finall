import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Filter,
  Shield,
  Trophy,
  AlertTriangle,
  Ban,
  Star,
  CheckCircle,
  MoreVertical,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getUsers, saveUser, addLog } from '@/hooks/useStorage';
import { getUsernameColor, getRankName, type UserType } from '@/types';
import UserProfile from './UserProfile';

interface ControlPanelProps {
  currentUser: UserType;
}

export default function ControlPanel({ currentUser }: ControlPanelProps) {
  const [users, setUsers] = useState<UserType[]>(getUsers());
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [actionType, setActionType] = useState<'warning' | 'reprimand' | 'ban' | 'balls' | 'level' | 'position'>('warning');
  const [actionValue, setActionValue] = useState('');
  const [actionReason, setActionReason] = useState('');
  const [banDays, setBanDays] = useState('1');

  const canManageUsers = currentUser.lvl >= 4;
  const canGiveWarnings = currentUser.lvl >= 2;

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          user.vkId.includes(searchQuery);
      const matchesLevel = levelFilter === 'all' || user.lvl.toString() === levelFilter;
      return matchesSearch && matchesLevel;
    });
  }, [users, searchQuery, levelFilter]);

  const regularUsers = filteredUsers.filter(u => u.lvl === 0);
  const adminUsers = filteredUsers.filter(u => u.lvl > 0);

  const handleAction = () => {
    if (!selectedUser || !actionReason.trim()) return;

    const updatedUser = { ...selectedUser };

    switch (actionType) {
      case 'warning':
        if (!canGiveWarnings) return;
        updatedUser.warnings += 1;
        // Convert 3 warnings to 1 reprimand
        if (updatedUser.warnings >= 3) {
          updatedUser.warnings = 0;
          updatedUser.reprimands += 1;
          addLog({
            id: Date.now().toString(),
            type: 'reprimand',
            userId: updatedUser.id,
            targetId: updatedUser.id,
            description: `3 предупреждения конвертированы в выговор. Причина: ${actionReason}`,
            oldValue: { warnings: 3 },
            newValue: { reprimands: updatedUser.reprimands },
            created_by: currentUser.id,
            created_at: new Date().toISOString(),
          });
        } else {
          addLog({
            id: Date.now().toString(),
            type: 'warning',
            userId: updatedUser.id,
            targetId: updatedUser.id,
            description: `Выдано предупреждение. Причина: ${actionReason}`,
            oldValue: { warnings: updatedUser.warnings - 1 },
            newValue: { warnings: updatedUser.warnings },
            created_by: currentUser.id,
            created_at: new Date().toISOString(),
          });
        }
        break;

      case 'reprimand':
        if (!canGiveWarnings) return;
        updatedUser.reprimands += 1;
        // Reset warnings when reprimand is given
        updatedUser.warnings = 0;
        addLog({
          id: Date.now().toString(),
          type: 'reprimand',
          userId: updatedUser.id,
          targetId: updatedUser.id,
          description: `Выдан выговор. Причина: ${actionReason}`,
          oldValue: { reprimands: updatedUser.reprimands - 1 },
          newValue: { reprimands: updatedUser.reprimands },
          created_by: currentUser.id,
          created_at: new Date().toISOString(),
        });
        break;

      case 'ban':
        if (!canManageUsers) return;
        updatedUser.isBanned = true;
        updatedUser.banReason = actionReason;
        updatedUser.banUntil = new Date(Date.now() + parseInt(banDays) * 24 * 60 * 60 * 1000).toISOString();
        // Reset all stats on ban
        updatedUser.balls = 0;
        updatedUser.position = undefined;
        updatedUser.lvl = 0;
        updatedUser.permissions = [];
        addLog({
          id: Date.now().toString(),
          type: 'ban',
          userId: updatedUser.id,
          targetId: updatedUser.id,
          description: `Пользователь заблокирован на ${banDays} дней. Причина: ${actionReason}`,
          created_by: currentUser.id,
          created_at: new Date().toISOString(),
        });
        break;

      case 'balls':
        if (!canGiveWarnings) return;
        const ballsChange = parseInt(actionValue) || 0;
        updatedUser.balls += ballsChange;
        addLog({
          id: Date.now().toString(),
          type: 'balls',
          userId: updatedUser.id,
          targetId: updatedUser.id,
          description: ballsChange > 0 
            ? `Начислено ${ballsChange} баллов. Причина: ${actionReason}`
            : `Снято ${Math.abs(ballsChange)} баллов. Причина: ${actionReason}`,
          oldValue: { balls: updatedUser.balls - ballsChange },
          newValue: { balls: updatedUser.balls },
          created_by: currentUser.id,
          created_at: new Date().toISOString(),
        });
        break;

      case 'level':
        if (!canManageUsers) return;
        const newLevel = parseInt(actionValue) || 0;
        addLog({
          id: Date.now().toString(),
          type: 'level_change',
          userId: updatedUser.id,
          targetId: updatedUser.id,
          description: `Изменен уровень доступа. Причина: ${actionReason}`,
          oldValue: { lvl: updatedUser.lvl },
          newValue: { lvl: newLevel },
          created_by: currentUser.id,
          created_at: new Date().toISOString(),
        });
        updatedUser.lvl = newLevel;
        break;

      case 'position':
        if (!canManageUsers) return;
        addLog({
          id: Date.now().toString(),
          type: 'position_change',
          userId: updatedUser.id,
          targetId: updatedUser.id,
          description: `Изменена должность на "${actionValue}". Причина: ${actionReason}`,
          oldValue: { position: updatedUser.position },
          newValue: { position: actionValue },
          created_by: currentUser.id,
          created_at: new Date().toISOString(),
        });
        updatedUser.position = actionValue || undefined;
        break;
    }

    saveUser(updatedUser);
    setUsers(getUsers());
    setShowActionDialog(false);
    setActionReason('');
    setActionValue('');
  };

  const handleUnban = (user: UserType) => {
    if (!canManageUsers) return;
    const updatedUser = { ...user, isBanned: false, banReason: undefined, banUntil: undefined };
    saveUser(updatedUser);
    addLog({
      id: Date.now().toString(),
      type: 'unban',
      userId: user.id,
      targetId: user.id,
      description: 'Пользователь разблокирован',
      created_by: currentUser.id,
      created_at: new Date().toISOString(),
    });
    setUsers(getUsers());
  };

  const openActionDialog = (user: UserType, type: typeof actionType) => {
    setSelectedUser(user);
    setActionType(type);
    setShowActionDialog(true);
  };

  const UserCard = ({ user }: { user: UserType }) => (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors group"
    >
      <div className="flex items-center gap-4">
        <div 
          className="relative cursor-pointer"
          onClick={() => {
            setSelectedUser(user);
            setShowUserProfile(true);
          }}
        >
          <img
            src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
            alt={user.username}
            className="w-14 h-14 rounded-2xl object-cover"
          />
          {user.is_online && (
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-950" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 
              className="font-semibold text-white truncate cursor-pointer hover:underline"
              onClick={() => {
                setSelectedUser(user);
                setShowUserProfile(true);
              }}
              style={{ color: getUsernameColor(user.lvl) }}
            >
              {user.username}
            </h3>
            {user.isBanned && (
              <Badge variant="destructive" className="text-xs">Заблокирован</Badge>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Badge 
              variant="secondary" 
              className="text-xs"
              style={{ 
                backgroundColor: `${getUsernameColor(user.lvl)}20`,
                color: getUsernameColor(user.lvl),
              }}
            >
              {getRankName(user.lvl)}
            </Badge>
            {user.position && (
              <span className="text-xs text-slate-400">{user.position}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1 text-amber-400">
            <Trophy className="w-4 h-4" />
            <span>{user.balls}</span>
          </div>
          {user.warnings > 0 && (
            <div className="flex items-center gap-1 text-yellow-400">
              <AlertTriangle className="w-4 h-4" />
              <span>{user.warnings}</span>
            </div>
          )}
          {user.reprimands > 0 && (
            <div className="flex items-center gap-1 text-red-400">
              <Ban className="w-4 h-4" />
              <span>{user.reprimands}</span>
            </div>
          )}
        </div>

        {(canGiveWarnings || canManageUsers) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-slate-900 border-white/10">
              <DropdownMenuItem onClick={() => openActionDialog(user, 'balls')} className="text-amber-400">
                <Trophy className="w-4 h-4 mr-2" />
                Изменить баллы
              </DropdownMenuItem>
              {canGiveWarnings && (
                <>
                  <DropdownMenuItem onClick={() => openActionDialog(user, 'warning')} className="text-yellow-400">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Выдать предупреждение
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => openActionDialog(user, 'reprimand')} className="text-red-400">
                    <Ban className="w-4 h-4 mr-2" />
                    Выдать выговор
                  </DropdownMenuItem>
                </>
              )}
              {canManageUsers && (
                <>
                  <DropdownMenuItem onClick={() => openActionDialog(user, 'level')}>
                    <Shield className="w-4 h-4 mr-2" />
                    Изменить уровень
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => openActionDialog(user, 'position')}>
                    <Star className="w-4 h-4 mr-2" />
                    Изменить должность
                  </DropdownMenuItem>
                  {!user.isBanned ? (
                    <DropdownMenuItem onClick={() => openActionDialog(user, 'ban')} className="text-red-400">
                      <Ban className="w-4 h-4 mr-2" />
                      Заблокировать
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={() => handleUnban(user)} className="text-emerald-400">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Разблокировать
                    </DropdownMenuItem>
                  )}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </motion.div>
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-white/10">
        <div>
          <h1 className="text-2xl font-bold text-white">Управление пользователями</h1>
          <p className="text-slate-400">Всего пользователей: {users.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 border-b border-white/10 space-y-4">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Поиск по имени или VK ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 text-white"
            />
          </div>
          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger className="w-48 bg-white/5 border-white/10 text-white">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Уровень" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-white/10">
              <SelectItem value="all">Все уровни</SelectItem>
              {[0, 1, 2, 3, 4, 5].map(lvl => (
                <SelectItem key={lvl} value={lvl.toString()}>
                  {getRankName(lvl)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 p-4">
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="w-full bg-white/5 border border-white/10 mb-4">
            <TabsTrigger value="all" className="flex-1 data-[state=active]:bg-violet-600">
              Все ({filteredUsers.length})
            </TabsTrigger>
            <TabsTrigger value="admins" className="flex-1 data-[state=active]:bg-violet-600">
              Администрация ({adminUsers.length})
            </TabsTrigger>
            <TabsTrigger value="users" className="flex-1 data-[state=active]:bg-violet-600">
              Пользователи ({regularUsers.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-2">
            {filteredUsers.map(user => (
              <UserCard key={user.id} user={user} />
            ))}
          </TabsContent>

          <TabsContent value="admins" className="space-y-2">
            {adminUsers.map(user => (
              <UserCard key={user.id} user={user} />
            ))}
          </TabsContent>

          <TabsContent value="users" className="space-y-2">
            {regularUsers.map(user => (
              <UserCard key={user.id} user={user} />
            ))}
          </TabsContent>
        </Tabs>
      </ScrollArea>

      {/* User Profile Modal */}
      {showUserProfile && selectedUser && (
        <UserProfile
          user={selectedUser}
          currentUser={currentUser}
          onClose={() => setShowUserProfile(false)}
          onUpdate={(updated) => {
            setUsers(getUsers());
            setSelectedUser(updated);
          }}
        />
      )}

      {/* Action Dialog */}
      <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <DialogContent className="bg-slate-950 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>
              {actionType === 'warning' && 'Выдать предупреждение'}
              {actionType === 'reprimand' && 'Выдать выговор'}
              {actionType === 'ban' && 'Заблокировать пользователя'}
              {actionType === 'balls' && 'Изменить баллы'}
              {actionType === 'level' && 'Изменить уровень'}
              {actionType === 'position' && 'Изменить должность'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <p className="text-slate-400">
              Пользователь: <span className="text-white font-medium">{selectedUser?.username}</span>
            </p>

            {actionType === 'balls' && (
              <Input
                type="number"
                placeholder="Количество баллов (+/-)"
                value={actionValue}
                onChange={(e) => setActionValue(e.target.value)}
                className="bg-white/5 border-white/10 text-white"
              />
            )}

            {actionType === 'level' && (
              <Select value={actionValue} onValueChange={setActionValue}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Выберите уровень" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/10">
                  {[0, 1, 2, 3, 4, 5].map(lvl => (
                    <SelectItem key={lvl} value={lvl.toString()}>
                      {getRankName(lvl)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {actionType === 'position' && (
              <Input
                placeholder="Новая должность"
                value={actionValue}
                onChange={(e) => setActionValue(e.target.value)}
                className="bg-white/5 border-white/10 text-white"
              />
            )}

            {actionType === 'ban' && (
              <Input
                type="number"
                placeholder="Количество дней"
                value={banDays}
                onChange={(e) => setBanDays(e.target.value)}
                className="bg-white/5 border-white/10 text-white"
              />
            )}

            <Input
              placeholder="Причина..."
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              className="bg-white/5 border-white/10 text-white"
            />

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowActionDialog(false)}
                className="flex-1 border-white/10"
              >
                Отмена
              </Button>
              <Button
                onClick={handleAction}
                disabled={!actionReason.trim() || (actionType === 'balls' && !actionValue)}
                className="flex-1 bg-violet-600 hover:bg-violet-500"
              >
                Применить
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
