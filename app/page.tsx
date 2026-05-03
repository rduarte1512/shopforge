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
  ChevronDown
} from 'lucide-react';
import { motion } from "motion/react";
import { FeatureCard, PricingCard, HeroMockup } from '@/components/landing/LandingComponents';

export default function Home() {
  const { isSignedIn } = useAuth();

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-primary/20">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto flex items-center justify-between p-4 md:p-6">
          <div className="flex items-center gap-2 font-bold text-2xl tracking-tighter">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <ShoppingBag className="w-6 h-6 text-white" />
            </div>
            <span className="text-primary-dark">ShopForge</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            <Link href="#features" className="hover:text-primary transition-colors">Funcionalidades</Link>
            <Link href="#pricing" className="hover:text-primary transition-colors">Preçário</Link>
            <Link href="#faq" className="hover:text-primary transition-colors">FAQ</Link>
          </div>

          <div className="flex items-center gap-4">
            {isSignedIn ? (
              <Link href="/dashboard" className="px-5 py-2.5 text-sm font-semibold bg-primary text-white rounded-xl hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]">
                Ir para o Painel
              </Link>
            ) : (
              <>
                <Link href="/login" className="px-5 py-2.5 text-sm font-semibold hover:bg-primary/5 rounded-xl transition-all text-primary">
                  Entrar
                </Link>
                <Link href="/register" className="px-5 py-2.5 text-sm font-semibold bg-primary text-white rounded-xl hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]">
                  Começar Grátis
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="pt-32">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center pb-24 md:pb-40">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-6">
              <Sparkles className="w-3 h-3" />
              <span>A nova era do e-commerce</span>
            </div>
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[0.9] mb-8">
              A sua loja <br />
              <span className="text-gray-400">profissional</span> <br />
              num instante.
            </h1>
            <p className="text-xl text-gray-500 mb-10 max-w-xl leading-relaxed">
              ShopForge é a plataforma tudo-em-um para criar, gerir e escalar o seu negócio online com ferramentas de IA avançadas e design de classe mundial.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Link 
                href={isSignedIn ? "/dashboard" : "/register"} 
                className="w-full sm:w-auto px-8 py-5 bg-primary text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-primary-dark transition-all group shadow-xl shadow-primary/20"
              >
                {isSignedIn ? "Ver o meu Painel" : "Criar Minha Loja"} <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              {!isSignedIn && (
                <p className="text-sm text-gray-400">
                  Teste gratuito de 14 dias • Sem cartão
                </p>
              )}
            </div>
          </motion.div>

          <HeroMockup />
        </section>

        {/* Stats / Social Proof */}
        <section className="bg-primary/5 py-16 border-y border-primary/10">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { label: "Lojas Criadas", value: "15,000+" },
              { label: "Vendas Totais", value: "€2.4M" },
              { label: "Países Ativos", value: "45" },
              { label: "Uptime", value: "99.99%" },
            ].map((stat, i) => (
              <div key={i}>
                <p className="text-3xl font-black mb-1 text-primary-dark">{stat.value}</p>
                <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 md:py-40 max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">Tudo o que precisa para vencer.</h2>
            <p className="text-lg text-gray-500">Desenvolvemos as ferramentas mais poderosas para que se possa focar no que realmente importa: os seus clientes.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={Zap} 
              title="Velocidade Extrema" 
              description="A sua loja carrega instantaneamente em qualquer dispositivo, garantindo a melhor taxa de conversão."
              delay={0.1}
            />
            <FeatureCard 
              icon={Sparkles} 
              title="Assistente de IA" 
              description="Gere descrições de produtos, posts para redes sociais e analise tendências com a nossa IA integrada."
              delay={0.2}
            />
            <FeatureCard 
              icon={Globe} 
              title="Multi-Moeda e Idioma" 
              description="Venda para todo o mundo com suporte nativo a múltiplas moedas e traduções automáticas."
              delay={0.3}
            />
            <FeatureCard 
              icon={BarChart3} 
              title="Analytics Avançado" 
              description="Dashboard completo com insights reais sobre o comportamento dos seus visitantes e vendas."
              delay={0.4}
            />
            <FeatureCard 
              icon={Smartphone} 
              title="Mobile First" 
              description="Interface de gestão e loja otimizada para smartphones, para gerir o seu negócio em qualquer lugar."
              delay={0.5}
            />
            <FeatureCard 
              icon={ShieldCheck} 
              title="Pagamentos Seguros" 
              description="Integração nativa com Stripe, PayPal e MBWay. Segurança total para si e para os seus clientes."
              delay={0.6}
            />
          </div>
        </section>

        {/* How it Works */}
        <section className="py-24 bg-primary text-white rounded-[3rem] mx-4 md:mx-6 overflow-hidden shadow-2xl shadow-primary/20">
          <div className="max-w-7xl mx-auto px-8 md:px-16 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl md:text-6xl font-black mb-12 tracking-tight leading-tight">Da ideia à primeira venda em minutos.</h2>
              <div className="space-y-12">
                {[
                  { step: "01", title: "Crie a sua conta", desc: "Registe-se em segundos e dê um nome à sua loja de sonho." },
                  { step: "02", title: "Adicione os produtos", desc: "Use a nossa IA para criar descrições apelativas e faça upload de fotos." },
                  { step: "03", title: "Personalize o design", desc: "Escolha entre dezenas de temas profissionais e adapte à sua marca." },
                  { step: "04", title: "Comece a vender", desc: "Ative os pagamentos e partilhe o seu link com o mundo." },
                ].map((item, i) => (
                  <div key={i} className="flex gap-6">
                    <span className="text-2xl font-black text-white/40">{item.step}</span>
                    <div>
                      <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                      <p className="text-white/70">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square bg-white/20 rounded-full blur-[120px] absolute inset-0" />
              <div className="relative bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[2rem] p-8">
                 <div className="aspect-video bg-white/5 rounded-xl flex items-center justify-center border border-white/5">
                    <ShoppingBag className="w-20 h-20 text-white/40" />
                 </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-24 md:py-40 max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">Preços simples e transparentes.</h2>
            <p className="text-lg text-gray-500">Sem taxas ocultas. Escolha o plano que melhor se adapta ao seu momento.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <PricingCard 
              name="Iniciante" 
              price="€0" 
              description="Ideal para quem está a começar agora." 
              features={["Até 5 produtos", "1 utilizador", "Dashboard básico", "Pagamentos via Stripe"]} 
              delay={0.1}
            />
            <PricingCard 
              name="Profissional" 
              price="€29" 
              description="O plano perfeito para crescer o seu negócio." 
              features={["Produtos ilimitados", "3 utilizadores", "Assistente de IA", "Domínio personalizado", "Analytics avançado"]} 
              highlight={true}
              delay={0.2}
            />
            <PricingCard 
              name="Enterprise" 
              price="€99" 
              description="Para lojas que precisam de escala máxima." 
              features={["Tudo no Profissional", "Utilizadores ilimitados", "Suporte prioritário 24/7", "API de acesso total", "Multi-loja"]} 
              delay={0.3}
            />
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-24 bg-gray-50">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-4xl font-black mb-16 text-center">Perguntas Frequentes</h2>
            <div className="space-y-4">
              {[
                { q: "Preciso de conhecimentos técnicos para criar a loja?", a: "Não! A ShopForge foi desenhada para ser intuitiva. Se sabe usar um navegador, sabe criar uma loja connosco." },
                { q: "Posso usar o meu próprio domínio?", a: "Sim, no plano Profissional e Enterprise pode ligar o seu domínio personalizado (.pt, .com, etc)." },
                { q: "Quais são as taxas de transação?", a: "Não cobramos taxas de transação sobre as suas vendas. Apenas as taxas normais do processador de pagamentos (Stripe/PayPal)." },
                { q: "Posso cancelar a minha subscrição?", a: "A qualquer momento, sem fidelizações. Se cancelar, a sua loja ficará ativa até ao fim do período pago." },
              ].map((faq, i) => (
                <div key={i} className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-md transition-shadow cursor-pointer group">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-lg group-hover:text-primary transition-colors">{faq.q}</h3>
                    <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
                  </div>
                  <p className="mt-4 text-gray-500 leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 md:py-40 px-6">
          <div className="max-w-5xl mx-auto bg-primary rounded-[3rem] p-12 md:p-24 text-center text-white relative overflow-hidden shadow-2xl shadow-primary/20">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -mr-48 -mt-48 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-black/10 rounded-full -ml-48 -mb-48 blur-3xl" />
            
            <h2 className="text-5xl md:text-7xl font-black mb-8 tracking-tight relative z-10">Pronto para começar?</h2>
            <p className="text-xl opacity-90 mb-12 max-w-2xl mx-auto relative z-10">Junte-se a milhares de empreendedores que já estão a vender com a ShopForge.</p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 relative z-10">
              {isSignedIn ? (
                <Link 
                  href="/dashboard" 
                  className="w-full sm:w-auto px-10 py-6 bg-white text-primary rounded-2xl font-bold text-lg hover:bg-gray-50 transition-all shadow-xl"
                >
                  Ir para o Painel
                </Link>
              ) : (
                <>
                  <Link 
                    href="/register" 
                    className="w-full sm:w-auto px-10 py-6 bg-white text-primary rounded-2xl font-bold text-lg hover:bg-gray-50 transition-all shadow-xl"
                  >
                    Criar Conta Grátis
                  </Link>
                  <Link 
                    href="/login" 
                    className="w-full sm:w-auto px-10 py-6 bg-white/10 text-white border border-white/20 rounded-2xl font-bold text-lg hover:bg-white/20 transition-all"
                  >
                    Fazer Login
                  </Link>
                </>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-24">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-2 font-bold text-2xl tracking-tighter mb-6">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-md shadow-primary/10">
                  <ShoppingBag className="w-4 h-4 text-white" />
                </div>
                <span className="text-primary-dark">ShopForge</span>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed">
                A plataforma de e-commerce que capacita a próxima geração de marcas digitais.
              </p>
            </div>
            
            <div>
              <h4 className="font-bold mb-6 text-primary-dark">Produto</h4>
              <ul className="space-y-4 text-sm text-gray-500">
                <li><Link href="#features" className="hover:text-primary transition-colors">Funcionalidades</Link></li>
                <li><Link href="#pricing" className="hover:text-primary transition-colors">Preçário</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">API</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Integrações</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-6 text-primary-dark">Empresa</h4>
              <ul className="space-y-4 text-sm text-gray-500">
                <li><Link href="#" className="hover:text-primary transition-colors">Sobre Nós</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Carreiras</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Blog</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Contacto</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-6 text-primary-dark">Legal</h4>
              <ul className="space-y-4 text-sm text-gray-500">
                <li><Link href="#" className="hover:text-primary transition-colors">Privacidade</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Termos</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Cookies</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-center pt-12 border-t border-gray-100 text-sm text-gray-400">
            <p>© 2026 ShopForge SaaS. Todos os direitos reservados.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <span className="hover:text-black cursor-pointer transition-colors">Twitter</span>
              <span className="hover:text-black cursor-pointer transition-colors">Instagram</span>
              <span className="hover:text-black cursor-pointer transition-colors">LinkedIn</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

