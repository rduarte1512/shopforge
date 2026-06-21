'use client';

import { SignIn } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { UserRound, X } from 'lucide-react';
import { clerkAuthAppearance } from '../../AuthShell';
import {
  REMEMBERED_SHOPFORGE_ACCOUNT_KEY,
  type RememberedShopForgeAccount,
} from '@/components/auth/RememberClerkAccount';

export default function LoginForm() {
  const [rememberedAccount, setRememberedAccount] = useState<RememberedShopForgeAccount | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(REMEMBERED_SHOPFORGE_ACCOUNT_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as RememberedShopForgeAccount;
        if (parsed?.email) setRememberedAccount(parsed);
      }
    } catch {
      localStorage.removeItem(REMEMBERED_SHOPFORGE_ACCOUNT_KEY);
    } finally {
      setLoaded(true);
    }
  }, []);

  const clearRememberedAccount = () => {
    localStorage.removeItem(REMEMBERED_SHOPFORGE_ACCOUNT_KEY);
    setRememberedAccount(null);
  };

  if (!loaded) {
    return <div className="h-[360px] animate-pulse rounded-[28px] border border-white/10 bg-white/[0.04]" />;
  }

  return (
    <div className="space-y-5">
      {rememberedAccount && (
        <div className="rounded-[26px] border border-emerald-300/20 bg-emerald-300/10 p-4 shadow-2xl shadow-black/10 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/70 shadow-xl shadow-black/20">
              {rememberedAccount.imageUrl ? (
                <img src={rememberedAccount.imageUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-emerald-300">
                  <UserRound className="h-5 w-5" />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-300">Última conta neste browser</p>
              <p className="truncate text-sm font-black text-white">{rememberedAccount.name}</p>
              <p className="truncate text-xs font-semibold text-slate-400">{rememberedAccount.email}</p>
            </div>

            <button
              type="button"
              onClick={clearRememberedAccount}
              className="rounded-xl border border-white/10 bg-white/[0.06] p-2 text-slate-400 transition-all hover:border-red-300/30 hover:bg-red-500/10 hover:text-red-200"
              aria-label="Usar outra conta"
              title="Usar outra conta"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-3 text-xs font-semibold leading-5 text-slate-300">
            A tua conta já ficou selecionada. Introduz a palavra-passe ou o código para voltar ao dashboard.
          </p>
        </div>
      )}

      <SignIn
        key={rememberedAccount?.email || 'new-account'}
        appearance={clerkAuthAppearance}
        routing="path"
        path="/login"
        signUpUrl="/register"
        forceRedirectUrl="/dashboard"
        fallbackRedirectUrl="/dashboard"
        signUpForceRedirectUrl="/dashboard"
        signUpFallbackRedirectUrl="/dashboard"
        initialValues={rememberedAccount?.email ? ({ identifier: rememberedAccount.email } as any) : undefined}
      />
    </div>
  );
}
