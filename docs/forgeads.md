
# ForgeAds — primeira versão

Disponível no Professional, Business e Enterprise. Rascunhos, biblioteca privada,
consulta das contas/campanhas via API, e geração de copy com a carteira ForgePilot
(15 tokens). Nenhuma campanha externa é criada ou publicada nesta versão.
Dados externos são consultados sob pedido (até 100 campanhas, últimos 30 dias),
sem agregação entre moedas. Google suporta apenas contas diretamente acessíveis,
não a expansão de hierarquias MCC. Meta solicita ads_read (e ads_management quando as alterações externas forem ativadas).

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
Sem publicação de novas campanhas, edição externa de criativos/orçamentos, métricas de conversão/ROAS, hierarquia Google MCC,
paginação completa, agendamento automático ou upload de criativos para as plataformas.
A desconexão remove a autorização local; revogar consentimento na plataforma se necessário.

## Gestão de estado (opt-in)
Por omissão apenas leitura. Depois de validar ambas as integrações com contas
de teste, configurar ADS_ENABLE_WRITES=true e religar Meta para obter
ads_management. O painel permite pausar/reativar campanhas existentes, com
confirmação explícita (reativar pode gerar despesas). O servidor revalida
propriedade da loja, plano, conta e campanha antes da alteração.
Nenhuma alteração é executada pelo ForgePilot automaticamente.


## Independent mode
No advertising credentials needed for drafts, previews, chunked private uploads (images 3 MB, videos 25 MB, 100 MB/store), scenario simulator, campaign briefing CSV, partial paused Google Search Editor CSV, UTM links and local CSV report mapping. Meta native import is not implemented. Reports are session-local, not live. Forecast and reports use the existing ForgePilot draft token charge. No new external ad spend or publishing. Apply migrations/20261124_forgeads_media.sql before deploy.
