# Entregáveis — GetSupply

Site publicado: https://getsupply-api-server-6vdh.vercel.app

## 1. Title, Meta Description e H1

Aplicados em `artifacts/getsupply-app/index.html` (Title e Description) e na Home, `artifacts/getsupply-app/src/App.tsx` (H1).

| Elemento | Texto |
|---|---|
| Title | GetSupply \| Fornecedores de embalagens para sua marca |
| Meta Description | Crie um pedido de cotação, receba propostas de fornecedores de embalagens verificados e compare preço, prazo e pedido mínimo em um só lugar. |
| H1 | Encontre fornecedores de embalagens sem perder tempo. |

## 2. Arquivos técnicos

Ficam em `artifacts/getsupply-app/public/` e são servidos na raiz do site:

- `/robots.txt`
- `/sitemap.xml`
- `/llms.txt`

## 3. Próximas 5 features

Score RICE = (Alcance × Impacto × Confiança) ÷ Esforço. Também disponível no site em `/roadmap`.

| # | Feature | Alcance | Impacto | Confiança | Esforço | Score |
|---|---|---|---|---|---|---|
| 1 | Notificações por e-mail | 9 | 2 | 80% | 1,5 | 9,6 |
| 2 | Painel de curadoria do operador | 10 | 3 | 80% | 3 | 8,0 |
| 3 | Comparador de propostas com resumo por IA | 9 | 2 | 60% | 3 | 3,6 |
| 4 | Verificação de CNPJ do fornecedor | 5 | 2 | 70% | 2 | 3,5 |
| 5 | Anexo de arte ou especificação técnica | 6 | 1 | 80% | 2 | 2,4 |

Os valores são estimativas da equipe, não medições.

## 4. PostHog

- O snippet oficial está em `artifacts/getsupply-app/index.html`.
- A chave pública do projeto (`phc_...`, região US) está direto no snippet; ela só permite enviar eventos.
- Pageviews de navegação (SPA) são capturados automaticamente (`defaults: "2025-05-24"`).
- Host configurado: `https://us.i.posthog.com` (troque no `index.html` se o projeto for da região EU).
