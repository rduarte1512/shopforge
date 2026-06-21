import type { ReactNode } from 'react';
import { CheckCircle2, LockKeyhole, Sparkles, Store, Zap } from 'lucide-react';

const authContent = {
  login: {
    eyebrow: 'Acesso seguro',
    title: 'Bem-vindo de volta.',
    description: 'Entra no teu painel para gerir lojas, produtos, pedidos e ferramentas de IA.',
    cardTitle: 'Entrar na ShopForge',
    cardDescription: 'Continua a construir e gerir a tua loja online.',
    cta: 'Ainda não tens conta?',
    ctaLabel: 'Criar conta',
    ctaHref: '/register',
    benefits: ['Painel profissional', 'Pedidos e produtos', 'IA para lojas'],
  },
  register: {
    eyebrow: 'Nova conta',
    title: 'Cria a tua loja online.',
    description: 'Regista-te para criares lojas com templates premium, produtos e automações de IA.',
    cardTitle: 'Criar conta ShopForge',
    cardDescription: 'Começa agora a preparar a tua primeira loja.',
    cta: 'Já tens conta?',
    ctaLabel: 'Entrar',
    ctaHref: '/login',
    benefits: ['Templates premium', 'Produtos com IA', 'Checkout integrado'],
  },
};

export const clerkAuthAppearance = {
  layout: {
    socialButtonsPlacement: 'top' as const,
    socialButtonsVariant: 'blockButton' as const,
  },
  variables: {
    colorPrimary: '#34d399',
    colorBackground: 'transparent',
    colorInputBackground: 'rgba(2, 6, 23, 0.72)',
    colorInputText: '#f8fafc',
    colorText: '#f8fafc',
    colorTextSecondary: '#94a3b8',
    borderRadius: '18px',
    fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
  },
  elements: {
    rootBox: 'w-full max-w-full',
    cardBox: 'w-full max-w-full shadow-none',
    card: 'w-full max-w-full rounded-none border-0 bg-transparent p-0 shadow-none',
    header: 'hidden',
    headerTitle: 'hidden',
    headerSubtitle: 'hidden',
    main: 'w-full px-0 pb-0 pt-0',
    socialButtons: 'w-full',
    socialButtonsBlockButton: 'flex h-12 w-full max-w-full items-center justify-center rounded-2xl border border-white/10 bg-white/[0.055] px-4 text-sm font-bold text-white shadow-none transition-all hover:border-emerald-300/50 hover:bg-white/[0.09]',
    socialButtonsBlockButtonText: 'min-w-0 truncate text-white',
    dividerRow: 'my-5 w-full',
    dividerLine: 'bg-white/10',
    dividerText: 'px-3 text-xs font-bold text-slate-400',
    form: 'w-full space-y-4',
    formFieldRow: 'w-full',
    formField: 'w-full',
    formFieldLabel: 'mb-2 text-xs font-black uppercase tracking-[0.14em] text-slate-300',
    formFieldInput: 'h-12 w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 text-sm font-semibold text-white shadow-inner outline-none transition-all placeholder:text-slate-500 focus:border-emerald-300 focus:bg-white/[0.09] focus:ring-4 focus:ring-emerald-300/10',
    formFieldInputShowPasswordButton: 'text-slate-400 hover:text-white',
    formButtonPrimary: 'mt-1 h-12 w-full rounded-2xl bg-emerald-400 text-sm font-black text-slate-950 shadow-[0_18px_45px_rgba(52,211,153,0.28)] transition-all hover:bg-emerald-300 active:scale-[0.98]',
    footer: 'mt-6 border-t border-white/10 bg-transparent px-0 pb-0 pt-5',
    footerActionText: 'text-sm font-medium text-slate-400',
    footerActionLink: 'text-sm font-black text-emerald-300 transition-colors hover:text-emerald-200',
    formFieldAction: 'text-xs font-bold text-emerald-300 hover:text-emerald-200',
    identityPreview: 'rounded-2xl border border-white/10 bg-white/[0.055]',
    identityPreviewText: 'text-white',
    identityPreviewEditButton: 'text-emerald-300 hover:text-emerald-200',
    otpCodeFieldInput: 'rounded-xl border-white/10 bg-white/[0.06] text-white focus:border-emerald-300',
    alert: 'rounded-2xl border border-red-400/20 bg-red-500/10 text-red-100',
    formResendCodeLink: 'text-emerald-300 hover:text-emerald-200',
    backLink: 'text-emerald-300 hover:text-emerald-200',
  },
};

type AuthShellProps = {
  mode: 'login' | 'register';
  children: ReactNode;
};

export function AuthShell({ mode, children }: AuthShellProps) {
  const content = authContent[mode];

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#030712] px-4 py-6 text-white sm:px-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(52,211,153,0.25),transparent_34%),radial-gradient(circle_at_100%_100%,rgba(99,102,241,0.20),transparent_34%),linear-gradient(180deg,#030712_0%,#07111f_52%,#020617_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:56px_56px] opacity-25" />
      <div className="pointer-events-none absolute left-1/2 top-10 h-72 w-72 -translate-x-1/2 rounded-full bg-emerald-400/20 blur-3xl" />

      <div className="relative mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-[500px] flex-col justify-center">
        <div className="mb-5 flex justify-center">
          <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.07] px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-emerald-200 shadow-2xl shadow-black/20 backdrop-blur-xl">
            <Store className="h-4 w-4" />
            ShopForge
          </div>
        </div>

        <section className="mb-5 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-[24px] border border-emerald-300/25 bg-emerald-400 text-slate-950 shadow-[0_24px_70px_rgba(52,211,153,0.32)]">
            {mode === 'login' ? <LockKeyhole className="h-7 w-7" /> : <Zap className="h-8 w-8" />}
          </div>
          <p className="mb-3 text-xs font-black uppercase tracking-[0.24em] text-emerald-300">{content.eyebrow}</p>
          <h1 className="text-3xl font-black leading-tight tracking-[-0.045em] text-white sm:text-4xl">
            {content.title}
          </h1>
          <p className="mx-auto mt-3 max-w-[390px] text-sm font-medium leading-6 text-slate-300 sm:text-[15px]">
            {content.description}
          </p>
        </section>

        <div className="mb-5 grid grid-cols-3 gap-2 sm:gap-3">
          {content.benefits.map((benefit) => (
            <div key={benefit} className="rounded-2xl border border-white/10 bg-white/[0.055] p-3 text-center shadow-xl shadow-black/10 backdrop-blur-xl">
              <CheckCircle2 className="mx-auto mb-2 h-4 w-4 text-emerald-300" />
              <p className="text-[10px] font-black leading-snug text-white sm:text-xs">{benefit}</p>
            </div>
          ))}
        </div>

        <section className="rounded-[34px] border border-white/10 bg-white/[0.08] p-2.5 shadow-[0_35px_110px_rgba(0,0,0,0.5)] backdrop-blur-2xl">
          <div className="overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/82 shadow-2xl shadow-black/30">
            <div className="relative border-b border-white/10 px-5 py-5 sm:px-7">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/70 to-transparent" />
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-emerald-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-300">
                    <Sparkles className="h-3.5 w-3.5" />
                    Seguro
                  </div>
                  <h2 className="text-2xl font-black tracking-[-0.04em] text-white">{content.cardTitle}</h2>
                  <p className="mt-1 text-sm font-medium leading-6 text-slate-400">{content.cardDescription}</p>
                </div>
                <a href={content.ctaHref} className="hidden shrink-0 rounded-full border border-white/10 bg-white/[0.055] px-3 py-2 text-xs font-black text-white transition-all hover:border-emerald-300/40 hover:bg-white/[0.09] sm:block">
                  {content.ctaLabel}
                </a>
              </div>
            </div>

            <div className="w-full max-w-full px-5 py-5 sm:px-7 sm:py-6">
              {children}
            </div>
          </div>
        </section>

        <p className="mt-5 text-center text-sm font-medium text-slate-400 sm:hidden">
          {content.cta}{' '}
          <a href={content.ctaHref} className="font-black text-emerald-300 hover:text-emerald-200">
            {content.ctaLabel}
          </a>
        </p>
      </div>
    </main>
  );
}
