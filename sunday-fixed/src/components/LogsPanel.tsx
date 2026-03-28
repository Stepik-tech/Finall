import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ScrollText,
  Search,
  Filter,
  Trophy,
  AlertTriangle,
  Ban,
  Shield,
  Star,
  ShoppingBag,
  User,
  Clock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getLogs, getUserById } from '@/hooks/useStorage';
import type { Log, UserType } from '@/types';

interface LogsPanelProps {
  currentUser: UserType;
}

export default function LogsPanel({}: LogsPanelProps) {
  const [logs, setLogs] = useState<Log[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [userFilter, setUserFilter] = useState('');
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());

  useEffect(() => {
    setLogs(getLogs());
    const interval = setInterval(() => {
      setLogs(getLogs());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || log.type === typeFilter;
    const matchesUser = !userFilter || 
      getUserById(log.userId)?.username.toLowerCase().includes(userFilter.toLowerCase());
    return matchesSearch && matchesType && matchesUser;
  });

  const toggleLog = (logId: string) => {
    const newExpanded = new Set(expandedLogs);
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId);
    } else {
      newExpanded.add(logId);
    }
    setExpandedLogs(newExpanded);
  };

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'balls': return <Trophy className="w-4 h-4 text-amber-400" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case 'reprimand': return <Ban className="w-4 h-4 text-red-400" />;
      case 'ban': return <Ban className="w-4 h-4 text-red-500" />;
      case 'unban': return <Shield className="w-4 h-4 text-emerald-400" />;
      case 'level_change': return <Star className="w-4 h-4 text-violet-400" />;
      case 'position_change': return <User className="w-4 h-4 text-blue-400" />;
      case 'purchase': return <ShoppingBag className="w-4 h-4 text-cyan-400" />;
      default: return <ScrollText className="w-4 h-4 text-slate-400" />;
    }
  };

  const getLogTypeLabel = (type: string) => {
    switch (type) {
      case 'balls': return 'Баллы';
      case 'warning': return 'Предупреждение';
      case 'reprimand': return 'Выговор';
      case 'ban': return 'Блокировка';
      case 'unban': return 'Разблокировка';
      case 'level_change': return 'Уровень';
      case 'position_change': return 'Должность';
      case 'purchase': return 'Покупка';
      default: return 'Другое';
    }
  };

  const getLogTypeColor = (type: string) => {
    switch (type) {
      case 'balls': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'warning': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'reprimand': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'ban': return 'bg-red-600/20 text-red-500 border-red-600/30';
      case 'unban': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'level_change': return 'bg-violet-500/20 text-violet-400 border-violet-500/30';
      case 'position_change': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'purchase': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Логи действий</h1>
            <p className="text-slate-400">Всего записей: {logs.length}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Поиск по описанию..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 text-white"
            />
          </div>
          <div className="relative w-48">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Пользователь..."
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 text-white"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40 bg-white/5 border-white/10 text-white">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Тип" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-white/10">
              <SelectItem value="all">Все типы</SelectItem>
              <SelectItem value="balls">Баллы</SelectItem>
              <SelectItem value="warning">Предупреждения</SelectItem>
              <SelectItem value="reprimand">Выговоры</SelectItem>
              <SelectItem value="ban">Блокировки</SelectItem>
              <SelectItem value="unban">Разблокировки</SelectItem>
              <SelectItem value="level_change">Уровни</SelectItem>
              <SelectItem value="position_change">Должности</SelectItem>
              <SelectItem value="purchase">Покупки</SelectItem>
              <SelectItem value="other">Другое</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-2">
          {filteredLogs.map((log) => {
            const user = getUserById(log.userId);
            const creator = getUserById(log.created_by);
            const isExpanded = expandedLogs.has(log.id);

            return (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-xl bg-white/5">
                    {getLogIcon(log.type)}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className={getLogTypeColor(log.type)}>
                        {getLogTypeLabel(log.type)}
                      </Badge>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(log.created_at).toLocaleString('ru-RU')}
                      </span>
                    </div>

                    <p className="text-white">{log.description}</p>

                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">Пользователь:</span>
                        <div className="flex items-center gap-1">
                          <img
                            src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`}
                            alt=""
                            className="w-5 h-5 rounded-full"
                          />
                          <span className="text-violet-400">{user?.username || 'Unknown'}</span>
                        </div>
                      </div>

                      {creator && (
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400">Действие:</span>
                          <div className="flex items-center gap-1">
                            <img
                              src={creator.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${creator.username}`}
                              alt=""
                              className="w-5 h-5 rounded-full"
                            />
                            <span className="text-emerald-400">{creator.username}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Show old/new values if available */}
                    {(log.oldValue !== undefined || log.newValue !== undefined) && (
                      <button
                        onClick={() => toggleLog(log.id)}
                        className="flex items-center gap-1 mt-2 text-sm text-slate-400 hover:text-white transition-colors"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        Подробности
                      </button>
                    )}

                    {isExpanded && (log.oldValue !== undefined || log.newValue !== undefined) && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-3 p-3 rounded-xl bg-white/5"
                      >
                        <p className="text-slate-400 text-sm">Данные изменены</p>
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}

          {filteredLogs.length === 0 && (
            <div className="text-center py-12">
              <ScrollText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">Логи не найдены</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
