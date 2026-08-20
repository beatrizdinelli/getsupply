# Design System — GetSupply · v1

Baseado no PRD v1 (produto, stack e MVP) e nas decisões de identidade visual já fechadas com o time. Segue as oito seções canônicas, nesta ordem.

---

## 1\. Overview (Brand & Style)

GetSupply não é um SaaS corporativo e não é um marketplace de commodity — é uma **vitrine de e-commerce aplicada a um problema B2B**. Referência concreta: pense em como um site D2C de nicho (tipo Aesop, Suno) mostra produto — foto, tag, avaliação, preço, um botão de ação claro — só que aqui o "produto" é o fornecedor, e o "carrinho" é uma solicitação de cotação.

O que isso significa na prática:

- **Não** é o visual "enterprise frio" de azul-marinho \+ cinza que domina SaaS B2B (Salesforce, HubSpot). Isso foi testado e descartado nesta conversa de propósito.  
- **Não** é o visual "institucional" de ONG/consultoria, com muito texto corrido e pouca hierarquia visual.  
- **É** cálido, direto e com cara de vitrine: cards, tags, estrelas, botões chamativos, fundo quente (areia), texto de alto contraste, pouca decoração gratuita.  
- O usuário principal é um fundador abrindo o primeiro negócio, no celular, entre uma tarefa e outra — não um comprador corporativo com tempo para aprender uma interface complexa. Cada tela deve poder ser entendida sem explicação.

---

## 2\. Colors

| Cor | Hex | Papel |
| :---- | :---- | :---- |
| **Areia** | `#FAF5EA` | Fundo dominante de toda a aplicação. É a cor que o produto "respira" — nunca usar branco puro como fundo principal, isso quebra o clima de vitrine quente. |
| **Ink** | `#1F1B16` | Texto principal, títulos, ícones de alto contraste. Nunca preto puro (`#000`) — o ink tem um leve tom quente para combinar com o areia. |
| **Terracota** | `#C1502E` | **Exclusiva para ação.** Botão primário, links clicáveis, ícone ativo. Se não é clicável, não é terracota — essa cor é o sinal visual de "isso aqui você pode apertar". |
| **Bege claro** | `#F0E1CB` | Fundo de tag, badge de categoria, fundo de ícone dentro de card. Nunca usar como fundo de texto corrido nem como cor de botão de ação — sinaliza contexto, não convida a clicar. |
| **Branco creme** | `#FFF7EE` | Texto/ícone sobre fundo terracota (nunca texto preto sobre terracota — contraste insuficiente e foge do tom quente). |

**Cores semânticas de status** (para RFQ e proposta — propositalmente em famílias de matiz diferentes da terracota, para não confundir "ação" com "informação de status"):

| Status | Cor | Hex | Papel |
| :---- | :---- | :---- | :---- |
| Aguardando proposta | Mostarda | `#D8A23C` | Neutro-atencioso — algo está em andamento, sem urgência negativa. |
| Proposta recebida | Verde-azulado | `#3E7C6B` | Positivo — algo avançou. |
| Atrasado | Carmim | `#C1274D` | Negativo — precisa de atenção. Escolhido deliberadamente longe do matiz da terracota (laranja-avermelhado) para não ser lido como botão de ação. |
| Fechado | Cinza-azulado | `#5B6470` | Neutro-final — o ciclo acabou, sem carga emocional. |

Todas as combinações texto/fundo acima precisam ser checadas em contraste AA antes de entrar em produção — texto ink sobre areia e texto creme sobre terracota já passam; as cores semânticas em badge devem usar texto ink ou branco conforme o teste de contraste específico de cada uma, não assumir.

---

## 3\. Typography

Uma família tipográfica só, sans-serif, para manter o clima limpo de vitrine (duas famílias juntas começam a parecer institucional). Três pesos: regular (400) para corpo de texto, semibold (600) para rótulos e destaques leves, bold (700) para títulos e números que importam.

| Estilo | Tamanho | Peso | Uso |
| :---- | :---- | :---- | :---- |
| Display | 32–40px | 700 | Headline de landing/hero. Só uma por tela. |
| H1 | 28px | 700 | Título de página. |
| H2 | 20px | 700 | Título de seção/card em destaque. |
| H3 | 16px | 600 | Título de card padrão (ex. nome do fornecedor). |
| Body | 14–15px | 400 | Texto corrido, descrições, formulários. |
| Small | 13px | 400 | Metadados (MOQ, região, data). |
| Caption | 11–12px | 600, uppercase, letter-spacing | Tags, rótulos de campo, categorias. |

**O que sempre vai em destaque:** preço, prazo de entrega e MOQ nas propostas — são os três dados que o comprador usa para decidir, então aparecem sempre em bold/semibold, nunca no mesmo peso do texto de apoio ao redor.

---

## 4\. Layout

Escala de espaçamento em base 4, para manter tudo alinhado a uma grade única: **4 · 8 · 12 · 16 · 24 · 32 · 48 · 64px.**

- Padding interno de card: 16–24px.  
- Gap entre cards em uma grade (ex. fornecedores em destaque): 16px.  
- Respiro vertical entre seções de página: 48–64px — o produto não pode parecer espremido, isso é parte do clima de vitrine "com espaço para respirar".  
- Grid desktop: 12 colunas, container com largura máxima de \~1100–1200px, margem lateral mínima de 24px.  
- Mobile: coluna única, mesma escala de espaçamento reduzida um degrau (ex. o que é 24px no desktop vira 16px no mobile).  
- Cards de fornecedor em grade: 3 colunas no desktop, 1 coluna no mobile — nunca 2, porque em 2 colunas o card fica largo demais e perde a leitura rápida de vitrine.

O que encosta em quê: card nunca encosta direto na borda da tela (sempre com a margem lateral mínima); dentro de um card, thumbnail/tag/título/CTA seguem o mesmo padding interno — nada de elementos com respiros diferentes dentro do mesmo card.

---

## 5\. Elevation & Depth

O produto é **levemente empilhado, não plano.** Fundo areia é a camada 0 — tudo nela é "página". Cards de fornecedor e de proposta flutuam sutilmente acima disso, para reforçar a sensação de "isso aqui é um item que eu posso pegar e comparar", não um bloco de texto formatado.

| Nível | Uso | Sombra |
| :---- | :---- | :---- |
| 0 — Página | Fundo areia, sem sombra | — |
| 1 — Card padrão | Card de fornecedor, card de proposta, input em foco | Sombra leve e difusa, quase imperceptível — sugestão, não peso (`0 1px 3px rgba(31,27,22,0.08)`) |
| 2 — Flutuante | Modal, dropdown aberto, tooltip | Sombra um degrau mais forte, o suficiente para separar do conteúdo atrás (`0 8px 24px rgba(31,27,22,0.16)`) |

Nada de sombra pesada/skeuomórfica (sem gradientes de profundidade, sem bordas 3D) — a elevação aqui é sutil, só o necessário para hierarquia, não um efeito visual chamativo.

---

## 6\. Shapes

Canto arredondado é assinatura de marca aqui — reforça o "amigável, feito para quem tá começando", em oposição ao canto reto que o time já descartou como visual "enterprise frio".

- Cards, inputs, modais: raio de 12–16px.  
- Badges/tags: raio de 8px (mais discreto que o card).  
- Botões de ação (CTA primário e secundário): **formato pill, raio 999px** — é a forma mais arredondada da interface de propósito, para que o botão de ação seja inconfundível a qualquer distância na tela.  
- Nunca usar canto 100% reto (raio 0\) em nenhum componente — inclusive imagens/thumbnails dentro de card sempre com raio mínimo de 8px.

---

## 7\. Components

**Botão**

- Primário: fundo terracota, texto creme, pill. Estado hover escurece levemente o terracota; disabled reduz opacidade para 40% e remove o cursor de ação; loading substitui o texto por um spinner do mesmo tamanho do texto, sem redimensionar o botão.  
- Secundário: outline ink sobre areia, texto ink, pill.  
- Ghost: só texto ink, sem fundo nem borda — para ações de baixa prioridade (ex. "cancelar").

**Input, textarea, select, upload**

- Fundo branco (não areia, para diferenciar campo de fundo de página), borda 1px cinza-claro, raio 12px.  
- Estado de foco: borda terracota.  
- Estado de erro: borda carmim (`#C1274D`) \+ texto de ajuda abaixo do campo na mesma cor.  
- Upload de arquivo (ex. arte técnica do RFQ): área tracejada com ícone, texto de instrução, preview em thumbnail após upload.

**Card de fornecedor** — o componente mais usado do produto: Thumbnail (raio 8px) → tag de categoria (bege claro, caption) → nome (H3) → estrelas \+ nota \+ nº de avaliações (small) → MOQ e região (small) → botão "Ver perfil" (secundário, largura total do card).

**Badge de status** — usa as quatro cores semânticas da seção 2, formato pill pequeno, caption em maiúsculas.

**Tabela/cards de comparação de propostas** Cada proposta mostra fornecedor, preço, prazo, MOQ e nota lado a lado. Preço, prazo e MOQ sempre em semibold (regra da seção 3). A proposta com melhor preço e a com melhor prazo recebem um badge discreto ("melhor preço" / "mais rápido") em mostarda — não em terracota, para não competir visualmente com o botão de ação de cada linha.

**Navbar** Logo GetSupply à esquerda, links de navegação ao centro/direita, botão de CTA primário ("Criar solicitação") sempre visível à direita, mesmo com scroll (sticky).

**Avaliação em estrelas** Exibição: estrelas preenchidas em ink sobre areia. Input (tela de avaliação pós-compra): estrelas maiores, tocáveis, com preenchimento em terracota ao selecionar — aqui, excepcionalmente, terracota marca estado selecionado, não uma ação de clique.

**Estado vazio** Ilustração simples ou ícone em bege claro \+ uma frase curta \+ botão de ação primário (ex. "Nenhum RFQ ainda — crie sua primeira solicitação").

**Skeleton / carregamento** Blocos em bege claro com leve animação de pulso, no formato exato do conteúdo que vai aparecer (nunca um spinner genérico central para listas).

**Modal** Elevação nível 2, raio 16px, fundo branco, com escurecimento leve do fundo (overlay ink a 40% de opacidade) — usado para confirmações (ex. "fechar pedido com este fornecedor?").

---

## 8\. Do's and Don'ts

**Do's**

- Usar terracota só em elementos clicáveis — se o olho não deveria ir direto ali para agir, não é terracota.  
- Manter preço, prazo e MOQ sempre em destaque tipográfico nas telas de proposta — são os três dados que decidem a compra.  
- Respeitar a escala de espaçamento em base 4 em qualquer tela nova, sem inventar valor solto (ex. 18px, 30px).  
- Card de fornecedor sempre com estrela e MOQ visíveis sem precisar clicar — é informação de decisão, não de detalhe.  
- Testar contraste de qualquer combinação de cor nova contra o fundo areia antes de aprovar.

**Don'ts**

- Não usar verde como cor dominante da marca — já testado nesta conversa e descartado por remeter a "sustentabilidade/natureza" em vez de "sourcing confiável". Pode aparecer só como cor semântica pontual (proposta recebida).  
- Não usar azul-marinho como cor primária — é exatamente o clichê de SaaS B2B que este produto está evitando de propósito.  
- Não usar mais de uma família tipográfica.  
- Não usar sombra pesada, gradiente de profundidade ou efeito 3D em nenhum componente.  
- Não usar a mesma cor do CTA (terracota) para indicar status — confunde "isso é uma ação" com "isso é uma informação".  
- Não usar canto 100% reto em nenhum componente da interface.  
- Não empilhar mais de 3 cards por linha na grade de fornecedores, mesmo em telas largas — a leitura de vitrine se perde.

