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

Metodologia (matriz de priorização apresentada em aula): **nota = (alcance × impacto × confiança) ÷ esforço**.

- Impacto: 3 altíssimo, 2 alto, 1 médio, 0,5 baixo.
- Confiança: 100%, 80% ou 50%.

Premissas: alcance estimado para o piloto, com 50 compradores e 10 fornecedores (60 pessoas); esforço em pessoa-semanas. Ambos são estimativas da equipe, e não há dados medidos do produto. Empates seguem a prioridade do PRD.

Também disponível no site, na página `/roadmap`.

| # | Feature | Alcance | Impacto | Confiança | Esforço | Nota |
|---|---|---|---|---|---|---|
| 1 | Painel de curadoria do operador | 60 | 3 | 80% | 3 | 48 |
| 2 | Verificação de CNPJ do fornecedor | 60 | 2 | 80% | 2 | 48 |
| 3 | Painel do fornecedor para responder pedidos | 60 | 3 | 80% | 4 | 36 |
| 4 | Anexo de arte ou especificação técnica | 50 | 1 | 80% | 2 | 20 |
| 5 | Resumo comparativo de propostas com IA | 25 | 1 | 80% | 2 | 10 |

### 1. Painel de curadoria do operador (nota 48)
- **Descrição:** tela interna em que a equipe escolhe quais fornecedores recebem cada pedido de cotação.
- **Problema:** sem matching automático, não há como direcionar o pedido aos fornecedores compatíveis.
- **Valor:** compradores recebem propostas de fornecedores adequados, o que viabiliza a meta de duas propostas comparáveis por pedido.
- **Justificativa:** alcance 60, porque todo pedido passa por ela; impacto 3, por ser P0 no PRD; confiança 80%, porque o requisito é claro mas a tela não foi desenhada; esforço 3.

### 2. Verificação de CNPJ do fornecedor (nota 48)
- **Descrição:** valida o CNPJ no cadastro e marca o fornecedor como verificado.
- **Problema:** o campo de verificação existe, mas nada o marca como verdadeiro, então o selo "verificado" não tem lastro.
- **Valor:** compradores confiam nos fornecedores exibidos, e o assistente passa a ter fornecedores verificados para sugerir.
- **Justificativa:** alcance 60, porque fornecedores passam pela verificação e compradores veem o selo; impacto 2, por ser um guardrail do PRD; confiança 80%, porque depende de escolher uma fonte de consulta de CNPJ; esforço 2.

### 3. Painel do fornecedor para responder pedidos (nota 36)
- **Descrição:** login e área do fornecedor para ver pedidos recebidos e enviar preço, prazo e pedido mínimo.
- **Problema:** hoje a proposta é criada pelo comprador em um formulário de demonstração; o fornecedor só tem cadastro.
- **Valor:** propostas reais, enviadas por quem produz, para o comprador comparar.
- **Justificativa:** alcance 60; impacto 3, por ser P0 no PRD; confiança 80%, porque exige perfil de fornecedor no login, que ainda não existe; esforço 4 (login, lista de pedidos e formulário).

### 4. Anexo de arte ou especificação técnica (nota 20)
- **Descrição:** o comprador anexa arquivos ao pedido de cotação.
- **Problema:** descrever embalagem só com texto gera propostas imprecisas. O campo existe na tela, mas o arquivo não é salvo.
- **Valor:** propostas mais fiéis à necessidade do comprador.
- **Justificativa:** alcance 50, porque todos os compradores criam pedidos; impacto 1, por ser P1 no PRD e opcional; confiança 80%, porque falta escolher onde guardar os arquivos; esforço 2.

### 5. Resumo comparativo de propostas com IA (nota 10)
- **Descrição:** texto curto, gerado por IA, que resume as diferenças entre as propostas de um mesmo pedido.
- **Problema:** quem nunca negociou com fábrica tem dificuldade de comparar preço, prazo e pedido mínimo.
- **Valor:** decisão mais rápida e segura, sem a IA escolher pelo comprador.
- **Justificativa:** alcance 25, porque só vale para pedidos com duas ou mais propostas (metade dos compradores); impacto 1, por ser complementar; confiança 80%, porque depende de um provedor de IA; esforço 2.

## 4. PostHog

- **Biblioteca:** `posthog-js`, instalada no app (`artifacts/getsupply-app`).
- **Inicialização:** `artifacts/getsupply-app/src/lib/posthog.ts`, chamada em `artifacts/getsupply-app/src/main.tsx` antes de o app ser renderizado.
- **Variáveis de ambiente:** `VITE_POSTHOG_KEY` (chave do projeto, começa com `phc_`) e, opcionalmente, `VITE_POSTHOG_HOST` (padrão `https://us.i.posthog.com`, região US). Sem a chave, o PostHog fica desativado e o site funciona normalmente. Nenhuma chave está escrita no código.
- **Eventos:** `$pageview` na abertura e a cada navegação interna (`capture_pageview: 'history_change'`). Cada evento traz a URL e o caminho (`$current_url`, `$pathname`), além de navegador, dispositivo e a propriedade `app: getsupply`.
- **Como conferir:** no PostHog, em Activity, aba Live events, procure por `$pageview` com a propriedade `app = getsupply`.
