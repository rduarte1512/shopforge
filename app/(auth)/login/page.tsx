'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, isSupabaseConfigured } from '@/lib/auth-context';
import { Loader2 } from 'lucide-react';
import { motion } from "motion/react";

export default function LoginPage() {
  const router = useRouter();
  const { signIn, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordResetSent, setPasswordResetSent] = useState(false);

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  if (user) {
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/dashboard');
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Por favor, insira o seu email para recuperação de password.');
      return;
    }

    if (!isSupabaseConfigured) {
      setError('Funcionalidade de recuperação não disponível. Supabase não configurado.');
      return;
    }

    setLoading(true);
    const result = await import('@/lib/supabase').then(m => 
      m.supabase?.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      })
    );

    const error = result?.error;

    if (error) {
      if (error.message.includes('rate limit')) {
        setError('Limite de envio de emails atingido. Por favor, aguarde alguns minutos antes de tentar novamente.');
      } else {
        setError(error.message);
      }
    } else {
      setPasswordResetSent(true);
    }
    setLoading(false);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-center text-3xl font-black text-slate-900 tracking-tight mb-2">
          Bem-vindo de volta
        </h2>
        <p className="text-center text-gray-500 text-sm mb-8">
          Inicie sessão para gerir a sua loja
        </p>
      </motion.div>

      {!isSupabaseConfigured && (
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8 p-4 bg-primary/5 border border-primary/10 rounded-2xl"
        >
          <p className="text-sm text-primary-dark font-semibold">
            Modo Demo
          </p>
          <p className="text-xs text-primary/70 mt-1">
            Email: <span className="font-mono bg-white px-1 rounded">demo@demo.com</span><br/>
            Password: <span className="font-mono bg-white px-1 rounded">password</span>
          </p>
        </motion.div>
      )}

      <form className="space-y-6" onSubmit={handleLogin}>
        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100 flex items-center gap-3"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-red-600" />
            {error}
          </motion.div>
        )}

        {passwordResetSent && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-primary/5 text-primary-dark p-4 rounded-xl text-sm border border-primary/10"
          >
            Email de recuperação enviado! Verifique a sua caixa de entrada.
          </motion.div>
        )}

        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-bold text-slate-700 ml-1">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            className="appearance-none block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between ml-1">
            <label htmlFor="password" className="block text-sm font-bold text-slate-700">
              Password
            </label>
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-xs font-semibold text-primary hover:text-primary-dark transition-colors"
            >
              Esqueceu a password?
            </button>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="appearance-none block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
          />
        </div>

        <div className="flex items-center">
          <input
            id="remember-me"
            name="remember-me"
            type="checkbox"
            className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded-md cursor-pointer"
          />
          <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-500 cursor-pointer">
            Lembrar-me neste dispositivo
          </label>
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-xl shadow-xl shadow-primary/20 text-sm font-bold text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Entrar na Conta'}
          </button>
        </div>
      </form>

      <div className="mt-8 pt-8 border-t border-gray-100 text-center text-sm">
        <p className="text-gray-500">
          Ainda não tem conta?{' '}
          <Link href="/register" className="font-bold text-primary hover:text-primary-dark transition-colors">
            Crie uma conta gratuita
          </Link>
        </p>
      </div>
    </>
  );
}