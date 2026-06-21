import type { ReactNode } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  BadgeCheck,
  CheckCircle2,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  Store,
  Zap,
} from 'lucide-react';

const authContent = {
  login: {
    eyebrow: 'Acesso seguro',
    title: 'Entrar na ShopForge',
    description: 'Acede ao teu painel premium para gerir lojas, produtos, pedidos e ferramentas de IA sem distrações.',
    cta: 'Ainda não tens conta?',
    ctaLabel: 'Criar conta grátis',
    ctaHref: '/register',
    icon: 'lock',
    sideTitle: 'Volta ao teu centro de comando.',
    sideDescription: 'Toda a gestão da tua loja num ambiente rápido, elegante e preparado para marcas sérias.',
    highlight: 'Sessão protegida com Clerk',
    benefits: ['Dashboard premium', 'Gestão de lojas', 'Ferramentas com IA'],
    stats: [
      { value: '99.9%', label: 'uptime' },
      { value: '24/7', label: 'acesso' },
    ],
  },
  register: {
    eyebrow: 'Nova conta',
    title: 'Criar conta ShopForge',
    description: 'Começa a criar lojas online com templates premium, produtos, checkout e automações inteligentes.',
    cta: 'Já tens conta?',
    ctaLabel: 'Entrar',
    ctaHref: '/login',
    icon: 'zap',
    sideTitle: 'Lança a tua próxima loja com presença premium.',
    sideDescription: 'Cria uma conta e desbloqueia uma experiência moderna para vender, analisar e escalar.',
    highlight: 'Setup rápido e seguro',
    benefits: ['Templates modernos', 'Produtos com IA', 'Checkout preparado'],
    stats: [
      { value: '5 min', label: 'setup' },
      { value: 'IA', label: 'incluída' },
    ],
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
    borderRadius: '20px',
    fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
  },
  elements: {
    rootBox: 'mx-auto w-full max-w-[440px] min-w-0 overflow-hidden',
    cardBox: 'w-full max-w-full min-w-0 overflow-hidden rounded-none bg-transparent shadow-none',
    card: 'w-full max-w-full min-w-0 rounded-none border-0 bg-transparent p-0 shadow-none',
    header: 'hidden',
    headerTitle: 'hidden',
    headerSubtitle: 'hidden',
    main: 'w-full max-w-full min-w-0 px-0 pb-0 pt-0',
    socialButtons: 'w-full max-w-full min-w-0 space-y-3',
    socialButtonsBlockButton: 'flex h-14 w-full max-w-full min-w-0 items-center justify-center gap-3 overflow-hidden rounded-[22px] border border-white/10 bg-white/[0.075] px-4 text-sm font-black text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:border-emerald-300/45 hover:bg-white/[0.11] hover:shadow-[0_18px_45px_rgba(0,0,0,0.22)]',
    socialButtonsBlockButtonText: 'min-w-0 max-w-full truncate text-white',
    dividerRow: 'my-6 w-full max-w-full min-w-0',
    dividerLine: 'bg-white/10',
    dividerText: 'px-3 text-xs font-black uppercase tracking-[0.16em] text-slate-500',
    form: 'w-full max-w-full min-w-0 space-y-4',
    formFieldRow: 'w-full max-w-full min-w-0',
    formField: 'w-full max-w-full min-w-0',
    formFieldLabel: 'mb-2 text-[11px] font-black uppercase tracking-[0.16em] text-slate-300',
    formFieldInput: 'h-14 w-full max-w-full min-w-0 rounded-[22px] border border-white/10 bg-slate-950/55 px-4 text-sm font-bold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] outline-none transition-all placeholder:text-slate-600 focus:border-emerald-300/70 focus:bg-slate-950/80 focus:ring-4 focus:ring-emerald-300/10',
    formButtonPrimary: 'mt-3 h-14 w-full max-w-full min-w-0 rounded-[22px] bg-emerald-400 text-sm font-black text-slate-950 shadow-[0_22px_65px_rgba(52,211,153,0.32)] transition-all hover:-translate-y-0.5 hover:bg-emerald-300 active:scale-[0.98]',
    footer: 'hidden',
    footerAction: 'hidden',
    footerActionText: 'hidden',
    footerActionLink: 'hidden',
    formFieldAction: 'text-xs font-black text-emerald-300 transition-colors hover:text-emerald-200',
    identityPreview: 'w-full max-w-full min-w-0 rounded-[22px] border border-white/10 bg-white/[0.075]',
    identityPreviewText: 'min-w-0 truncate text-white',
    identityPreviewEditButton: 'text-emerald-300 hover:text-emerald-200',
    otpCodeFieldInput: 'rounded-2xl border-white/10 bg-slate-950/60 text-white focus:border-emerald-300',
    alert: 'w-full max-w-full rounded-[22px] border border-red-400/20 bg-red-500/10 text-red-100',
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
    <main className="relative min-h-screen overflow-hidden bg-[#020617] px-4 py-5 text-white sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_8%,rgba(16,185,129,0.26),transparent_30%),radial-gradient(circle_at_88%_18%,rgba(59,130,246,0.16),transparent_30%),radial-gradient(circle_at_50%_100%,rgba(52,211,153,0.18),transparent_36%),linear-gradient(135deg,#020617_0%,#07111f_52%,#020617_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:72px_72px] opacity-20" />
      <div className="pointer-events-none absolute left-1/2 top-[-18rem] h-[44rem] w-[44rem] -translate-x-1/2 rounded-full bg-emerald-400/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-14rem] right-[-8rem] h-[34rem] w-[34rem] rounded-full bg-cyan-400/10 blur-3xl" />

      <div className="relative mx-auto flex min-h-[calc(100vh-2.5rem)] w-full max-w-6xl flex-col">
        <header className="mb-6 flex items-center justify-between gap-4 sm:mb-8">
          <Link href="/" className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.065] px-3 py-2 shadow-2xl shadow-black/20 backdrop-blur-xl transition-all hover:border-emerald-300/35 hover:bg-white/[0.1] sm:px-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-400 text-slate-950 shadow-xl shadow-emerald-400/25 sm:h-11 sm:w-11">
              <Store className="h-5 w-5" />
            </span>
            <span className="text-xl font-black tracking-[-0.045em] text-white sm:text-2xl">ShopForge</span>
          </Link>

          <Link href="/" className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.045] px-4 py-2.5 text-xs font-black uppercase tracking-[0.16em] text-slate-300 backdrop-blur-xl transition-all hover:border-emerald-300/35 hover:text-white sm:inline-flex">
            <ArrowLeft className="h-4 w-4" />
            Voltar ao site
          </Link>
        </header>

        <section className="grid flex-1 items-center gap-5 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8">
          <aside className="relative hidden overflow-hidden rounded-[44px] border border-white/10 bg-white/[0.06] p-8 shadow-[0_40px_130px_rgba(0,0,0,0.48)] backdrop-blur-2xl lg:block xl:p-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(52,211,153,0.28),transparent_34%),radial-gradient(circle_at_88%_78%,rgba(99,102,241,0.16),transparent_35%)]" />
            <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full border border-emerald-300/15" />
            <div className="absolute -bottom-16 left-10 h-48 w-48 rounded-full bg-emerald-300/10 blur-3xl" />

            <div className="relative z-10 flex min-h-[620px] flex-col justify-between">
              <div>
                <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-emerald-200">
                  <Sparkles className="h-4 w-4" />
                  {content.highlight}
                </div>

                <h1 className="max-w-xl text-5xl font-black leading-[0.92] tracking-[-0.07em] text-white xl:text-6xl">
                  {content.sideTitle}
                </h1>
                <p className="mt-6 max-w-lg text-base font-medium leading-8 text-slate-300">
                  {content.sideDescription}
                </p>
              </div>

              <div className="space-y-5">
                <div className="grid grid-cols-3 gap-3">
                  {content.benefits.map((benefit) => (
                    <div key={benefit} className="rounded-[26px] border border-white/10 bg-slate-950/35 p-4 shadow-xl shadow-black/10 backdrop-blur-xl">
                      <CheckCircle2 className="mb-3 h-5 w-5 text-emerald-300" />
                      <p className="text-sm font-black leading-snug text-white">{benefit}</p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {content.stats.map((stat) => (
                    <div key={stat.label} className="rounded-[30px] border border-white/10 bg-white/[0.06] p-5 backdrop-blur-xl">
                      <p className="text-3xl font-black tracking-[-0.04em] text-white">{stat.value}</p>
                      <p className="mt-1 text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          <div className="mx-auto w-full max-w-[520px] lg:max-w-none">
            <section className="relative overflow-hidden rounded-[34px] border border-white/10 bg-white/[0.075] p-4 shadow-[0_35px_115px_rgba(0,0,0,0.5)] backdrop-blur-2xl sm:rounded-[44px] sm:p-6 lg:p-8">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(52,211,153,0.17),transparent_36%)]" />
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/45 to-transparent" />

              <div className="relative z-10">
                <div className="mb-7 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[24px] border border-emerald-300/25 bg-emerald-400 text-slate-950 shadow-[0_24px_70px_rgba(52,211,153,0.34)]">
                    {content.icon === 'lock' ? <LockKeyhole className="h-7 w-7" /> : <Zap className="h-8 w-8" />}
                  </div>

                  <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-300/15 bg-emerald-400/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {content.eyebrow}
                  </div>

                  <h2 className="text-[clamp(2.05rem,8vw,3.65rem)] font-black leading-[0.95] tracking-[-0.06em] text-white">
                    {content.title}
                  </h2>
                  <p className="mx-auto mt-4 max-w-md text-sm font-medium leading-6 text-slate-400 sm:text-base sm:leading-7">
                    {content.description}
                  </p>
                </div>

                <div className="mb-7 grid grid-cols-3 gap-2.5">
                  {content.benefits.map((benefit) => (
                    <div key={benefit} className="rounded-[22px] border border-white/10 bg-white/[0.055] p-3 text-center shadow-xl shadow-black/10 backdrop-blur-xl sm:p-4">
                      <BadgeCheck className="mx-auto mb-2 h-4 w-4 text-emerald-300 sm:h-5 sm:w-5" />
                      <p className="text-[10px] font-black leading-snug text-white sm:text-xs">{benefit}</p>
                    </div>
                  ))}
                </div>

                <div className="w-full min-w-0 overflow-hidden">
                  {children}
                </div>

                <p className="mt-7 text-center text-sm font-medium text-slate-400">
                  {content.cta}{' '}
                  <Link href={content.ctaHref} className="font-black text-emerald-300 transition-colors hover:text-emerald-200">
                    {content.ctaLabel}
                  </Link>
                </p>
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
