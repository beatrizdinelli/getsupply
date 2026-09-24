# SEO — Entregável 1

## Valores definidos

TITLE:
GetSupply | Fornecedores de embalagens para sua marca

META DESCRIPTION:
Crie um pedido de cotação, receba propostas de fornecedores de embalagens verificados e compare preço, prazo e pedido mínimo em um só lugar.

H1:
Encontre fornecedores de embalagens sem perder tempo.

**Os três valores acima estão implementados no site**, na página inicial (`/`):

| Elemento | Onde está implementado |
|---|---|
| Title | `artifacts/getsupply-app/index.html`, tag `<title>` |
| Meta Description | `artifacts/getsupply-app/index.html`, tag `<meta name="description">` |
| H1 | `artifacts/getsupply-app/src/App.tsx`, componente `Home`, tag `<h1>` |

## Análise do site

- **O que o produto faz:** plataforma B2B em que o comprador cria um pedido de cotação (RFQ) de embalagem, recebe propostas de fornecedores e as compara.
- **Público:** fundadores de marcas físicas em estágio inicial, que compram embalagem personalizada em lote pequeno ou médio e não têm rede de fornecedores. Fornecedores de embalagem são o outro lado da plataforma. Fonte: PRD em `attached_assets`.
- **Proposta de valor:** encontrar fornecedores confiáveis e comparar preço, prazo e pedido mínimo (MOQ) sem pesquisa dispersa.
- **Palavras e conceitos do site:** fornecedores de embalagens, solicitar cotação, propostas, fornecedores verificados, preço, prazo, MOQ, marca, "sem perder tempo".

## Opções avaliadas

| Opção | Title | Meta Description | H1 |
|---|---|---|---|
| **A** (escolhida) | GetSupply \| Fornecedores de embalagens para sua marca | Crie um pedido de cotação, receba propostas de fornecedores de embalagens verificados e compare preço, prazo e pedido mínimo em um só lugar. | Encontre fornecedores de embalagens sem perder tempo. |
| B | GetSupply \| Compare cotações de embalagens personalizadas | Peça cotação, receba propostas de fornecedores verificados e compare preço, prazo e pedido mínimo de embalagens personalizadas para sua marca. | Compare cotações de embalagens personalizadas em um só lugar. |
| C | GetSupply \| Embalagens para marcas em crescimento | Marcas em início de operação encontram fornecedores de embalagens verificados, pedem cotação e comparam propostas sem pesquisa dispersa. | Embalagem personalizada para a sua marca, sem pesquisa dispersa. |

**Lógica de cada opção**

- **A:** foca a busca por fornecedor, que é a ação principal da Home, e o benefício "sem perder tempo". Usa o texto que já era o H1 do site e a linguagem do próprio produto.
- **B:** foca a comparação de cotações. Fica mais próxima de quem já sabe o que quer, mas a Home hoje destaca a busca de fornecedores, e "personalizadas" não aparece na Home.
- **C:** foca o público (marcas em crescimento). "Em crescimento" é mais amplo que o cliente descrito no PRD (marcas early-stage), e a expressão "pesquisa dispersa" não aparece no site.

**Escolha:** a opção A é a mais coerente com o site atual. O H1 já era o título da Home, e os textos de Title e Description usam apenas conceitos que a Home mostra: fornecedores, cotação, propostas, verificados, preço, prazo e pedido mínimo.

## Verificação no código

- **H1:** a Home tem um único `<h1>`, e o texto renderizado é idêntico ao valor definido.
- **Title:** `<title>` em `index.html` idêntico ao valor definido.
- **Meta Description:** `<meta name="description">` em `index.html` idêntica ao valor definido.
- **Sobrescrita:** não há `document.title` nem biblioteca de head (como react-helmet) no código, então nenhum componente altera o Title ou a Description.
- **Outras páginas:** cada rota tem seu próprio `<h1>` (fornecedores, pedido, cadastro, roadmap, erro), mas elas usam o mesmo Title e Description do `index.html`, porque o site é uma SPA com um único HTML.
