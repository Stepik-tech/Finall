import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Shield, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getUserByVkId, saveUser, setCurrentUser, initDatabase, getUsers } from '@/hooks/useStorage';
import type { UserType } from '@/types';

interface AuthPanelProps {
  onAuth: (user: UserType) => void;
}

export default function AuthPanel({ onAuth }: AuthPanelProps) {
  const [vkId, setVkId] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'vk' | 'register' | 'login'>('vk');

  useEffect(() => {
    initDatabase();
  }, []);

  // Validate VK ID
  const validateVkId = async (id: string): Promise<boolean> => {
    // Check if VK ID is numeric and valid
    const numericId = parseInt(id);
    if (isNaN(numericId) || numericId <= 0) {
      return false;
    }
    // In real app, this would check VK API
    // For demo, we accept any numeric ID
    return true;
  };

  const handleVkSubmit = async () => {
    setError('');
    setIsLoading(true);

    const isValid = await validateVkId(vkId);
    if (!isValid) {
      setError('Неверный VK ID. Введите корректный числовой ID.');
      setIsLoading(false);
      return;
    }

    const existingUser = getUserByVkId(vkId);
    
    if (existingUser) {
      if (existingUser.isBanned) {
        setError('Ваш аккаунт заблокирован.');
        setIsLoading(false);
        return;
      }
      setStep('login');
    } else {
      setIsNewUser(true);
      setStep('register');
    }
    setIsLoading(false);
  };

  const handleRegister = () => {
    setError('');
    
    if (!username.trim() || username.length < 3) {
      setError('Имя пользователя должно быть не менее 3 символов');
      return;
    }
    if (!password.trim() || password.length < 4) {
      setError('Пароль должен быть не менее 4 символов');
      return;
    }

    const newUser: UserType = {
      id: Date.now(),
      vkId,
      username,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
      lvl: 0,
      balls: 0,
      warnings: 0,
      reprimands: 0,
      is_online: true,
      last_seen: new Date().toISOString(),
      created_at: new Date().toISOString(),
      permissions: [],
      isBanned: false,
      ghostMode: false,
      messagesClosed: false,
    };

    saveUser(newUser);
    setCurrentUser(newUser);
    onAuth(newUser);
  };

  const handleLogin = () => {
    setError('');
    
    const user = getUserByVkId(vkId);
    if (!user) {
      setError('Пользователь не найден');
      return;
    }

    // In real app, verify password hash
    // For demo, we check against stored user data
    const users = getUsers();
    const storedUser = users.find(u => u.vkId === vkId);
    
    if (storedUser) {
      storedUser.is_online = true;
      storedUser.last_seen = new Date().toISOString();
      saveUser(storedUser);
      setCurrentUser(storedUser);
      onAuth(storedUser);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-violet-950/30 to-slate-950">
        {/* Floating orbs */}
        <motion.div
          className="absolute w-96 h-96 rounded-full bg-violet-600/20 blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{ top: '10%', left: '10%' }}
        />
        <motion.div
          className="absolute w-80 h-80 rounded-full bg-fuchsia-600/15 blur-3xl"
          animate={{
            x: [0, -80, 0],
            y: [0, 80, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{ bottom: '20%', right: '15%' }}
        />
        <motion.div
          className="absolute w-64 h-64 rounded-full bg-cyan-600/10 blur-3xl"
          animate={{
            x: [0, 50, 0],
            y: [0, 50, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{ top: '40%', right: '30%' }}
        />
      </div>

      {/* Glass card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl shadow-violet-500/10">
          {/* Logo */}
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="flex flex-col items-center mb-8"
          >
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-orange-400 flex items-center justify-center mb-4 shadow-lg shadow-violet-500/30">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 via-fuchsia-400 to-orange-400 bg-clip-text text-transparent">
              Sunday App
            </h1>
            <p className="text-slate-400 text-sm mt-1">Административная панель 2026</p>
          </motion.div>

          {/* Step 1: VK ID */}
          {step === 'vk' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-white mb-2">Добро пожаловать</h2>
                <p className="text-slate-400 text-sm">Введите ваш VK ID для продолжения</p>
              </div>

              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Ваш VK ID (например: 123456789)"
                  value={vkId}
                  onChange={(e) => setVkId(e.target.value.replace(/\D/g, ''))}
                  className="pl-12 h-14 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-violet-500 focus:ring-violet-500/20 rounded-xl"
                />
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-400 text-sm text-center"
                >
                  {error}
                </motion.p>
              )}

              <Button
                onClick={handleVkSubmit}
                disabled={!vkId || isLoading}
                className="w-full h-14 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-violet-600/25 disabled:opacity-50"
              >
                {isLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                  />
                ) : (
                  <>
                    Продолжить
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>

              <p className="text-center text-slate-500 text-xs mt-4">
                Нажимая "Продолжить", вы соглашаетесь с правилами использования
              </p>
            </motion.div>
          )}

          {/* Step 2: Register new user */}
          {step === 'register' && isNewUser && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-white mb-2">Создать аккаунт</h2>
                <p className="text-slate-400 text-sm">VK ID: {vkId}</p>
              </div>

              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Придумайте имя пользователя"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-12 h-14 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-violet-500 focus:ring-violet-500/20 rounded-xl"
                />
              </div>

              <div className="relative">
                <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  type="password"
                  placeholder="Придумайте пароль"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-12 h-14 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-violet-500 focus:ring-violet-500/20 rounded-xl"
                />
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-400 text-sm text-center"
                >
                  {error}
                </motion.p>
              )}

              <Button
                onClick={handleRegister}
                disabled={!username || !password}
                className="w-full h-14 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-violet-600/25"
              >
                Создать аккаунт
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>

              <Button
                variant="ghost"
                onClick={() => setStep('vk')}
                className="w-full text-slate-400 hover:text-white"
              >
                Назад
              </Button>
            </motion.div>
          )}

          {/* Step 3: Login existing user */}
          {step === 'login' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-white mb-2">Вход в аккаунт</h2>
                <p className="text-slate-400 text-sm">VK ID: {vkId}</p>
              </div>

              <div className="relative">
                <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  type="password"
                  placeholder="Введите пароль"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-12 h-14 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-violet-500 focus:ring-violet-500/20 rounded-xl"
                />
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-400 text-sm text-center"
                >
                  {error}
                </motion.p>
              )}

              <Button
                onClick={handleLogin}
                disabled={!password}
                className="w-full h-14 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-violet-600/25"
              >
                Войти
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>

              <Button
                variant="ghost"
                onClick={() => setStep('vk')}
                className="w-full text-slate-400 hover:text-white"
              >
                Назад
              </Button>
            </motion.div>
          )}
        </div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-slate-500 text-sm mt-6"
        >
          Sunday App 2026 Edition
        </motion.p>
      </motion.div>
    </div>
  );
}
