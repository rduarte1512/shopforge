import Link from 'next/link';
import { ArrowRight, ShoppingBag, LayoutTemplate, CreditCard, BarChartIcon as ChartBar } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#f5f5f4] text-[#0a0a0a]">
      {/* Navbar */}
      <nav className="flex items-center justify-between p-6 max-w-7xl mx-auto border-b border-gray-200">
        <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
          <ShoppingBag className="w-6 h-6" />
          <span>ShopForge</span>
        </div>
        <div className="flex gap-4">
          <Link href="/login" className="px-5 py-2 font-medium hover:bg-gray-200 rounded-full transition-colors">
            Entrar
          </Link>
          <Link href="/register" className="px-5 py-2 font-medium bg-black text-white rounded-full hover:bg-gray-800 transition-colors">
            Começar Grátis
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 p-6 pt-24 pb-32">
        <div className="flex flex-col justify-center">
          <p className="text-sm font-bold tracking-[0.14em] uppercase mb-4 opacity-70">
            A Plataforma Definitiva de E-Commerce
          </p>
          <h1 className="text-6xl sm:text-7xl lg:text-[112px] leading-[0.88] tracking-[-0.02em] font-semibold mb-8">
            Crie a sua<br/><span className="text-gray-500">loja online.</span>
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-md">
            Comece a vender hoje mesmo. Personalize a sua loja, faça a gestão de produtos e aceite pagamentos, tudo num só lugar.
          </p>
          <div className="flex items-center gap-6">
            <Link 
              href="/register" 
              className="w-24 h-24 rounded-full border border-black flex items-center justify-center uppercase text-[10px] sm:text-xs font-bold tracking-[0.14em] hover:bg-black hover:text-white transition-all hover:scale-105 text-center leading-tight"
            >
              Criar<br/>Loja <ArrowRight className="w-4 h-4 ml-1 inline" />
            </Link>
            <p className="rail-text opacity-50 hidden sm:block">
               Sem cartão de crédito • Cancelar a qualquer momento
            </p>
          </div>
        </div>

        <div className="relative hidden md:block">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[500px] border border-black rounded-[32px] overflow-hidden bg-white shadow-2xl z-10">
            {/* Minimal Dashboard Preview */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
               <div className="h-4 w-32 bg-gray-200 rounded"></div>
               <div className="h-8 w-8 rounded-full bg-gray-200"></div>
            </div>
            <div className="p-6 space-y-6">
               <div className="h-24 w-full bg-orange-50 rounded-2xl flex items-center p-4 border border-orange-100">
                  <div>
                    <p className="text-xs text-orange-600 font-bold uppercase tracking-wide">Vendas Hoje</p>
                    <p className="text-3xl font-light">€ 1,240.50</p>
                  </div>
               </div>
               <div className="space-y-3">
                 <div className="h-4 w-1/3 bg-gray-100 rounded"></div>
                 <div className="border border-gray-100 rounded-xl p-4 flex justify-between items-center">
                    <div className="h-12 w-12 bg-gray-100 rounded-lg"></div>
                    <div className="flex-1 px-4">
                      <div className="h-3 w-2/3 bg-gray-200 rounded mb-2"></div>
                      <div className="h-2 w-1/3 bg-gray-100 rounded"></div>
                    </div>
                 </div>
                 <div className="border border-gray-100 rounded-xl p-4 flex justify-between items-center">
                    <div className="h-12 w-12 bg-gray-100 rounded-lg"></div>
                    <div className="flex-1 px-4">
                      <div className="h-3 w-2/3 bg-gray-200 rounded mb-2"></div>
                      <div className="h-2 w-1/3 bg-gray-100 rounded"></div>
                    </div>
                 </div>
               </div>
            </div>
          </div>
          
          <div className="absolute top-20 right-0 feature-bubble shadow-xl z-20 flex items-center gap-3">
             <div className="bg-green-100 p-2 rounded-full text-green-600"><ChartBar className="w-5 h-5"/></div>
             <span className="font-bold text-sm">Dashboard Analytics</span>
          </div>
          
          <div className="absolute bottom-20 -left-10 feature-bubble shadow-xl z-20 flex items-center gap-3" style={{ transform: 'rotate(6deg)' }}>
             <div className="bg-purple-100 p-2 rounded-full text-purple-600"><LayoutTemplate className="w-5 h-5"/></div>
             <span className="font-bold text-sm">Temas Personalizados</span>
          </div>
        </div>
      </main>

      {/* Simple style additions for the rail text and feature bubbles */}
      <style dangerouslySetInnerHTML={{__html: `
        .rail-text {
          writing-mode: vertical-rl;
          transform: rotate(180deg);
        }
        .feature-bubble {
          border-radius: 9999px;
          background: white;
          border: 1px solid #e5e7eb;
          padding: 16px 24px;
          transform: rotate(-6deg);
        }
      `}} />
    </div>
  );
}
