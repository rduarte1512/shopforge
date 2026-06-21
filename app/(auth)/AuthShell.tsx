import type { ReactNode } from 'react';
import { ArrowRight, CheckCircle2, Sparkles, Store, Zap } from 'lucide-react';

const authContent = {
  login: {
    eyebrow: 'Bem-vindo de volta',
    title: 'Entra no teu painel e continua a vender.',
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
    title: 'Cria a tua loja online com uma experiência premium.',
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
    colorInputBackground: 'rgba(15, 23, 42, 0.72)',
    colorInputText: '#f8fafc',
    colorText: '#f8fafc',
    colorTextSecondary: '#94a3b8',
    borderRadius: '18px',
    fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
  },
  elements: {
    rootBox: 'w-full',
    cardBox: 'w-full shadow-none',
    card: 'w-full rounded-[28px] border border-white/10 bg-slate-950/75 p-0 shadow-[0_28px_90px_rgba(0,0,0,0.38)] backdrop-blur-2xl',
    header: 'hidden',
    headerTitle: 'hidden',
    headerSubtitle: 'hidden',
    main: 'px-6 pb-6 pt-6 sm:px-8',
    socialButtonsBlockButton: 'h-12 rounded-2xl border border-white/10 bg-white/[0.04] text-sm font-bold text-white shadow-none transition-all hover:border-emerald-300/40 hover:bg-white/[0.08]',
    socialButtonsBlockButtonText: 'text-white',
    dividerLine: 'bg-white/10',
    dividerText: 'text-slate-400 text-xs font-bold',
    formFieldLabel: 'mb-2 text-xs font-black uppercase tracking-[0.16em] text-slate-300',
    formFieldInput: 'h-12 rounded-2xl border border-white/10 bg-white/[0.05] px-4 text-sm font-semibold text-white shadow-inner outline-none transition-all placeholder:text-slate-500 focus:border-emerald-300 focus:bg-white/[0.08] focus:ring-4 focus:ring-emerald-300/10',
    formFieldInputShowPasswordButton: 'text-slate-400 hover:text-white',
    formButtonPrimary: 'h-12 rounded-2xl bg-emerald-400 text-sm font-black text-slate-950 shadow-[0_18px_40px_rgba(52,211,153,0.28)] transition-all hover:bg-emerald-300 hover:shadow-[0_22px_50px_rgba(52,211,153,0.34)] active:scale-[0.98]',
    footer: 'rounded-b-[28px] border-t border-white/10 bg-white/[0.03] px-6 py-5 sm:px-8',
    footerActionText: 'text-sm font-medium text-slate-400',
    footerActionLink: 'text-sm font-black text-emerald-300 transition-colors hover:text-emerald-200',
    formFieldAction: 'text-xs font-bold text-emerald-300 hover:text-emerald-200',
    identityPreviewText: 'text-white',
    identityPreviewEditButton: 'text-emerald-300 hover:text-emerald-200',
    otpCodeFieldInput: 'rounded-xl border-white/10 bg-white/[0.05] text-white focus:border-emerald-300',
    alert: 'rounded-2xl border border-red-400/20 bg-red-500/10 text-red-100',
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
    <main className="relative min-h-screen overflow-hidden bg-[#050816] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="absolute left-[-12rem] top-[-12rem] h-[32rem] w-[32rem] rounded-full bg-emerald-400/20 blur-3xl" />
      <div className="absolute bottom-[-14rem] right-[-10rem] h-[34rem] w-[34rem] rounded-full bg-indigo-500/20 blur-3xl" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(52,211,153,0.14),transparent_32%),linear-gradient(135deg,rgba(255,255,255,0.04)_0,transparent_45%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:54px_54px] opacity-30" />

      <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden lg:block">
          <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-emerald-200 shadow-2xl shadow-black/20 backdrop-blur-xl">
            <Sparkles className="h-4 w-4" />
            {content.pill}
          </div>

          <div className="max-w-xl">
            <p className="mb-4 text-sm font-black uppercase tracking-[0.28em] text-emerald-300">{content.eyebrow}</p>
            <h1 className="text-5xl font-black leading-[0.95] tracking-[-0.05em] text-white xl:text-7xl">
              {content.title}
            </h1>
            <p className="mt-7 max-w-lg text-lg font-medium leading-8 text-slate-300">
              {content.description}
            </p>
          </div>

          <div className="mt-10 grid max-w-2xl grid-cols-3 gap-3">
            {benefits.map((benefit) => (
              <div key={benefit} className="rounded-3xl border border-white/10 bg-white/[0.06] p-4 shadow-2xl shadow-black/10 backdrop-blur-xl">
                <CheckCircle2 className="mb-4 h-5 w-5 text-emerald-300" />
                <p className="text-sm font-black leading-tight text-white">{benefit}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 max-w-xl rounded-[36px] border border-white/10 bg-white/[0.06] p-5 shadow-2xl shadow-black/20 backdrop-blur-2xl">
            <div className="flex items-center justify-between gap-4 rounded-[28px] bg-slate-950/60 p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400 text-slate-950 shadow-xl shadow-emerald-400/20">
                  <Store className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-black text-white">ShopForge Studio</p>
                  <p className="mt-1 text-xs font-semibold text-slate-400">Lojas profissionais em minutos</p>
                </div>
              </div>
              <div className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-black text-emerald-300">Online</div>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-[470px]">
          <div className="mb-6 text-center lg:hidden">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-400 text-slate-950 shadow-2xl shadow-emerald-400/25">
              <Zap className="h-7 w-7" />
            </div>
            <h1 className="text-3xl font-black tracking-[-0.04em] text-white">ShopForge</h1>
            <p className="mt-2 text-sm font-medium text-slate-400">{content.description}</p>
          </div>

          <div className="rounded-[36px] border border-white/10 bg-white/[0.06] p-3 shadow-[0_40px_110px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
            <div className="rounded-[28px] border border-white/10 bg-slate-950/70 p-5 sm:p-6">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-emerald-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300">
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

              {children}
            </div>
          </div>

          <p className="mt-6 text-center text-sm font-medium text-slate-400">
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
