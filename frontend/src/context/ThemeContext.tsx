import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from 'react';
import { flushSync } from 'react-dom';

export type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: (e?: React.MouseEvent) => void;
  setTheme: (t: Theme, e?: React.MouseEvent) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'nulltor_theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY) as Theme | null;
    if (saved === 'dark' || saved === 'light') return saved;
    return 'dark'; // default to enterprise dark mode
  });

  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const applyThemeWithTransition = (newTheme: Theme, e?: React.MouseEvent) => {
    if (!document.documentElement) return;

    // Fast-path for View Transition API
    if ('startViewTransition' in document && typeof (document as any).startViewTransition === 'function') {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem(LOCAL_STORAGE_KEY, newTheme);
        setThemeState(newTheme);
        return;
      }

      // Calculate origin coordinates from click or button center
      let x = window.innerWidth / 2;
      let y = window.innerHeight / 2;
      if (e) {
        if (typeof e.clientX === 'number' && e.clientX > 0) {
          x = e.clientX;
          y = e.clientY;
        } else if (e.currentTarget && typeof (e.currentTarget as HTMLElement).getBoundingClientRect === 'function') {
          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
          x = rect.left + rect.width / 2;
          y = rect.top + rect.height / 2;
        }
      }

      const endRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      );

      try {
        const transition = (document as any).startViewTransition(() => {
          // flushSync forces React 19 to render synchronously so the snapshot captures the full new theme state
          flushSync(() => {
            setThemeState(newTheme);
          });
          document.documentElement.setAttribute('data-theme', newTheme);
          localStorage.setItem(LOCAL_STORAGE_KEY, newTheme);
        });

        if (transition && transition.ready) {
          transition.ready.then(() => {
            const clipPath = [
              `circle(0px at ${x}px ${y}px)`,
              `circle(${endRadius}px at ${x}px ${y}px)`,
            ];
            document.documentElement.animate(
              {
                clipPath,
              },
              {
                duration: 520,
                easing: 'cubic-bezier(0.16, 1, 0.3, 1)', // Ultra-smooth deceleration curve
                pseudoElement: '::view-transition-new(root)',
              }
            );
          }).catch(() => {});
        }
        return;
      } catch {
        // Fall back to standard transition below
      }
    }

    // Fallback for browsers without View Transitions support
    document.documentElement.classList.add('theme-transitioning');
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem(LOCAL_STORAGE_KEY, newTheme);
    setThemeState(newTheme);

    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current);
    }

    transitionTimerRef.current = setTimeout(() => {
      document.documentElement.classList.remove('theme-transitioning');
    }, 450);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, []);

  const toggleTheme = (e?: React.MouseEvent) => {
    applyThemeWithTransition(theme === 'dark' ? 'light' : 'dark', e);
  };

  const setTheme = (t: Theme, e?: React.MouseEvent) => {
    applyThemeWithTransition(t, e);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
