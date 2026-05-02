'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, isSupabaseConfigured } from '@/lib/auth-context';
import { Loader2 } from 'lucide-react';
import { motion } from "motion/react";

export default function RegisterPage() {
  const router = useRouter();
  const { signUp, user } = useAuth();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  if (user) {
    return null;
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await signUp(email, password, name);

    if (error) {
      if (error.message.includes('rate limit')) {
        setError('Limite de envio de emails atingido. Por favor, aguarde alguns minutos ou use um email diferente. Se é o administrador, pode desativar a confirmação de email no Dashboard do Supabase (Authentication > Settings > Providers > Email).');
      } else if (error.message.includes('User already registered')) {
        setError('Este email já está registado. Tente iniciar sessão.');
      } else {
        setError(error.message);
      }
      setLoading(false);
    } else {
      if (isSupabaseConfigured) {
        setVerificationSent(true);
      } else {
        router.push('/dashboard');
      }
      setLoading(false);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-center text-3xl font-black text-text-primary tracking-tight mb-2">
          Criar a sua conta
        </h2>
        <p className="text-center text-text-secondary text-sm mb-8">
          Junte-se à ShopForge e comece a vender hoje
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
            O registo é simulado. Pode usar qualquer email para testar.
          </p>
        </motion.div>
      )}

      <form className="space-y-5" onSubmit={handleRegister}>
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

        {verificationSent && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-primary/5 text-primary-dark p-4 rounded-xl text-sm border border-primary/10"
          >
            Email de verificação enviado! Por favor, verifique a sua caixa de entrada para ativar a conta.
          </motion.div>
        )}

        <div className="space-y-2">
          <label htmlFor="name" className="block text-sm font-bold text-text-secondary ml-1">
            Nome Completo
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Seu nome"
            className="appearance-none block w-full px-4 py-3 bg-gray-50 dark:bg-slate-900/50 border border-border rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm text-text-primary"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-bold text-text-secondary ml-1">
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
            className="appearance-none block w-full px-4 py-3 bg-gray-50 dark:bg-slate-900/50 border border-border rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm text-text-primary"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-bold text-text-secondary ml-1">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="appearance-none block w-full px-4 py-3 bg-gray-50 dark:bg-slate-900/50 border border-border rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm text-text-primary"
          />
          <p className="mt-1 text-[10px] text-text-muted ml-1">Mínimo de 6 caracteres</p>
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-xl shadow-xl shadow-primary/20 text-sm font-bold text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Criar Minha Loja Grátis'}
          </button>
        </div>
      </form>

      <div className="mt-8 pt-8 border-t border-border text-center text-sm">
        <p className="text-text-secondary">
          Já tem conta?{' '}
          <Link href="/login" className="font-bold text-primary hover:text-primary-dark transition-colors">
            Iniciar sessão
          </Link>
        </p>
      </div>
    </>
  );
}