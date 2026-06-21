import type { ReactNode } from 'react';
import { CheckCircle2, LockKeyhole, Sparkles, Store, Zap } from 'lucide-react';

const authContent = {
  login: {
    eyebrow: 'Acesso seguro',
    title: 'Entrar na ShopForge',
    description: 'Acede ao teu painel para gerir lojas, produtos, pedidos e ferramentas de IA.',
    cta: 'Ainda não tens conta?',
    ctaLabel: 'Criar conta',
    ctaHref: '/register',
    icon: 'lock',
    benefits: ['Dashboard premium', 'Gestão de lojas', 'Ferramentas com IA'],
  },
  register: {
    eyebrow: 'Nova conta',
    title: 'Criar conta ShopForge',
    description: 'Começa a criar lojas online com templates premium, produtos e automações inteligentes.',
    cta: 'Já tens conta?',
    ctaLabel: 'Entrar',
    ctaHref: '/login',
    icon: 'zap',
    benefits: ['Templates modernos', 'Produtos com IA', 'Checkout preparado'],
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
    colorInputBackground: 'rgba(15, 23, 42, 0.78)',
    colorInputText: '#f8fafc',
    colorText: '#f8fafc',
    colorTextSecondary: '#94a3b8',
    borderRadius: '18px',
    fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
  },
  elements: {
    rootBox: 'w-full max-w-full min-w-0',
    cardBox: 'w-full max-w-full min-w-0 shadow-none',
    card: 'w-full max-w-full min-w-0 rounded-none border-0 bg-transparent p-0 shadow-none',
    header: 'hidden',
    headerTitle: 'hidden',
    headerSubtitle: 'hidden',
    main: 'w-full max-w-full min-w-0 px-0 pb-0 pt-0',
    socialButtons: 'w-full max-w-full min-w-0',
    socialButtonsBlockButton: 'flex h-14 w-full max-w-full min-w-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/[0.07] px-4 text-sm font-bold text-white shadow-none transition-all hover:border-emerald-300/50 hover:bg-white/[0.11]',
    socialButtonsBlockButtonText: 'min-w-0 max-w-full truncate text-white',
    dividerRow: 'my-6 w-full max-w-full min-w-0',
    dividerLine: 'bg-white/10',
    dividerText: 'px-3 text-xs font-bold text-slate-400',
    form: 'w-full max-w-full min-w-0 space-y-4',
    formFieldRow: 'w-full max-w-full min-w-0',
    formField: 'w-full max-w-full min-w-0',
    formFieldLabel: 'mb-2 text-[11px] font-black uppercase tracking-[0.13em] text-slate-300',
    formFieldInput: 'h-14 w-full max-w-full min-w-0 rounded-2xl border border-white/10 bg-white/[0.07] px-4 text-sm font-semibold text-white shadow-inner outline-none transition-all placeholder:text-slate-500 focus:border-emerald-300 focus:bg-white/[0.11] focus:ring-4 focus:ring-emerald-300/10',
    formButtonPrimary: 'mt-2 h-14 w-full max-w-full min-w-0 rounded-2xl bg-emerald-400 text-sm font-black text-slate-950 shadow-[0_18px_48px_rgba(52,211,153,0.3)] transition-all hover:bg-emerald-300 active:scale-[0.98]',
    footer: 'mt-6 w-full max-w-full min-w-0 border-t border-white/10 bg-transparent px-0 pb-0 pt-5',
    footerAction: 'flex flex-wrap items-center justify-center gap-1 text-center',
    footerActionText: 'text-sm font-medium text-slate-400',
    footerActionLink: 'text-sm font-black text-emerald-300 transition-colors hover:text-emerald-200',
    formFieldAction: 'text-xs font-bold text-emerald-300 hover:text-emerald-200',
    identityPreview: 'w-full max-w-full min-w-0 rounded-2xl border border-white/10 bg-white/[0.07]',
    identityPreviewText: 'min-w-0 truncate text-white',
    identityPreviewEditButton: 'text-emerald-300 hover:text-emerald-200',
    otpCodeFieldInput: 'rounded-xl border-white/10 bg-white/[0.07] text-white focus:border-emerald-300',
    alert: 'w-full max-w-full rounded-2xl border border-red-400/20 bg-red-500/10 text-red-100',
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
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(16,185,129,0.24),transparent_34%),radial-gradient(circle_at_86%_90%,rgba(99,102,241,0.18),transparent_36%),linear-gradient(180deg,#030712_0%,#07111f_52%,#020617_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.032)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.032)_1px,transparent_1px)] bg-[size:60px_60px] opacity-25" />
      <div className="pointer-events-none absolute left-1/2 top-[-16rem] h-[44rem] w-[44rem] -translate-x-1/2 rounded-full bg-emerald-400/18 blur-3xl" />

      <div className="relative mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-[760px] flex-col justify-center">
        <header className="mb-8 flex justify-center">
          <a href="/" className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.065] px-4 py-2.5 shadow-2xl shadow-black/20 backdrop-blur-xl transition-all hover:border-emerald-300/35 hover:bg-white/[0.1]">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-400 text-slate-950 shadow-xl shadow-emerald-400/25">
              <Store className="h-5 w-5" />
            </span>
            <span className="text-2xl font-black tracking-[-0.045em] text-white">ShopForge</span>
          </a>
        </header>

        <section className="rounded-[40px] border border-white/10 bg-white/[0.075] p-2.5 shadow-[0_45px_140px_rgba(0,0,0,0.55)] backdrop-blur-2xl sm:rounded-[48px] sm:p-3">
          <div className="rounded-[34px] border border-white/10 bg-slate-950/90 p-5 shadow-2xl shadow-black/35 sm:rounded-[42px] sm:p-8 md:p-10">
            <div className="text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-[24px] border border-emerald-300/25 bg-emerald-400 text-slate-950 shadow-[0_24px_70px_rgba(52,211,153,0.34)]">
                {content.icon === 'lock' ? <LockKeyhole className="h-7 w-7" /> : <Zap className="h-8 w-8" />}
              </div>

              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-emerald-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-300">
                <Sparkles className="h-3.5 w-3.5" />
                {content.eyebrow}
              </div>

              <h1 className="text-3xl font-black leading-tight tracking-[-0.045em] text-white sm:text-4xl md:text-5xl">
                {content.title}
              </h1>
              <p className="mx-auto mt-3 max-w-xl text-sm font-medium leading-6 text-slate-400 sm:text-base sm:leading-7">
                {content.description}
              </p>
            </div>

            <div className="my-8 grid grid-cols-3 gap-2.5 sm:gap-3">
              {content.benefits.map((benefit) => (
                <div key={benefit} className="rounded-2xl border border-white/10 bg-white/[0.055] p-3 text-center shadow-xl shadow-black/10 backdrop-blur-xl sm:rounded-3xl sm:p-4">
                  <CheckCircle2 className="mx-auto mb-2 h-4 w-4 text-emerald-300 sm:h-5 sm:w-5" />
                  <p className="text-[10px] font-black leading-snug text-white sm:text-xs md:text-sm">{benefit}</p>
                </div>
              ))}
            </div>

            <div className="w-full min-w-0 rounded-[28px] border border-white/10 bg-white/[0.04] p-4 shadow-inner shadow-black/20 sm:p-7 md:p-8">
              {children}
            </div>

            <p className="mt-7 text-center text-sm font-medium text-slate-400">
              {content.cta}{' '}
              <a href={content.ctaHref} className="font-black text-emerald-300 hover:text-emerald-200">
                {content.ctaLabel}
              </a>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
