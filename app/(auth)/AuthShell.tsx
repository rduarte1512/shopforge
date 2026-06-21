import type { ReactNode } from 'react';
import { ArrowRight, CheckCircle2, Sparkles, Store, Zap } from 'lucide-react';

const authContent = {
  login: {
    eyebrow: 'Bem-vindo de volta',
    title: 'Entra no teu painel.',
    description: 'Gere lojas, produtos, pedidos e automações de IA num dashboard moderno e rápido.',
    pill: 'Painel de gestão ShopForge',
    cardTitle: 'Login seguro',
    cardDescription: 'Acede à tua conta para continuares a construir a tua loja.',
    cta: 'Ainda não tens conta?',
    ctaLabel: 'Criar conta',
    ctaHref: '/register',
  },
  register: {
    eyebrow: 'Começa agora',
    title: 'Cria a tua loja online.',
    description: 'Regista-te, escolhe um plano e começa a criar lojas com templates, produtos e IA.',
    pill: 'Criador de lojas com IA',
    cardTitle: 'Criar conta',
    cardDescription: 'Abre a tua conta e começa a preparar a tua primeira loja.',
    cta: 'Já tens conta?',
    ctaLabel: 'Entrar',
    ctaHref: '/login',
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
    colorInputBackground: 'rgba(15, 23, 42, 0.8)',
    colorInputText: '#f8fafc',
    colorText: '#f8fafc',
    colorTextSecondary: '#94a3b8',
    borderRadius: '16px',
    fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
  },
  elements: {
    rootBox: 'w-full',
    cardBox: 'w-full shadow-none',
    card: 'w-full rounded-none border-0 bg-transparent p-0 shadow-none',
    header: 'hidden',
    headerTitle: 'hidden',
    headerSubtitle: 'hidden',
    main: 'px-0 pb-0 pt-0',
    socialButtonsBlockButton: 'h-12 rounded-2xl border border-white/10 bg-white/[0.05] text-sm font-bold text-white shadow-none transition-all hover:border-emerald-300/40 hover:bg-white/[0.09]',
    socialButtonsBlockButtonText: 'text-white',
    dividerRow: 'my-5',
    dividerLine: 'bg-white/10',
    dividerText: 'text-xs font-bold text-slate-400',
    formFieldRow: 'mb-4',
    formFieldLabel: 'mb-2 text-xs font-black uppercase tracking-[0.14em] text-slate-300',
    formFieldInput: 'h-12 rounded-2xl border border-white/10 bg-white/[0.06] px-4 text-sm font-semibold text-white shadow-inner outline-none transition-all placeholder:text-slate-500 focus:border-emerald-300 focus:bg-white/[0.09] focus:ring-4 focus:ring-emerald-300/10',
    formFieldInputShowPasswordButton: 'text-slate-400 hover:text-white',
    formButtonPrimary: 'mt-2 h-12 rounded-2xl bg-emerald-400 text-sm font-black text-slate-950 shadow-[0_18px_40px_rgba(52,211,153,0.26)] transition-all hover:bg-emerald-300 active:scale-[0.98]',
    footer: 'mt-5 border-t border-white/10 bg-transparent px-0 pb-0 pt-5',
    footerActionText: 'text-sm font-medium text-slate-400',
    footerActionLink: 'text-sm font-black text-emerald-300 transition-colors hover:text-emerald-200',
    formFieldAction: 'text-xs font-bold text-emerald-300 hover:text-emerald-200',
    identityPreview: 'rounded-2xl border border-white/10 bg-white/[0.05]',
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
  const benefits = mode === 'login'
    ? ['Dashboard rápido', 'Gestão de lojas e pedidos', 'Ferramentas de IA prontas']
    : ['Templates profissionais', 'Produtos e imagens com IA', 'Checkout e gestão num só lugar'];

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#050816] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute left-[-14rem] top-[-14rem] h-[34rem] w-[34rem] rounded-full bg-emerald-400/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-14rem] right-[-10rem] h-[34rem] w-[34rem] rounded-full bg-indigo-500/20 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(52,211,153,0.14),transparent_32%),linear-gradient(135deg,rgba(255,255,255,0.04)_0,transparent_45%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:54px_54px] opacity-30" />

      <div className="relative mx-auto grid min-h-[calc(100vh-3rem)] w-full max-w-6xl items-center gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(410px,470px)]">
        <section className="hidden lg:block">
          <div className="max-w-[520px] rounded-[40px] border border-white/10 bg-white/[0.055] p-8 shadow-[0_35px_100px_rgba(0,0,0,0.25)] backdrop-blur-2xl xl:p-10">
            <div className="mb-8 inline-flex max-w-full items-center gap-3 rounded-full border border-white/10 bg-white/[0.07] px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-emerald-200">
              <Sparkles className="h-4 w-4 shrink-0" />
              <span className="truncate">{content.pill}</span>
            </div>

            <p className="mb-4 text-xs font-black uppercase tracking-[0.28em] text-emerald-300">{content.eyebrow}</p>
            <h1 className="max-w-[480px] text-4xl font-black leading-[1.02] tracking-[-0.045em] text-white xl:text-5xl">
              {content.title}
            </h1>
            <p className="mt-5 max-w-[460px] text-base font-medium leading-7 text-slate-300 xl:text-lg">
              {content.description}
            </p>

            <div className="mt-8 grid grid-cols-3 gap-3">
              {benefits.map((benefit) => (
                <div key={benefit} className="min-h-[118px] rounded-3xl border border-white/10 bg-slate-950/35 p-4 shadow-2xl shadow-black/10 backdrop-blur-xl">
                  <CheckCircle2 className="mb-4 h-5 w-5 text-emerald-300" />
                  <p className="text-xs font-black leading-snug text-white xl:text-sm">{benefit}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-[30px] border border-white/10 bg-slate-950/40 p-4">
              <div className="flex items-center justify-between gap-4 rounded-[24px] bg-slate-950/70 p-4">
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-400 text-slate-950 shadow-xl shadow-emerald-400/20">
                    <Store className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-white">ShopForge Studio</p>
                    <p className="mt-1 truncate text-xs font-semibold text-slate-400">Lojas profissionais em minutos</p>
                  </div>
                </div>
                <div className="shrink-0 rounded-full bg-emerald-400/10 px-3 py-1 text-[11px] font-black text-emerald-300">Online</div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-[470px]">
          <div className="mb-6 text-center lg:hidden">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-400 text-slate-950 shadow-2xl shadow-emerald-400/25">
              <Zap className="h-7 w-7" />
            </div>
            <h1 className="text-3xl font-black tracking-[-0.04em] text-white">ShopForge</h1>
            <p className="mx-auto mt-2 max-w-sm text-sm font-medium leading-6 text-slate-400">{content.description}</p>
          </div>

          <div className="rounded-[34px] border border-white/10 bg-white/[0.07] p-3 shadow-[0_40px_110px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
            <div className="rounded-[26px] border border-white/10 bg-slate-950/78 p-5 sm:p-7">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-emerald-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-300">
                    <Sparkles className="h-3.5 w-3.5" />
                    ShopForge
                  </div>
                  <h2 className="text-2xl font-black tracking-[-0.04em] text-white">{content.cardTitle}</h2>
                  <p className="mt-1 text-sm font-medium leading-6 text-slate-400">{content.cardDescription}</p>
                </div>
                <a href={content.ctaHref} className="hidden shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-2 text-xs font-black text-white transition-all hover:border-emerald-300/40 hover:bg-white/[0.08] sm:inline-flex">
                  {content.ctaLabel}
                  <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </div>

              <div className="clerk-auth-form">
                {children}
              </div>
            </div>
          </div>

          <p className="mt-5 text-center text-sm font-medium text-slate-400 sm:hidden">
            {content.cta}{' '}
            <a href={content.ctaHref} className="font-black text-emerald-300 hover:text-emerald-200">
              {content.ctaLabel}
            </a>
          </p>
        </section>
      </div>
    </main>
  );
}
