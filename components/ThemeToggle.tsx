'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-white/10 animate-pulse" />
    );
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="relative w-11 h-11 inline-flex items-center justify-center rounded-2xl border border-border bg-card-bg/80 text-text-secondary shadow-sm shadow-black/[0.03] hover:text-text-primary hover:border-border-hover hover:bg-gray-50 dark:bg-white/[0.06] dark:hover:bg-white/[0.10] dark:shadow-black/30 transition-all group overflow-hidden"
      aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
      title={isDark ? 'Modo claro' : 'Modo escuro'}
    >
      <span className="absolute inset-0 bg-gradient-to-tr from-primary/15 via-transparent to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.div
            key="moon"
            initial={{ y: 16, opacity: 0, rotate: 45 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: -16, opacity: 0, rotate: -45 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="relative z-10"
          >
            <Moon className="w-5 h-5 text-amber-300 fill-amber-300/20" />
          </motion.div>
        ) : (
          <motion.div
            key="sun"
            initial={{ y: 16, opacity: 0, rotate: -45 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: -16, opacity: 0, rotate: 45 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="relative z-10"
          >
            <Sun className="w-5 h-5 text-amber-500 fill-amber-500/20" />
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}
