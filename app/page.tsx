"use client";

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { 
  ShoppingBag, 
  ArrowRight, 
  Globe, 
  Sparkles, 
  Zap, 
  ShieldCheck, 
  Smartphone, 
  BarChart3,
  ChevronDown,
  CheckCircle2,
  Layers,
  Rocket,
  Store
} from 'lucide-react';
import { motion } from "motion/react";
import { FeatureCard, PricingCard, HeroMockup } from '@/components/landing/LandingComponents';

const metrics = [
  { label: 'Lojas criadas', value: '15k+' },
  { label: 'Vendas processadas', value: '€2.4M' },
  { label: 'Países ativos', value: '45' },
  { label: 'Disponibilidade', value: '99.99%' },
];

const launchSteps = [
  { step: '01', title: 'Descreva a sua marca', desc: 'Diga o nicho, estilo e público. A IA gera uma loja pronta a vender.' },
  { step: '02', title: 'Personalize em minutos', desc: 'Cores, secções, produtos, imagens e checkout podem ser ajustados sem código.' },
  { step: '03', title: 'Ative pagamentos', desc: 'Cartão, PayPal, Revolut, MB WAY e outros métodos ficam visíveis no checkout.' },
  { step: '04', title: 'Escale com dados', desc: 'Acompanhe encomendas, clientes, cupões, campanhas e relatórios num só painel.' },
];

export default function Home() {
  const { isSignedIn } = useAuth();
  const primaryHref = isSignedIn ? '/dashboard' : '/register';

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(0,128,96,0.13),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(16,185,129,0.10),_transparent_28%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] text-slate-950 selection:bg-primary/20 overflow-hidden">
      <nav className="fixed top-0 left-0 right-0 z-50 px-4 pt-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between rounded-3xl bg-white/85 backdrop-blur-xl border border-white shadow-2xl shadow-black/5 px-4 md:px-5 py-3">
          <Link href="/" className="flex items-center gap-3 font-black tracking-tighter group">
            <div className="w-11 h-11 bg-gradient-to-tr from-primary to-emerald-400 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
              <ShoppingBag className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="block text-xl text-primary-dark leading-none">ShopForge</span>
              <span className="text-[10px] uppercase tracking-[0.25em] text-slate-400 font-black">Commerce OS</span>
            </div>
          </Link>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-black text-slate-500">
            <Link href="#features" className="hover:text-primary transition-colors">Funcionalidades</Link>
            <Link href="#workflow" className="hover:text-primary transition-colors">Como funciona</Link>
            <Link href="#pricing" className="hover:text-primary transition-colors">Preçário</Link>
            <Link href="#faq" className="hover:text-primary transition-colors">FAQ</Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {isSignedIn ? (
              <Link href="/dashboard" className="px-5 py-3 text-sm font-black bg-slate-950 text-white rounded-2xl hover:bg-slate-800 transition-all shadow-lg shadow-black/10">
                Ir para o Painel
              </Link>
            ) : (
              <>
                <Link href="/login" className="hidden sm:inline-flex px-5 py-3 text-sm font-black hover:bg-primary/5 rounded-2xl transition-all text-primary">
                  Entrar
                </Link>
                <Link href="/register" className="px-5 py-3 text-sm font-black bg-primary text-white rounded-2xl hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]">
                  Começar Grátis
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="pt-32">
        <section className="relative max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-14 xl:gap-20 items-center pb-24 md:pb-36">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="relative z-10"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15, duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-primary/15 text-primary text-xs font-black uppercase tracking-[0.2em] mb-7 shadow-xl shadow-primary/5"
            >
              <Sparkles className="w-4 h-4" />
              <span>A nova era das lojas online</span>
            </motion.div>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-[-0.075em] leading-[0.9] mb-8">
              Crie uma loja <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">premium</span> <br />
              em minutos.
            </h1>
            <p className="text-lg md:text-xl text-slate-500 mb-10 max-w-xl leading-relaxed font-medium">
              ShopForge junta IA, checkout, produtos, clientes, relatórios e automações num painel moderno para lançar marcas digitais com aspeto profissional desde o primeiro dia.
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-8">
              <Link 
                href={primaryHref} 
                className="px-8 py-5 bg-slate-950 text-white rounded-3xl font-black flex items-center justify-center gap-2 hover:bg-slate-800 transition-all group shadow-2xl shadow-black/15"
              >
                {isSignedIn ? 'Abrir o meu painel' : 'Criar loja grátis'}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="#features" className="px-8 py-5 bg-white text-slate-950 rounded-3xl font-black flex items-center justify-center gap-2 border border-slate-100 hover:border-primary/20 transition-all shadow-xl shadow-black/5">
                Ver funcionalidades
              </Link>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm font-bold text-slate-500">
              {['Sem código', 'Checkout premium', 'IA integrada'].map(item => (
                <span key={item} className="inline-flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  {item}
                </span>
              ))}
            </div>
          </motion.div>

          <div className="relative">
            <motion.div
              animate={{ y: [0, -16, 0], rotate: [0, 2, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-10 right-8 z-20 hidden md:flex items-center gap-3 rounded-3xl bg-white border border-slate-100 px-4 py-3 shadow-2xl shadow-black/10"
            >
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <Rocket className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400 font-black">Lançamento</p>
                <p className="text-sm font-black">Loja pronta hoje</p>
              </div>
            </motion.div>
            <HeroMockup />
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-6 pb-24">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {metrics.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="rounded-3xl bg-white border border-slate-100 p-6 shadow-xl shadow-black/5"
              >
                <p className="text-3xl md:text-4xl font-black mb-1 text-slate-950">{stat.value}</p>
                <p className="text-xs text-slate-400 font-black uppercase tracking-[0.18em]">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <section id="features" className="py-24 md:py-32 max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-[0.2em] mb-6">
              <Layers className="w-4 h-4" />
              Plataforma completa
            </div>
            <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">Tudo o que precisa para vender melhor.</h2>
            <p className="text-lg text-slate-500 font-medium">Da criação da loja ao checkout, marketing e relatórios, a app fica com uma experiência mais premium e preparada para crescer.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={Zap} 
              title="Performance rápida" 
              description="Lojas modernas, leves e pensadas para converter em qualquer dispositivo."
              delay={0.1}
            />
            <FeatureCard 
              icon={Sparkles} 
              title="IA para criar lojas" 
              description="Gere layout, produtos, textos e imagens alinhadas ao nicho da marca."
              delay={0.2}
            />
            <FeatureCard 
              icon={Globe} 
              title="Venda global" 
              description="Moedas, idiomas e estrutura preparada para marcas que querem escalar."
              delay={0.3}
            />
            <FeatureCard 
              icon={BarChart3} 
              title="Analytics avançado" 
              description="Dashboard claro para entender vendas, clientes, encomendas e campanhas."
              delay={0.4}
            />
            <FeatureCard 
              icon={Smartphone} 
              title="Mobile first" 
              description="Painel e loja otimizados para telemóvel, tablet e desktop."
              delay={0.5}
            />
            <FeatureCard 
              icon={ShieldCheck} 
              title="Checkout premium" 
              description="Métodos como cartão, PayPal, Revolut, MB WAY e Multibanco visíveis no carrinho."
              delay={0.6}
            />
          </div>
        </section>

        <section id="workflow" className="py-24 mx-4 md:mx-6">
          <div className="max-w-7xl mx-auto bg-slate-950 text-white rounded-[3rem] overflow-hidden shadow-2xl shadow-black/20 relative">
            <div className="absolute -top-32 -right-32 w-96 h-96 bg-primary/30 rounded-full blur-3xl" />
            <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-emerald-400/20 rounded-full blur-3xl" />
            <div className="relative z-10 px-8 md:px-16 py-16 md:py-24 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/10 text-white/80 text-xs font-black uppercase tracking-[0.2em] mb-8">
                  <Store className="w-4 h-4" />
                  Fluxo profissional
                </div>
                <h2 className="text-4xl md:text-6xl font-black mb-8 tracking-tight leading-tight">Da ideia à primeira venda com uma experiência premium.</h2>
                <p className="text-white/60 text-lg leading-relaxed">A ShopForge foi pensada para parecer uma plataforma séria desde a landing page até ao carrinho da loja.</p>
              </div>
              <div className="space-y-4">
                {launchSteps.map((item, i) => (
                  <motion.div
                    key={item.step}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                    className="rounded-3xl bg-white/[0.07] border border-white/10 p-5 backdrop-blur-xl"
                  >
                    <div className="flex gap-5">
                      <span className="w-12 h-12 rounded-2xl bg-white text-slate-950 flex items-center justify-center text-sm font-black shrink-0">{item.step}</span>
                      <div>
                        <h3 className="text-lg font-black mb-1">{item.title}</h3>
                        <p className="text-white/58 text-sm leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="pricing" className="py-24 md:py-32 max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">Preços simples e transparentes.</h2>
            <p className="text-lg text-slate-500 font-medium">Comece grátis e faça upgrade quando precisar de mais lojas, produtos e automações.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <PricingCard 
              name="Starter" 
              price="€0" 
              description="Ideal para validar a primeira ideia." 
              features={["1 loja ativa", "Até 50 produtos", "Temas básicos", "Checkout essencial"]} 
              delay={0.1}
            />
            <PricingCard 
              name="Professional" 
              price="€49" 
              description="Para marcas prontas para crescer." 
              features={["10 lojas ativas", "Produtos ilimitados", "Geração de loja por IA", "Analytics avançado", "Suporte prioritário"]} 
              highlight={true}
              delay={0.2}
            />
            <PricingCard 
              name="Business" 
              price="€99" 
              description="Para equipas, agências e escala." 
              features={["25 lojas ativas", "API de integração", "Relatórios customizados", "Gestão de equipa", "Manager dedicado"]} 
              delay={0.3}
            />
          </div>
        </section>

        <section id="faq" className="py-24 bg-white/70 border-y border-slate-100">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-4xl md:text-5xl font-black mb-12 text-center tracking-tight">Perguntas Frequentes</h2>
            <div className="space-y-4">
              {[
                { q: 'Preciso de conhecimentos técnicos?', a: 'Não. A plataforma foi desenhada para criar, gerir e personalizar lojas sem código.' },
                { q: 'A loja tem checkout e métodos de pagamento?', a: 'Sim. A tela de carrinho suporta métodos como cartão, PayPal, Revolut, MB WAY e Multibanco.' },
                { q: 'Posso vender com domínio próprio?', a: 'Sim. Nos planos avançados pode ligar domínio próprio e preparar a marca para escala.' },
                { q: 'Posso cancelar quando quiser?', a: 'Sim. Não existe fidelização e pode ajustar o plano conforme o crescimento da sua loja.' },
              ].map((faq) => (
                <div key={faq.q} className="bg-white border border-slate-100 rounded-3xl p-6 hover:shadow-xl hover:shadow-black/5 transition-all cursor-pointer group">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="font-black text-lg group-hover:text-primary transition-colors">{faq.q}</h3>
                    <ChevronDown className="w-5 h-5 text-slate-400 group-hover:text-primary transition-colors shrink-0" />
                  </div>
                  <p className="mt-4 text-slate-500 leading-relaxed font-medium">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24 md:py-36 px-6">
          <div className="max-w-5xl mx-auto bg-gradient-to-br from-slate-950 to-slate-800 rounded-[3rem] p-10 md:p-20 text-center text-white relative overflow-hidden shadow-2xl shadow-black/20">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/25 rounded-full -mr-48 -mt-48 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-400/20 rounded-full -ml-48 -mb-48 blur-3xl" />
            <h2 className="text-4xl md:text-7xl font-black mb-8 tracking-tight relative z-10">Pronto para lançar?</h2>
            <p className="text-lg md:text-xl text-white/70 mb-10 max-w-2xl mx-auto relative z-10">Crie uma loja online moderna, com checkout premium e um painel profissional para gerir tudo.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
              <Link 
                href={primaryHref} 
                className="w-full sm:w-auto px-10 py-5 bg-white text-slate-950 rounded-3xl font-black text-lg hover:bg-slate-100 transition-all shadow-xl"
              >
                {isSignedIn ? 'Abrir painel' : 'Criar conta grátis'}
              </Link>
              {!isSignedIn && (
                <Link 
                  href="/login" 
                  className="w-full sm:w-auto px-10 py-5 bg-white/10 text-white border border-white/15 rounded-3xl font-black text-lg hover:bg-white/15 transition-all"
                >
                  Fazer login
                </Link>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-white border-t border-slate-100 pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div>
              <div className="flex items-center gap-3 font-black text-2xl tracking-tighter mb-6">
                <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center shadow-md shadow-primary/10">
                  <ShoppingBag className="w-5 h-5 text-white" />
                </div>
                <span className="text-primary-dark">ShopForge</span>
              </div>
              <p className="text-slate-500 text-sm leading-relaxed font-medium">
                A plataforma de e-commerce para criar lojas premium com velocidade, IA e design profissional.
              </p>
            </div>
            {[
              { title: 'Produto', links: ['Funcionalidades', 'Preçário', 'Checkout', 'Integrações'] },
              { title: 'Empresa', links: ['Sobre Nós', 'Blog', 'Carreiras', 'Contacto'] },
              { title: 'Legal', links: ['Privacidade', 'Termos', 'Cookies', 'Segurança'] },
            ].map((group) => (
              <div key={group.title}>
                <h4 className="font-black mb-6 text-slate-950">{group.title}</h4>
                <ul className="space-y-4 text-sm text-slate-500 font-semibold">
                  {group.links.map(link => <li key={link}><Link href="#" className="hover:text-primary transition-colors">{link}</Link></li>)}
                </ul>
              </div>
            ))}
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-center pt-10 border-t border-slate-100 text-sm text-slate-400 font-semibold">
            <p>© 2026 ShopForge SaaS. Todos os direitos reservados.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <span className="hover:text-slate-950 cursor-pointer transition-colors">Twitter</span>
              <span className="hover:text-slate-950 cursor-pointer transition-colors">Instagram</span>
              <span className="hover:text-slate-950 cursor-pointer transition-colors">LinkedIn</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
