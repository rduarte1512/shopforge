'use client';

import { motion } from 'motion/react';
import { 
  Zap, 
  Share2, 
  Image as ImageIcon, 
  Video, 
  ExternalLink, 
  CheckCircle2,
  Settings2,
  Rocket
} from 'lucide-react';

const integrations = [
  {
    id: 'socialai',
    name: 'SocialAI',
    description: 'Gestão de redes sociais, geração de imagens e vídeos com IA para impulsionar a sua marca.',
    icon: Rocket,
    url: 'https://socialai-com.vercel.app/',
    category: 'Marketing & Social',
    status: 'Disponível',
    features: [
      'Agendamento de posts',
      'Geração de imagens com IA',
      'Criação de vídeos curtos',
      'Análise de engajamento'
    ],
    color: 'from-blue-600 to-indigo-600'
  }
];

export default function IntegrationsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-text-primary">Integrações</h1>
        <p className="text-text-secondary mt-2">
          Conecte a sua loja com as melhores ferramentas para potenciar o seu negócio.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {integrations.map((integration) => (
          <motion.div
            key={integration.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative bg-card-bg border border-border rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300"
          >
            <div className={`h-2 bg-gradient-to-r ${integration.color}`} />
            
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${integration.color} flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform`}>
                  <integration.icon className="w-6 h-6" />
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[11px] font-bold border border-emerald-100 flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {integration.status}
                </span>
              </div>

              <h3 className="text-xl font-bold text-text-primary mb-2 group-hover:text-primary transition-colors">
                {integration.name}
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed mb-6">
                {integration.description}
              </p>

              <div className="space-y-3 mb-8">
                {integration.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-2 text-[13px] text-text-secondary">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <a
                href={integration.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-bg-gray border border-border text-[14px] font-bold text-text-primary hover:bg-primary hover:text-white hover:border-primary transition-all group/btn"
              >
                <span>Aceder Integração</span>
                <ExternalLink className="w-4 h-4 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
              </a>
            </div>
          </motion.div>
        ))}

        {/* Placeholder for future integrations */}
        <div className="border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center p-8 text-center bg-bg-gray/20">
          <div className="w-12 h-12 rounded-full bg-bg-gray flex items-center justify-center mb-4">
            <Zap className="w-6 h-6 text-text-muted" />
          </div>
          <h3 className="text-[15px] font-bold text-text-primary mb-1">Mais em breve</h3>
          <p className="text-[12px] text-text-muted">Estamos a trabalhar em novas conexões para a sua loja.</p>
        </div>
      </div>

      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[100px] -mr-32 -mt-32" />
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-md">
            <h2 className="text-2xl font-bold mb-4">Deseja uma integração específica?</h2>
            <p className="text-slate-300 text-[15px] leading-relaxed">
              A nossa equipa está constantemente a expandir o ecossistema ShopForge. Se precisa de ligar uma ferramenta específica, entre em contacto connosco.
            </p>
          </div>
          <button className="px-8 py-4 bg-white text-slate-900 rounded-2xl font-bold text-[15px] hover:bg-primary hover:text-white transition-all shadow-xl whitespace-nowrap">
            Sugerir Integração
          </button>
        </div>
      </div>
    </div>
  );
}
