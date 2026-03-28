import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  MessageCircle,
  Ticket,
  ScrollText,
  Trophy,
  Shield,
  LogOut,
  Menu,
  Sparkles,
  ShoppingBag,
  Mail,
  Crown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import AuthPanel from '@/components/AuthPanel';
import UserProfile from '@/components/UserProfile';
import NotificationBell from '@/components/NotificationBell';
import OwnerPanel from '@/components/OwnerPanel';
import TicketsPanel from '@/components/TicketsPanel';
import GroupsPanel from '@/components/GroupsPanel';
import RatingPanel from '@/components/RatingPanel';
import LogsPanel from '@/components/LogsPanel';
import ControlPanel from '@/components/ControlPanel';
import ShopPanel from '@/components/ShopPanel';
import MessagesPanel from '@/components/MessagesPanel';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { ThemeProvider } from '@/hooks/useTheme';
import type { UserType } from '@/types';
import { getRankName, canAccess, getUsernameColor } from '@/types';
import { getUsers, initDatabase, saveUser, setCurrentUser } from '@/hooks/useStorage';
import './App.css';

type TabType = 'dashboard' | 'users' | 'groups' | 'tickets' | 'logs' | 'control' | 'rating' | 'owner' | 'shop' | 'messages';

interface NavItem {
  id: TabType;
  label: string;
  icon: React.ElementType;
  minLevel: number;
}

// Dashboard View
function DashboardView({ users, currentUser, onNavigate }: { 
  users: UserType[]; 
  currentUser: UserType | null; 
  onNavigate: (tab: TabType) => void;
}) {
  const onlineUsers = users.filter(u => u.is_online);
  const recentUsers = [...users].sort((a, b) => 
    new Date(b.last_seen).getTime() - new Date(a.last_seen).getTime()
  ).slice(0, 5);

  const stats = [
    { label: 'Всего', value: users.length, icon: Users, color: 'from-violet-500 to-fuchsia-500', onClick: () => onNavigate('users') },
    { label: 'Онлайн', value: onlineUsers.length, icon: Users, color: 'from-emerald-500 to-green-500', onClick: () => {} },
    { label: 'Уровень', value: currentUser?.lvl || 0, icon: Trophy, color: 'from-amber-500 to-orange-500', onClick: () => onNavigate('rating') },
    { label: 'Баллы', value: currentUser?.balls || 0, icon: Sparkles, color: 'from-cyan-500 to-blue-500', onClick: () => onNavigate('shop') },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-3xl border"
        style={{ 
          background: 'linear-gradient(135deg, hsl(var(--primary) / 0.2), hsl(var(--accent) / 0.1), transparent)',
          borderColor: 'hsl(var(--primary) / 0.2)'
        }}
      >
        <h2 className="text-2xl font-bold mb-2" style={{ color: 'hsl(var(--foreground))' }}>
          Добро пожаловать, {currentUser?.username}!
        </h2>
        <p style={{ color: 'hsl(var(--muted-foreground))' }}>
          Вы вошли как <span style={{ color: getUsernameColor(currentUser?.lvl || 0) }}>{getRankName(currentUser?.lvl || 0)}</span>
        </p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <motion.button
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            onClick={stat.onClick}
            className="p-6 rounded-2xl text-left group stat-card"
            style={{
              background: 'hsl(var(--card) / 0.5)',
              border: '1px solid hsl(var(--border))'
            }}
          >
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
              <stat.icon className="w-6 h-6 text-white" />
            </div>
            <p className="text-3xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>{stat.value}</p>
            <p style={{ color: 'hsl(var(--muted-foreground))' }}>{stat.label}</p>
          </motion.button>
        ))}
      </div>

      {/* Recent Users */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="p-6 rounded-2xl"
          style={{
            background: 'hsl(var(--card) / 0.5)',
            border: '1px solid hsl(var(--border))'
          }}
        >
          <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'hsl(var(--foreground))' }}>
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            Пользователи онлайн
          </h3>
          <div className="space-y-3">
            {onlineUsers.slice(0, 5).map(user => (
              <div key={user.id} className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
                    alt={user.username}
                    className="w-10 h-10 rounded-xl object-cover"
                  />
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2" style={{ borderColor: 'hsl(var(--background))' }} />
                </div>
                <div>
                  <p className="font-medium" style={{ color: getUsernameColor(user.lvl) }}>
                    {user.username}
                  </p>
                  <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{getRankName(user.lvl)}</p>
                </div>
              </div>
            ))}
            {onlineUsers.length === 0 && (
              <p className="text-center py-4" style={{ color: 'hsl(var(--muted-foreground))' }}>Нет пользователей онлайн</p>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="p-6 rounded-2xl"
          style={{
            background: 'hsl(var(--card) / 0.5)',
            border: '1px solid hsl(var(--border))'
          }}
        >
          <h3 className="font-semibold mb-4" style={{ color: 'hsl(var(--foreground))' }}>Недавние пользователи</h3>
          <div className="space-y-3">
            {recentUsers.map(user => (
              <div key={user.id} className="flex items-center gap-3">
                <img
                  src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
                  alt={user.username}
                  className="w-10 h-10 rounded-xl object-cover"
                />
                <div className="flex-1">
                  <p className="font-medium" style={{ color: getUsernameColor(user.lvl) }}>
                    {user.username}
                  </p>
                  <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    {new Date(user.last_seen).toLocaleString('ru-RU')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// Main App Content Component
function AppContent() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUserState] = useState<UserType | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [users, setUsers] = useState<UserType[]>([]);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Initialize database
  useEffect(() => {
    initDatabase();
    setUsers(getUsers());
  }, []);

  // Check for existing session
  useEffect(() => {
    const stored = localStorage.getItem('sunday_app_current_user');
    if (stored) {
      try {
        const user = JSON.parse(stored);
        setCurrentUserState(user);
        setIsAuthenticated(true);
      } catch {
        localStorage.removeItem('sunday_app_current_user');
      }
    }
  }, []);

  // Sync users
  useEffect(() => {
    const handleUpdate = () => {
      setUsers(getUsers());
      const stored = localStorage.getItem('sunday_app_current_user');
      if (stored) {
        setCurrentUserState(JSON.parse(stored));
      }
    };

    window.addEventListener('sunday_app_update', handleUpdate);
    const interval = setInterval(() => setUsers(getUsers()), 1000);
    
    return () => {
      window.removeEventListener('sunday_app_update', handleUpdate);
      clearInterval(interval);
    };
  }, []);

  const handleAuth = (user: UserType) => {
    setCurrentUserState(user);
    setIsAuthenticated(true);
    setUsers(getUsers());
  };

  const handleLogout = () => {
    if (currentUser) {
      const updated = { ...currentUser, is_online: false, last_seen: new Date().toISOString() };
      saveUser(updated);
    }
    setCurrentUser(null);
    setCurrentUserState(null);
    setIsAuthenticated(false);
  };

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Главная', icon: LayoutDashboard, minLevel: 0 },
    { id: 'users', label: 'Пользователи', icon: Users, minLevel: 1 },
    { id: 'groups', label: 'Группы', icon: MessageCircle, minLevel: 0 },
    { id: 'messages', label: 'Сообщения', icon: Mail, minLevel: 0 },
    { id: 'tickets', label: 'Тикеты', icon: Ticket, minLevel: 0 },
    { id: 'rating', label: 'Рейтинг', icon: Trophy, minLevel: 0 },
    { id: 'shop', label: 'Магазин', icon: ShoppingBag, minLevel: 0 },
    { id: 'logs', label: 'Логи', icon: ScrollText, minLevel: 4 },
    { id: 'control', label: 'Управление', icon: Shield, minLevel: 4 },
    { id: 'owner', label: 'Владелец', icon: Crown, minLevel: 5 },
  ];

  const visibleNavItems = navItems.filter(item => canAccess(currentUser?.lvl || 0, item.minLevel));

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView users={users} currentUser={currentUser} onNavigate={setActiveTab} />;
      case 'users':
        return currentUser ? <ControlPanel currentUser={currentUser} /> : null;
      case 'groups':
        return currentUser ? <GroupsPanel currentUser={currentUser} /> : null;
      case 'messages':
        return currentUser ? <MessagesPanel currentUser={currentUser} /> : null;
      case 'tickets':
        return currentUser ? <TicketsPanel currentUser={currentUser} /> : null;
      case 'rating':
        return currentUser ? <RatingPanel currentUser={currentUser} /> : null;
      case 'shop':
        return currentUser ? <ShopPanel currentUser={currentUser} /> : null;
      case 'logs':
        return currentUser ? <LogsPanel currentUser={currentUser} /> : null;
      case 'control':
        return currentUser ? <ControlPanel currentUser={currentUser} /> : null;
      case 'owner':
        return currentUser ? <OwnerPanel currentUser={currentUser} /> : null;
      default:
        return <DashboardView users={users} currentUser={currentUser} onNavigate={setActiveTab} />;
    }
  };

  if (!isAuthenticated) {
    return <AuthPanel onAuth={handleAuth} />;
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b" style={{ borderColor: 'hsl(var(--border))' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-orange-400 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold" style={{ color: 'hsl(var(--foreground))' }}>Sunday App</h1>
            <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>2026 Edition</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 p-4">
        <nav className="space-y-1">
          {visibleNavItems.map((item) => (
            <TooltipProvider key={item.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all nav-item ${
                      activeTab === item.id
                        ? 'active'
                        : ''
                    }`}
                    style={{
                      color: activeTab === item.id ? 'hsl(var(--primary-foreground))' : 'hsl(var(--muted-foreground))',
                      background: activeTab === item.id ? 'hsl(var(--primary))' : 'transparent'
                    }}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{item.label}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </nav>
      </ScrollArea>

      {/* User */}
      <div className="p-4 border-t" style={{ borderColor: 'hsl(var(--border))' }}>
        <button
          onClick={() => setShowUserProfile(true)}
          className="w-full flex items-center gap-3 p-3 rounded-xl transition-colors user-card"
          style={{
            background: 'hsl(var(--muted) / 0.5)'
          }}
        >
          <img
            src={currentUser?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.username}`}
            alt={currentUser?.username}
            className="w-10 h-10 rounded-xl object-cover"
          />
          <div className="flex-1 text-left">
            <p className="font-medium truncate" style={{ color: 'hsl(var(--foreground))' }}>{currentUser?.username}</p>
            <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{getRankName(currentUser?.lvl || 0)}</p>
          </div>
        </button>
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full mt-2 logout-btn"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Выйти
        </Button>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex" style={{ background: 'hsl(var(--background))' }}>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-72 flex-col border-r" style={{ borderColor: 'hsl(var(--border))', background: 'hsl(var(--sidebar-background))' }}>
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="left" className="w-72 p-0" style={{ background: 'hsl(var(--sidebar-background))', borderColor: 'hsl(var(--border))' }}>
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 border-b flex items-center justify-between px-6" style={{ borderColor: 'hsl(var(--border))', background: 'hsl(var(--background))' }}>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden"
              style={{ color: 'hsl(var(--foreground))' }}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <h2 className="text-xl font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
              {navItems.find(n => n.id === activeTab)?.label}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <ThemeSwitcher />
            {currentUser && <NotificationBell currentUser={currentUser} />}
          </div>
        </header>

        {/* Content */}
        <ScrollArea className="flex-1 p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </ScrollArea>
      </main>

      {/* User Profile Modal */}
      <AnimatePresence>
        {showUserProfile && currentUser && (
          <UserProfile
            user={currentUser}
            currentUser={currentUser}
            onClose={() => setShowUserProfile(false)}
            onUpdate={(updated) => {
              setCurrentUserState(updated);
              setUsers(getUsers());
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Main App Component with ThemeProvider
function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
