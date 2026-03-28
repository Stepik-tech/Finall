import { useTheme, type ThemeType } from '@/hooks/useTheme';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Moon, Sun, Sparkles, Waves, Trees, Sunset, Zap, Check } from 'lucide-react';

const themes: { id: ThemeType; label: string; icon: React.ElementType; description: string; gradient: string }[] = [
  { 
    id: 'dark', 
    label: 'Тёмная', 
    icon: Moon, 
    description: 'Классическая тёмная тема',
    gradient: 'from-slate-800 to-slate-900'
  },
  { 
    id: 'light', 
    label: 'Светлая', 
    icon: Sun, 
    description: 'Чистая светлая тема',
    gradient: 'from-slate-100 to-white'
  },
  { 
    id: 'midnight', 
    label: 'Полночь', 
    icon: Sparkles, 
    description: 'Глубокий синий оттенок',
    gradient: 'from-indigo-950 to-slate-950'
  },
  { 
    id: 'ocean', 
    label: 'Океан', 
    icon: Waves, 
    description: 'Освежающий бирюзовый',
    gradient: 'from-cyan-900 to-teal-950'
  },
  { 
    id: 'forest', 
    label: 'Лес', 
    icon: Trees, 
    description: 'Природный зелёный',
    gradient: 'from-emerald-900 to-green-950'
  },
  { 
    id: 'sunset', 
    label: 'Закат', 
    icon: Sunset, 
    description: 'Тёплые оранжевые тона',
    gradient: 'from-orange-900 to-rose-950'
  },
  { 
    id: 'cyber', 
    label: 'Кибер', 
    icon: Zap, 
    description: 'Неоновый футуризм',
    gradient: 'from-fuchsia-900 to-purple-950'
  },
];

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const currentTheme = themes.find(t => t.id === theme);
  const Icon = currentTheme?.icon || Moon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative w-10 h-10 rounded-xl hover:bg-white/10 transition-colors"
        >
          <Icon className="w-5 h-5" style={{ color: 'hsl(var(--foreground))' }} />
          <span className="sr-only">Сменить тему</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-64 p-2"
        style={{ 
          background: 'hsl(var(--popover))',
          borderColor: 'hsl(var(--border))'
        }}
      >
        <DropdownMenuLabel className="text-sm font-semibold px-2 py-1.5" style={{ color: 'hsl(var(--popover-foreground))' }}>
          Выберите тему
        </DropdownMenuLabel>
        <DropdownMenuSeparator style={{ background: 'hsl(var(--border))' }} />
        {themes.map((t) => {
          const ThemeIcon = t.icon;
          const isActive = theme === t.id;
          
          return (
            <DropdownMenuItem
              key={t.id}
              onClick={() => setTheme(t.id)}
              className="flex items-center gap-3 px-2 py-2.5 rounded-lg cursor-pointer transition-colors"
              style={{
                background: isActive ? 'hsl(var(--accent))' : 'transparent',
              }}
            >
              <div 
                className={`w-8 h-8 rounded-lg bg-gradient-to-br ${t.gradient} flex items-center justify-center flex-shrink-0`}
              >
                <ThemeIcon className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'hsl(var(--popover-foreground))' }}>
                  {t.label}
                </p>
                <p className="text-xs truncate" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  {t.description}
                </p>
              </div>
              {isActive && (
                <Check className="w-4 h-4 flex-shrink-0" style={{ color: 'hsl(var(--primary))' }} />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
