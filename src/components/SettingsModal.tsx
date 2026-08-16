import React from 'react';
import {
  Settings,
  X,
  Palette,
  Volume2,
  Sliders,
  Type,
  Eye,
  Keyboard
} from 'lucide-react';
import { UserSettings, CaretStyle, SoundType, FontFamily } from '../types';
import { THEMES } from '../utils/theme-manager';
import { SoundEngine } from '../core/sound-engine';

interface SettingsModalProps {
  settings: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onClose
}) => {
  const handleSoundTest = (type: SoundType) => {
    SoundEngine.setSoundType(type);
    SoundEngine.playKeypress();
    onUpdateSettings({ soundType: type });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card wide" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <Settings size={22} color="var(--color-accent)" />
            <span>MozType Customization & Settings</span>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* 1. Theme Selection */}
          <div className="settings-section">
            <div className="settings-section-title">Theme Palette</div>
            <div className="theme-picker-grid">
              {THEMES.map(theme => (
                <div
                  key={theme.id}
                  className={`theme-card ${settings.theme === theme.id ? 'active' : ''}`}
                  onClick={() => onUpdateSettings({ theme: theme.id })}
                >
                  <div className="theme-preview-dots">
                    <span className="theme-dot" style={{ background: theme.colors.bg, border: '1px solid #555' }} />
                    <span className="theme-dot" style={{ background: theme.colors.main }} />
                    <span className="theme-dot" style={{ background: theme.colors.accent }} />
                  </div>
                  <div className="theme-card-name">{theme.name}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 2. Caret Styles */}
          <div className="settings-section">
            <div className="settings-section-title">Caret Cursor Style</div>
            <div className="settings-row">
              <div className="settings-info">
                <div className="settings-name">Caret Type</div>
                <div className="settings-desc">Choose cursor shape and animation behavior</div>
              </div>
              <div className="mode-group">
                {(['smooth', 'line', 'block', 'underline', 'outline', 'laser', 'off'] as CaretStyle[]).map(style => (
                  <button
                    key={style}
                    className={`mode-btn ${settings.caretStyle === style ? 'active' : ''}`}
                    onClick={() => onUpdateSettings({ caretStyle: style })}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 3. Audio & Sound Engine */}
          <div className="settings-section">
            <div className="settings-section-title">Mechanical Keyboard Sound Engine</div>
            <div className="settings-row">
              <div className="settings-info">
                <div className="settings-name">Switch Acoustic Profile</div>
                <div className="settings-desc">Realistic Web Audio switch sound simulation on every keystroke</div>
              </div>
              <div className="mode-group">
                {(['mechanical', 'thock', 'typewriter', 'beep', 'pop', 'off'] as SoundType[]).map(st => (
                  <button
                    key={st}
                    className={`mode-btn ${settings.soundType === st ? 'active' : ''}`}
                    onClick={() => handleSoundTest(st)}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {settings.soundType !== 'off' && (
              <div className="settings-row">
                <div className="settings-info">
                  <div className="settings-name">Audio Volume</div>
                  <div className="settings-desc">Sound intensity level</div>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="1"
                  step="0.05"
                  value={settings.soundVolume}
                  onChange={e => {
                    const val = parseFloat(e.target.value);
                    SoundEngine.setVolume(val);
                    onUpdateSettings({ soundVolume: val });
                  }}
                  style={{ width: '140px', accentColor: 'var(--color-accent)' }}
                />
              </div>
            )}
          </div>

          {/* 4. Typography & Font Family */}
          <div className="settings-section">
            <div className="settings-section-title">Typography</div>
            <div className="settings-row">
              <div className="settings-info">
                <div className="settings-name">Monospace Font</div>
                <div className="settings-desc">Select high-legibility coding font</div>
              </div>
              <div className="mode-group">
                {(['JetBrains Mono', 'Fira Code', 'Roboto Mono', 'Space Mono', 'Inter'] as FontFamily[]).map(font => (
                  <button
                    key={font}
                    className={`mode-btn ${settings.fontFamily === font ? 'active' : ''}`}
                    onClick={() => onUpdateSettings({ fontFamily: font })}
                    style={{ fontFamily: font }}
                  >
                    {font}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 5. Live UI Indicators */}
          <div className="settings-section">
            <div className="settings-section-title">Live Indicators</div>
            <div className="settings-row">
              <div className="settings-info">
                <div className="settings-name">Live WPM Display</div>
                <div className="settings-desc">Show real-time speed pill while actively typing</div>
              </div>
              <button
                className={`mode-btn ${settings.showLiveWpm ? 'active' : ''}`}
                onClick={() => onUpdateSettings({ showLiveWpm: !settings.showLiveWpm })}
              >
                {settings.showLiveWpm ? 'ON' : 'OFF'}
              </button>
            </div>

            <div className="settings-row">
              <div className="settings-info">
                <div className="settings-name">Caps Lock Warning</div>
                <div className="settings-desc">Show alert banner when Caps Lock is enabled</div>
              </div>
              <button
                className={`mode-btn ${settings.capsLockWarning ? 'active' : ''}`}
                onClick={() => onUpdateSettings({ capsLockWarning: !settings.capsLockWarning })}
              >
                {settings.capsLockWarning ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
