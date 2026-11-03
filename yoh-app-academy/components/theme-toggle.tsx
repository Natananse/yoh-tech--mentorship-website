'use client';

import { useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';

type Theme = 'light' | 'dark';
const storageKey = 'yo-tech-theme';

function savedTheme(): Theme | null {
  try { const value = localStorage.getItem(storageKey); return value === 'light' || value === 'dark' ? value : null; }
  catch { return null; }
}
function applyTheme(theme: Theme, preference: Theme | 'system') {
  document.documentElement.dataset.theme = theme;
  document.documentElement.dataset.themePreference = preference;
}

export function ThemeController() {
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const systemTheme = (): Theme => media.matches ? 'dark' : 'light';
    const synchronize = () => { const saved = savedTheme(); applyTheme(saved || systemTheme(), saved || 'system'); };
    const systemChanged = () => { if (document.documentElement.dataset.themePreference === 'system') applyTheme(systemTheme(), 'system'); };
    const storageChanged = (event: StorageEvent) => { if (event.key === storageKey || event.key === null) synchronize(); };
    if (!document.documentElement.dataset.themePreference) synchronize();
    else systemChanged();
    window.addEventListener('storage', storageChanged);
    media.addEventListener('change', systemChanged);
    return () => { window.removeEventListener('storage', storageChanged); media.removeEventListener('change', systemChanged); };
  }, []);
  return null;
}

export function ThemeToggle() {
  function toggle() {
    const next: Theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(next, next);
    try { localStorage.setItem(storageKey, next); } catch { /* The choice still applies in this tab when storage is unavailable. */ }
  }
  return <button className="theme-toggle" type="button" onClick={toggle} title="Change color theme">
    <Moon className="theme-show-light" size={20} aria-hidden="true" />
    <Sun className="theme-show-dark" size={20} aria-hidden="true" />
    <span className="theme-toggle-label theme-show-light">Switch to dark theme</span>
    <span className="theme-toggle-label theme-show-dark">Switch to light theme</span>
  </button>;
}
