import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  Camera,
  Shield,
  Trophy,
  Sparkles,
  AlertTriangle,
  Ban,
  Clock,
  CheckCircle,
  MessageCircle,
  Settings,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getRankName, getUsernameColor, type UserType } from '@/types';
import { saveUser, setCurrentUser, addLog } from '@/hooks/useStorage';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface UserProfileProps {
  user: UserType;
  currentUser: UserType;
  onClose: () => void;
  onUpdate: (user: UserType) => void;
}

export default function UserProfile({ user, currentUser, onClose, onUpdate }: UserProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState(user);
  const [activeTab, setActiveTab] = useState('info');
  const [showSettings, setShowSettings] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const isOwner = currentUser.lvl === 5;
  const isSelf = user.id === currentUser.id;
  const canEdit = isOwner || (isSelf && user.lvl < 5);

  const handleSave = () => {
    saveUser(editedUser);
    onUpdate(editedUser);
    if (isSelf) {
      setCurrentUser(editedUser);
    }
    setIsEditing(false);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newAvatar = event.target?.result as string;
        setEditedUser({ ...editedUser, avatar: newAvatar });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newBanner = event.target?.result as string;
        setEditedUser({ ...editedUser, banner: newBanner });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleToggleGhostMode = () => {
    if (!isOwner) return;
    const updated = { ...user, ghostMode: !user.ghostMode };
    saveUser(updated);
    onUpdate(updated);
    addLog({
      id: Date.now().toString(),
      type: 'other',
      userId: user.id,
      description: `Режим призрака ${updated.ghostMode ? 'включен' : 'выключен'}`,
      created_by: currentUser.id,
      created_at: new Date().toISOString(),
    });
  };

  const handleToggleMessages = () => {
    if (!isOwner) return;
    const updated = { ...user, messagesClosed: !user.messagesClosed };
    saveUser(updated);
    onUpdate(updated);
    addLog({
      id: Date.now().toString(),
      type: 'other',
      userId: user.id,
      description: `Личные сообщения ${updated.messagesClosed ? 'закрыты' : 'открыты'}`,
      created_by: currentUser.id,
      created_at: new Date().toISOString(),
    });
  };

  const rating = user.balls - user.warnings * 15 - user.reprimands * 30;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-3xl bg-slate-950 border border-white/10 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Banner */}
        <div className="relative h-40 overflow-hidden">
          <img
            src={editedUser.banner || 'https://images.unsplash.com/photo-1557683316-973673baf926?w=1200'}
            alt="Banner"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
          
          {canEdit && (
            <button
              onClick={() => bannerInputRef.current?.click()}
              className="absolute top-4 right-4 p-2 rounded-xl bg-black/50 hover:bg-black/70 text-white transition-colors"
            >
              <Camera className="w-4 h-4" />
            </button>
          )}
          <input
            ref={bannerInputRef}
            type="file"
            accept="image/*"
            onChange={handleBannerChange}
            className="hidden"
          />

          <button
            onClick={onClose}
            className="absolute top-4 left-4 p-2 rounded-xl bg-black/50 hover:bg-black/70 text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="relative px-6 pb-6">
          {/* Avatar */}
          <div className="relative -mt-16 mb-4 flex justify-between items-end">
            <div className="relative">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="w-32 h-32 rounded-3xl overflow-hidden border-4 border-slate-950 shadow-xl"
              >
                <img
                  src={editedUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${editedUser.username}`}
                  alt={editedUser.username}
                  className="w-full h-full object-cover"
                />
              </motion.div>
              {canEdit && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-2 -right-2 p-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white shadow-lg transition-colors"
                >
                  <Camera className="w-4 h-4" />
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
              {user.is_online && (
                <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-4 border-slate-950" />
              )}
            </div>

            <div className="flex gap-2 mb-2">
              {canEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                  className="border-white/10 hover:bg-white/5"
                >
                  {isEditing ? 'Отмена' : 'Редактировать'}
                </Button>
              )}
              {isOwner && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSettings(true)}
                  className="border-white/10 hover:bg-white/5"
                >
                  <Settings className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          {/* User info */}
          <div className="mb-6">
            {isEditing ? (
              <div className="space-y-3">
                <Input
                  value={editedUser.username}
                  onChange={(e) => setEditedUser({ ...editedUser, username: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                  placeholder="Имя пользователя"
                />
                <Input
                  value={editedUser.position || ''}
                  onChange={(e) => setEditedUser({ ...editedUser, position: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                  placeholder="Должность"
                />
                <div className="flex gap-2">
                  <Button onClick={handleSave} className="bg-violet-600 hover:bg-violet-500">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Сохранить
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <h2 
                  className="text-2xl font-bold"
                  style={{ color: getUsernameColor(user.lvl) }}
                >
                  {user.username}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <Badge 
                    variant="secondary"
                    className="text-xs"
                    style={{ 
                      backgroundColor: `${getUsernameColor(user.lvl)}20`,
                      color: getUsernameColor(user.lvl),
                      borderColor: getUsernameColor(user.lvl),
                    }}
                  >
                    {getRankName(user.lvl)}
                  </Badge>
                  {user.position && (
                    <Badge variant="outline" className="text-xs border-white/20 text-slate-400">
                      {user.position}
                    </Badge>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full bg-white/5 border border-white/10 mb-4">
              <TabsTrigger value="info" className="flex-1 data-[state=active]:bg-violet-600">
                Информация
              </TabsTrigger>
              <TabsTrigger value="stats" className="flex-1 data-[state=active]:bg-violet-600">
                Статистика
              </TabsTrigger>
              <TabsTrigger value="permissions" className="flex-1 data-[state=active]:bg-violet-600">
                Разрешения
              </TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-xl bg-violet-500/20">
                      <Trophy className="w-4 h-4 text-violet-400" />
                    </div>
                    <span className="text-slate-400 text-sm">Уровень</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{user.lvl}</p>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-xl bg-amber-500/20">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                    </div>
                    <span className="text-slate-400 text-sm">Баллы</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{user.balls}</p>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-xl bg-yellow-500/20">
                      <AlertTriangle className="w-4 h-4 text-yellow-400" />
                    </div>
                    <span className="text-slate-400 text-sm">Предупреждения</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{user.warnings}</p>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-xl bg-red-500/20">
                      <Ban className="w-4 h-4 text-red-400" />
                    </div>
                    <span className="text-slate-400 text-sm">Выговоры</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{user.reprimands}</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-emerald-500/20">
                      <Clock className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">Последний вход</p>
                      <p className="text-white">
                        {new Date(user.last_seen).toLocaleString('ru-RU')}
                      </p>
                    </div>
                  </div>
                  {user.is_online && (
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                      Онлайн
                    </Badge>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="stats" className="space-y-4">
              <div className="p-6 rounded-2xl bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 border border-violet-500/20">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-slate-400">Рейтинг</span>
                  <Trophy className="w-5 h-5 text-violet-400" />
                </div>
                <p className="text-4xl font-bold text-white">{rating}</p>
                <p className="text-sm text-slate-400 mt-2">
                  {user.balls} баллов - {user.warnings * 15} за предупреждения - {user.reprimands * 30} за выговоры
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
                  <p className="text-2xl font-bold text-emerald-400">+{user.balls}</p>
                  <p className="text-xs text-slate-400 mt-1">За баллы</p>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
                  <p className="text-2xl font-bold text-yellow-400">-{user.warnings * 15}</p>
                  <p className="text-xs text-slate-400 mt-1">За предупреждения</p>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
                  <p className="text-2xl font-bold text-red-400">-{user.reprimands * 30}</p>
                  <p className="text-xs text-slate-400 mt-1">За выговоры</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="permissions" className="space-y-4">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-violet-400" />
                  Доступы и возможности
                </h3>
                <div className="space-y-2">
                  {user.lvl >= 1 && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                      <span className="text-white">Просмотр пользователей</span>
                    </div>
                  )}
                  {user.lvl >= 2 && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                      <span className="text-white">Управление предупреждениями</span>
                    </div>
                  )}
                  {user.lvl >= 3 && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                      <span className="text-white">Ответы на тикеты</span>
                    </div>
                  )}
                  {user.lvl >= 4 && (
                    <>
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                        <span className="text-white">Управление пользователями</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                        <span className="text-white">Просмотр логов</span>
                      </div>
                    </>
                  )}
                  {user.lvl >= 5 && (
                    <>
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-violet-500/10 border border-violet-500/20">
                        <CheckCircle className="w-5 h-5 text-violet-400" />
                        <span className="text-white">Полный доступ к системе</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-violet-500/10 border border-violet-500/20">
                        <CheckCircle className="w-5 h-5 text-violet-400" />
                        <span className="text-white">Управление магазином</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {user.permissions.length > 0 && (
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <h3 className="text-sm font-medium text-slate-400 mb-3">Дополнительные разрешения</h3>
                  <div className="flex flex-wrap gap-2">
                    {user.permissions.map((perm: string, idx: number) => (
                      <Badge key={idx} variant="outline" className="border-white/20 text-slate-300">
                        {perm}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </motion.div>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="bg-slate-950 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Настройки пользователя
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
              <div className="flex items-center gap-3">
                {user.ghostMode ? <EyeOff className="w-5 h-5 text-slate-400" /> : <Eye className="w-5 h-5 text-slate-400" />}
                <div>
                  <p className="font-medium">Режим призрака</p>
                  <p className="text-sm text-slate-400">Скрыть статус онлайн</p>
                </div>
              </div>
              <Switch
                checked={user.ghostMode}
                onCheckedChange={handleToggleGhostMode}
              />
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
              <div className="flex items-center gap-3">
                <MessageCircle className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="font-medium">Личные сообщения</p>
                  <p className="text-sm text-slate-400">Разрешить писать в ЛС</p>
                </div>
              </div>
              <Switch
                checked={!user.messagesClosed}
                onCheckedChange={handleToggleMessages}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
