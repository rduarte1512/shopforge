
# ForgeAds — primeira versão

Disponível no Professional, Business e Enterprise. Rascunhos, biblioteca privada,
consulta das contas/campanhas via API, e geração de copy com a carteira ForgePilot
(15 tokens). Nenhuma campanha externa é criada ou publicada nesta versão.
Dados externos são consultados sob pedido (até 100 campanhas, últimos 30 dias),
sem agregação entre moedas. Google suporta apenas contas diretamente acessíveis,
não a expansão de hierarquias MCC. Meta solicita ads_read.

## Ativação
1. Aplicar migrations/20261124_forgeads.sql na base Neon efetiva do ShopForge.
2. Criar ADS_ENCRYPTION_KEY (openssl rand -hex 32) e ADS_APP_URL (origem HTTPS de produção).
3. Configurar app Meta com Marketing API e Facebook Login, autorização ads_read,
   e callback ADS_APP_URL/api/ads/meta/callback. App Review/Advanced Access para terceiros.
4. Configurar projeto Google Cloud, consentimento OAuth, Google Ads API,
   credenciais Web e callback ADS_APP_URL/api/ads/google/callback. Configurar
   GOOGLE_ADS_DEVELOPER_TOKEN quando exigido para o projeto.
5. Preencher as variáveis do .env.example na Vercel (não usar NEXT_PUBLIC para segredos).
   A chave de encriptação deve permanecer estável; a rotação requer migrar os tokens.
6. Validar com contas de teste e verificar consentimento, reconexão, revogação,
   permissões, isolamento entre lojas e cobrança de tokens.

Limites desta versão: não replica os editores completos nativos; países e públicos são
briefings, não IDs validados das plataformas. Criativos pequenos em Postgres (3 MB,
30 MB por loja); para vídeo de produção migrar para object storage com upload direto.
Sem publicação, edição externa, métricas de conversão/ROAS, hierarquia Google MCC,
paginação completa, agendamento automático ou upload de criativos para as plataformas.
A desconexão remove a autorização local; revogar consentimento na plataforma se necessário.
