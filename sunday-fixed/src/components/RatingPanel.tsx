import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Trophy,
  Medal,
  Crown,
  Star,
  TrendingDown,
  Users,
  Shield,
  Sparkles,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getUsers } from '@/hooks/useStorage';
import { getUsernameColor, getRankName, type UserType } from '@/types';

interface RatingPanelProps {
  currentUser: UserType;
}

export default function RatingPanel({ currentUser }: RatingPanelProps) {
  const [users, setUsers] = useState<UserType[]>([]);

  useEffect(() => {
    setUsers(getUsers());
  }, []);

  // Calculate rating for each user
  const usersWithRating = users.map(user => ({
    ...user,
    rating: user.balls - user.warnings * 15 - user.reprimands * 30,
  }));

  // Sort by rating
  const sortedUsers = [...usersWithRating].sort((a, b) => b.rating - a.rating);

  // Top 3
  const top3 = sortedUsers.slice(0, 3);

  // Regular users (lvl 0)
  const regularUsers = sortedUsers.filter(u => u.lvl === 0);

  // Admins (lvl > 0)
  const admins = sortedUsers.filter(u => u.lvl > 0);

  // Current user position
  const userPosition = sortedUsers.findIndex(u => u.id === currentUser.id) + 1;

  const RatingCard = ({ user, position, showPosition = true }: { user: UserType & { rating: number }; position: number; showPosition?: boolean }) => (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`p-4 rounded-2xl border transition-colors ${
        user.id === currentUser.id 
          ? 'bg-violet-500/10 border-violet-500/30' 
          : 'bg-white/5 border-white/10 hover:border-white/20'
      }`}
    >
      <div className="flex items-center gap-4">
        {showPosition && (
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${
            position === 1 ? 'bg-yellow-500/20 text-yellow-400' :
            position === 2 ? 'bg-slate-400/20 text-slate-300' :
            position === 3 ? 'bg-amber-600/20 text-amber-500' :
            'bg-white/5 text-slate-400'
          }`}>
            {position <= 3 ? (
              position === 1 ? <Crown className="w-5 h-5" /> :
              position === 2 ? <Medal className="w-5 h-5" /> :
              <Star className="w-5 h-5" />
            ) : position}
          </div>
        )}

        <div className="relative">
          <img
            src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
            alt={user.username}
            className="w-14 h-14 rounded-2xl object-cover"
          />
          {user.is_online && (
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-950" />
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 
              className="font-semibold"
              style={{ color: getUsernameColor(user.lvl) }}
            >
              {user.username}
            </h3>
            {user.id === currentUser.id && (
              <Badge variant="secondary" className="text-xs bg-violet-500/20 text-violet-400">
                Вы
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Badge 
              variant="outline" 
              className="text-xs"
              style={{ 
                borderColor: getUsernameColor(user.lvl),
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

        <div className="text-right">
          <div className="flex items-center gap-1 justify-end">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="text-xl font-bold text-white">{user.rating}</span>
          </div>
          <p className="text-xs text-slate-400">рейтинг</p>
        </div>
      </div>

      {/* Stats breakdown */}
      <div className="mt-3 pt-3 border-t border-white/10 flex gap-4 text-sm">
        <div className="flex items-center gap-1 text-emerald-400">
          <Sparkles className="w-3 h-3" />
          <span>+{user.balls}</span>
        </div>
        {user.warnings > 0 && (
          <div className="flex items-center gap-1 text-yellow-400">
            <TrendingDown className="w-3 h-3" />
            <span>-{user.warnings * 15}</span>
          </div>
        )}
        {user.reprimands > 0 && (
          <div className="flex items-center gap-1 text-red-400">
            <TrendingDown className="w-3 h-3" />
            <span>-{user.reprimands * 30}</span>
          </div>
        )}
      </div>
    </motion.div>
  );

  const Top3Card = ({ user, position }: { user: UserType & { rating: number }; position: number }) => {
    const colors = [
      'from-yellow-500/20 to-amber-500/20 border-yellow-500/30',
      'from-slate-400/20 to-slate-300/20 border-slate-400/30',
      'from-amber-600/20 to-orange-500/20 border-amber-600/30',
    ];
    
    const icons = [
      <Crown className="w-8 h-8 text-yellow-400" />,
      <Medal className="w-8 h-8 text-slate-300" />,
      <Star className="w-8 h-8 text-amber-500" />,
    ];

    const prizes = [40, 25, 15];

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: position * 0.1 }}
        className={`relative p-6 rounded-3xl bg-gradient-to-br ${colors[position - 1]} border text-center`}
      >
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-slate-950 border-2 border-current flex items-center justify-center"
          style={{ borderColor: position === 1 ? '#EAB308' : position === 2 ? '#CBD5E1' : '#D97706' }}
        >
          {icons[position - 1]}
        </div>
        
        <div className="mt-6">
          <img
            src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
            alt={user.username}
            className="w-20 h-20 rounded-2xl mx-auto mb-3 object-cover"
          />
          <h3 
            className="font-bold text-lg"
            style={{ color: getUsernameColor(user.lvl) }}
          >
            {user.username}
          </h3>
          <p className="text-3xl font-bold text-white mt-2">{user.rating}</p>
          <p className="text-sm text-slate-400">рейтинг</p>
          
          <div className="mt-4 p-2 rounded-xl bg-white/5">
            <p className="text-sm text-emerald-400 font-semibold">+{prizes[position - 1]} баллов</p>
            <p className="text-xs text-slate-400">призовые</p>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Рейтинг</h1>
            <p className="text-slate-400">Всего пользователей: {users.length}</p>
          </div>
          {userPosition > 0 && (
            <div className="text-right">
              <p className="text-slate-400 text-sm">Ваша позиция</p>
              <p className="text-3xl font-bold text-violet-400">#{userPosition}</p>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 p-4">
        {/* Top 3 */}
        {top3.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              Топ-3 победителя
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {top3.map((user, idx) => (
                <Top3Card key={user.id} user={user} position={idx + 1} />
              ))}
            </div>
          </div>
        )}

        {/* Rating Lists */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="w-full bg-white/5 border border-white/10 mb-4">
            <TabsTrigger value="all" className="flex-1 data-[state=active]:bg-violet-600">
              <Users className="w-4 h-4 mr-2" />
              Все ({sortedUsers.length})
            </TabsTrigger>
            <TabsTrigger value="admins" className="flex-1 data-[state=active]:bg-violet-600">
              <Shield className="w-4 h-4 mr-2" />
              Администрация ({admins.length})
            </TabsTrigger>
            <TabsTrigger value="users" className="flex-1 data-[state=active]:bg-violet-600">
              <Users className="w-4 h-4 mr-2" />
              Пользователи ({regularUsers.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-2">
            {sortedUsers.map((user, idx) => (
              <RatingCard key={user.id} user={user} position={idx + 1} />
            ))}
          </TabsContent>

          <TabsContent value="admins" className="space-y-2">
            {admins.map((user, idx) => (
              <RatingCard key={user.id} user={user} position={idx + 1} />
            ))}
          </TabsContent>

          <TabsContent value="users" className="space-y-2">
            {regularUsers.map((user, idx) => (
              <RatingCard key={user.id} user={user} position={idx + 1} />
            ))}
          </TabsContent>
        </Tabs>

        {/* Rating Rules */}
        <div className="mt-8 p-6 rounded-2xl bg-white/5 border border-white/10">
          <h3 className="font-semibold text-white mb-4">Как начисляется рейтинг</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                <span className="font-medium text-emerald-400">Баллы</span>
              </div>
              <p className="text-sm text-slate-400">+1 балл рейтинга за каждый полученный балл</p>
            </div>
            <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-5 h-5 text-yellow-400" />
                <span className="font-medium text-yellow-400">Предупреждения</span>
              </div>
              <p className="text-sm text-slate-400">-15 баллов рейтинга за каждое предупреждение</p>
            </div>
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-5 h-5 text-red-400" />
                <span className="font-medium text-red-400">Выговоры</span>
              </div>
              <p className="text-sm text-slate-400">-30 баллов рейтинга за каждый выговор</p>
            </div>
          </div>
          
          <div className="mt-4 p-4 rounded-xl bg-violet-500/10 border border-violet-500/20">
            <h4 className="font-medium text-violet-400 mb-2">Призовые баллы за места</h4>
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-yellow-400" />
                <span className="text-white">1 место: <span className="text-emerald-400">+40 баллов</span></span>
              </div>
              <div className="flex items-center gap-2">
                <Medal className="w-5 h-5 text-slate-300" />
                <span className="text-white">2 место: <span className="text-emerald-400">+25 баллов</span></span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500" />
                <span className="text-white">3 место: <span className="text-emerald-400">+15 баллов</span></span>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
