import type { ReactNode } from 'react';
import { BarChart3, CheckCircle2, LockKeyhole, PackageCheck, ShieldCheck, Sparkles, Store, Zap } from 'lucide-react';

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
    stat: '24/7',
    statLabel: 'gestão online',
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
    stat: 'IA',
    statLabel: 'lojas em minutos',
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
    rootBox: 'w-full max-w-full min-w-0',
    cardBox: 'w-full max-w-full min-w-0 shadow-none',
    card: 'w-full max-w-full min-w-0 rounded-none border-0 bg-transparent p-0 shadow-none',
    header: 'hidden',
    headerTitle: 'hidden',
    headerSubtitle: 'hidden',
    main: 'w-full max-w-full min-w-0 px-0 pb-0 pt-0',
    socialButtons: 'w-full max-w-full min-w-0',
    socialButtonsBlockButton: 'flex h-13 w-full max-w-full min-w-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] px-4 text-sm font-bold text-white shadow-none transition-all hover:border-emerald-300/50 hover:bg-white/[0.1]',
    socialButtonsBlockButtonText: 'min-w-0 max-w-full truncate text-white',
    dividerRow: 'my-6 w-full max-w-full min-w-0',
    dividerLine: 'bg-white/10',
    dividerText: 'px-3 text-xs font-bold text-slate-400',
    form: 'w-full max-w-full min-w-0 space-y-4',
    formFieldRow: 'w-full max-w-full min-w-0',
    formField: 'w-full max-w-full min-w-0',
    formFieldLabel: 'mb-2 text-[11px] font-black uppercase tracking-[0.12em] text-slate-300',
    formFieldInput: 'h-13 w-full max-w-full min-w-0 rounded-2xl border border-white/10 bg-white/[0.06] px-4 text-sm font-semibold text-white shadow-inner outline-none transition-all placeholder:text-slate-500 focus:border-emerald-300 focus:bg-white/[0.1] focus:ring-4 focus:ring-emerald-300/10',
    formFieldInputShowPasswordButton: 'text-slate-400 hover:text-white',
    formButtonPrimary: 'mt-2 h-13 w-full max-w-full min-w-0 rounded-2xl bg-emerald-400 text-sm font-black text-slate-950 shadow-[0_18px_45px_rgba(52,211,153,0.28)] transition-all hover:bg-emerald-300 active:scale-[0.98]',
    footer: 'mt-6 w-full max-w-full min-w-0 border-t border-white/10 bg-transparent px-0 pb-0 pt-5',
    footerAction: 'flex flex-wrap items-center justify-center gap-1 text-center',
    footerActionText: 'text-sm font-medium text-slate-400',
    footerActionLink: 'text-sm font-black text-emerald-300 transition-colors hover:text-emerald-200',
    formFieldAction: 'text-xs font-bold text-emerald-300 hover:text-emerald-200',
    identityPreview: 'w-full max-w-full min-w-0 rounded-2xl border border-white/10 bg-white/[0.055]',
    identityPreviewText: 'min-w-0 truncate text-white',
    identityPreviewEditButton: 'text-emerald-300 hover:text-emerald-200',
    otpCodeFieldInput: 'rounded-xl border-white/10 bg-white/[0.06] text-white focus:border-emerald-300',
    alert: 'w-full max-w-full rounded-2xl border border-red-400/20 bg-red-500/10 text-red-100',
    formResendCodeLink: 'text-emerald-300 hover:text-emerald-200',
    backLink: 'text-emerald-300 hover:text-emerald-200',
  },
};

type AuthShellProps = {
  mode: 'login' | 'register';
  children: ReactNode;
};

const featureIcons = [BarChart3, PackageCheck, Sparkles];

export function AuthShell({ mode, children }: AuthShellProps) {
  const content = authContent[mode];

  return (
    <main className="sf-auth-page relative min-h-screen overflow-x-hidden bg-[#030712] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(52,211,153,0.22),transparent_32%),radial-gradient(circle_at_90%_85%,rgba(99,102,241,0.22),transparent_35%),linear-gradient(180deg,#030712_0%,#07111f_48%,#020617_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:58px_58px] opacity-25" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-emerald-400/20 blur-3xl" />

      <div className="relative mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-6xl items-center justify-center">
        <section className="grid w-full min-w-0 overflow-hidden rounded-[36px] border border-white/10 bg-white/[0.065] p-2.5 shadow-[0_45px_140px_rgba(0,0,0,0.55)] backdrop-blur-2xl lg:grid-cols-[minmax(0,1fr)_minmax(500px,540px)] lg:rounded-[44px] lg:p-3">
          <div className="relative hidden min-h-[650px] overflow-hidden rounded-[34px] border border-white/10 bg-[radial-gradient(circle_at_22%_16%,rgba(52,211,153,0.28),transparent_28%),linear-gradient(145deg,rgba(16,185,129,0.18),rgba(2,6,23,0.82)_48%,rgba(15,23,42,0.92))] p-10 lg:flex lg:flex-col lg:justify-between xl:p-12">
            <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-emerald-300/20 blur-3xl" />
            <div className="absolute -bottom-32 right-0 h-80 w-80 rounded-full bg-indigo-400/20 blur-3xl" />
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:44px_44px] opacity-25" />

            <div className="relative">
              <div className="mb-10 inline-flex items-center gap-3 rounded-full border border-white/12 bg-white/[0.08] px-4 py-2 text-[11px] font-black uppercase tracking-[0.24em] text-emerald-200 shadow-xl shadow-black/20 backdrop-blur-xl">
                <Store className="h-4 w-4" />
                ShopForge Studio
              </div>

              <p className="mb-4 text-xs font-black uppercase tracking-[0.28em] text-emerald-300">{content.eyebrow}</p>
              <h1 className="max-w-xl text-5xl font-black leading-[0.96] tracking-[-0.055em] text-white xl:text-6xl">
                {content.title}
              </h1>
              <p className="mt-6 max-w-lg text-lg font-medium leading-8 text-slate-300">
                {content.description}
              </p>

              <div className="mt-10 grid max-w-xl grid-cols-3 gap-3">
                {content.benefits.map((benefit, index) => {
                  const Icon = featureIcons[index] || CheckCircle2;

                  return (
                    <div key={benefit} className="rounded-3xl border border-white/10 bg-slate-950/35 p-4 shadow-2xl shadow-black/10 backdrop-blur-xl">
                      <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-400/12 text-emerald-300">
                        <Icon className="h-5 w-5" />
                      </div>
                      <p className="text-sm font-black leading-snug text-white">{benefit}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="relative rounded-[34px] border border-white/10 bg-slate-950/45 p-5 shadow-2xl shadow-black/20 backdrop-blur-2xl">
              <div className="flex items-center justify-between gap-4 rounded-[26px] bg-slate-950/75 p-5">
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-400 text-slate-950 shadow-xl shadow-emerald-400/25">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-white">Conta protegida</p>
                    <p className="mt-1 truncate text-xs font-semibold text-slate-400">Autenticação segura com Clerk</p>
                  </div>
                </div>
                <div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-right">
                  <p className="text-2xl font-black text-emerald-300">{content.stat}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-100/70">{content.statLabel}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex min-w-0 flex-col justify-center rounded-[28px] border border-white/10 bg-slate-950/86 p-5 shadow-2xl shadow-black/35 sm:p-7 lg:rounded-[34px] lg:p-9">
            <div className="mb-7 text-center lg:text-left">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-[22px] border border-emerald-300/25 bg-emerald-400 text-slate-950 shadow-[0_24px_70px_rgba(52,211,153,0.32)] lg:mx-0">
                {mode === 'login' ? <LockKeyhole className="h-6 w-6" /> : <Zap className="h-7 w-7" />}
              </div>
              <div className="mb-3 inline-flex max-w-full items-center gap-2 rounded-full bg-emerald-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-300">
                <Sparkles className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Seguro</span>
              </div>
              <h2 className="text-3xl font-black leading-tight tracking-[-0.045em] text-white sm:text-4xl lg:text-[42px]">
                {content.cardTitle}
              </h2>
              <p className="mx-auto mt-3 max-w-md text-sm font-medium leading-6 text-slate-400 lg:mx-0">
                {content.cardDescription}
              </p>
            </div>

            <div className="mb-6 grid grid-cols-3 gap-2 lg:hidden">
              {content.benefits.map((benefit) => (
                <div key={benefit} className="rounded-2xl border border-white/10 bg-white/[0.055] p-2.5 text-center shadow-xl shadow-black/10 backdrop-blur-xl">
                  <CheckCircle2 className="mx-auto mb-1.5 h-4 w-4 text-emerald-300" />
                  <p className="text-[9px] font-black leading-snug text-white sm:text-[11px]">{benefit}</p>
                </div>
              ))}
            </div>

            <div className="sf-clerk-auth w-full min-w-0 rounded-[28px] border border-white/10 bg-white/[0.035] p-5 shadow-inner shadow-black/20 sm:p-6">
              {children}
            </div>

            <p className="mt-6 text-center text-sm font-medium text-slate-400">
              {content.cta}{' '}
              <a href={content.ctaHref} className="font-black text-emerald-300 hover:text-emerald-200">
                {content.ctaLabel}
              </a>
            </p>
          </div>
        </section>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
            .sf-auth-page,
            .sf-auth-page * {
              box-sizing: border-box;
            }

            .sf-clerk-auth,
            .sf-clerk-auth .cl-rootBox,
            .sf-clerk-auth .cl-cardBox,
            .sf-clerk-auth .cl-card,
            .sf-clerk-auth .cl-main,
            .sf-clerk-auth .cl-socialButtons,
            .sf-clerk-auth .cl-socialButtonsBlockButton,
            .sf-clerk-auth .cl-dividerRow,
            .sf-clerk-auth .cl-form,
            .sf-clerk-auth .cl-formField,
            .sf-clerk-auth .cl-formFieldRow,
            .sf-clerk-auth .cl-formFieldInput,
            .sf-clerk-auth .cl-formButtonPrimary,
            .sf-clerk-auth .cl-footer {
              width: 100% !important;
              max-width: 100% !important;
              min-width: 0 !important;
            }

            .sf-clerk-auth .cl-card,
            .sf-clerk-auth .cl-main,
            .sf-clerk-auth .cl-footer {
              overflow: visible !important;
            }

            .sf-clerk-auth .cl-socialButtonsBlockButton,
            .sf-clerk-auth .cl-formFieldInput,
            .sf-clerk-auth .cl-formButtonPrimary {
              display: flex !important;
              min-width: 0 !important;
              overflow: hidden !important;
            }

            .sf-clerk-auth .cl-socialButtonsBlockButtonText,
            .sf-clerk-auth .cl-formFieldInput,
            .sf-clerk-auth .cl-identityPreviewText {
              overflow: hidden !important;
              text-overflow: ellipsis !important;
              white-space: nowrap !important;
            }

            .sf-clerk-auth .cl-footerAction {
              display: flex !important;
              flex-wrap: wrap !important;
              justify-content: center !important;
              gap: 4px !important;
              text-align: center !important;
            }

            .sf-clerk-auth .cl-formFieldLabel {
              white-space: normal !important;
            }

            @media (max-width: 420px) {
              .sf-auth-page {
                padding-left: 10px !important;
                padding-right: 10px !important;
              }

              .sf-clerk-auth {
                padding: 14px !important;
                border-radius: 22px !important;
              }

              .sf-clerk-auth .cl-socialButtonsBlockButton,
              .sf-clerk-auth .cl-formFieldInput,
              .sf-clerk-auth .cl-formButtonPrimary {
                height: 46px !important;
                font-size: 12px !important;
              }

              .sf-clerk-auth .cl-socialButtonsBlockButton {
                padding-left: 10px !important;
                padding-right: 10px !important;
              }
            }
          `,
        }}
      />
    </main>
  );
}
