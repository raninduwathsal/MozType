import React, { useState, useEffect } from 'react';
import {
  Search,
  Palette,
  Clock,
  Type,
  Quote as QuoteIcon,
  Trophy,
  User,
  Settings,
  Flame,
  Volume2,
  RotateCcw
} from 'lucide-react';
import { THEMES } from '../utils/theme-manager';
import { TestMode, TimeDuration, WordCount, SoundType } from '../types';

interface CommandItem {
  id: string;
  title: string;
  category: string;
  icon: React.ReactNode;
  action: () => void;
}

interface CommandPaletteProps {
  onClose: () => void;
  onSelectTheme: (theme: string) => void;
  onSelectMode: (mode: TestMode) => void;
  onSelectTimeDuration: (duration: TimeDuration) => void;
  onSelectWordCount: (count: WordCount) => void;
  onSelectSound: (sound: SoundType) => void;
  onOpenLeaderboard: () => void;
  onOpenProfile: () => void;
  onOpenSettings: () => void;
  onOpenSessionModal: () => void;
  onRestartTest: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  onClose,
  onSelectTheme,
  onSelectMode,
  onSelectTimeDuration,
  onSelectWordCount,
  onSelectSound,
  onOpenLeaderboard,
  onOpenProfile,
  onOpenSettings,
  onOpenSessionModal,
  onRestartTest
}) => {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const commands: CommandItem[] = [
    {
      id: 'restart',
      title: 'Restart Test',
      category: 'General',
      icon: <RotateCcw size={16} />,
      action: () => { onRestartTest(); onClose(); }
    },
    {
      id: 'nav_lb',
      title: 'View Leaderboard',
      category: 'Navigation',
      icon: <Trophy size={16} />,
      action: () => { onOpenLeaderboard(); onClose(); }
    },
    {
      id: 'nav_prof',
      title: 'View Profile & Stats',
      category: 'Navigation',
      icon: <User size={16} />,
      action: () => { onOpenProfile(); onClose(); }
    },
    {
      id: 'nav_session',
      title: 'Manage Session / Change Name',
      category: 'Navigation',
      icon: <Flame size={16} />,
      action: () => { onOpenSessionModal(); onClose(); }
    },
    {
      id: 'nav_settings',
      title: 'Open Settings',
      category: 'Navigation',
      icon: <Settings size={16} />,
      action: () => { onOpenSettings(); onClose(); }
    },
    // Modes
    {
      id: 'mode_time_15',
      title: 'Mode: Time 15s',
      category: 'Mode',
      icon: <Clock size={16} />,
      action: () => { onSelectMode('time'); onSelectTimeDuration(15); onClose(); }
    },
    {
      id: 'mode_time_60',
      title: 'Mode: Time 60s',
      category: 'Mode',
      icon: <Clock size={16} />,
      action: () => { onSelectMode('time'); onSelectTimeDuration(60); onClose(); }
    },
    {
      id: 'mode_words_50',
      title: 'Mode: Words 50',
      category: 'Mode',
      icon: <Type size={16} />,
      action: () => { onSelectMode('words'); onSelectWordCount(50); onClose(); }
    },
    {
      id: 'mode_quote',
      title: 'Mode: Quote',
      category: 'Mode',
      icon: <QuoteIcon size={16} />,
      action: () => { onSelectMode('quote'); onClose(); }
    },
    // Themes
    ...THEMES.map(theme => ({
      id: `theme_${theme.id}`,
      title: `Theme: ${theme.name}`,
      category: 'Theme',
      icon: <Palette size={16} />,
      action: () => { onSelectTheme(theme.id); onClose(); }
    })),
    // Sounds
    {
      id: 'sound_mech',
      title: 'Sound: Mechanical Switches',
      category: 'Sound',
      icon: <Volume2 size={16} />,
      action: () => { onSelectSound('mechanical'); onClose(); }
    },
    {
      id: 'sound_thock',
      title: 'Sound: Thocky Switches',
      category: 'Sound',
      icon: <Volume2 size={16} />,
      action: () => { onSelectSound('thock'); onClose(); }
    },
    {
      id: 'sound_off',
      title: 'Sound: Mute Audio',
      category: 'Sound',
      icon: <Volume2 size={16} />,
      action: () => { onSelectSound('off'); onClose(); }
    }
  ];

  const filtered = commands.filter(cmd =>
    cmd.title.toLowerCase().includes(search.toLowerCase()) ||
    cmd.category.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, filtered.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card"
        style={{ maxWidth: '550px' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', padding: '0 1rem' }}>
          <Search size={18} color="var(--color-sub)" />
          <input
            type="text"
            className="cmd-palette-input"
            placeholder="Type a command or search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
        </div>

        <div className="cmd-palette-list">
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--color-sub)' }}>
              No commands found
            </div>
          ) : (
            filtered.map((cmd, idx) => (
              <div
                key={cmd.id}
                className={`cmd-item ${selectedIndex === idx ? 'selected' : ''}`}
                onClick={cmd.action}
                onMouseEnter={() => setSelectedIndex(idx)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  {cmd.icon}
                  <span>{cmd.title}</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-sub)', textTransform: 'uppercase' }}>
                  {cmd.category}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
