-- ============================================================
-- GetSupply — schema + dados de exemplo (lado do comprador)
-- Gerado a partir do DER.md / diagrama draw.io.
--
-- Como rodar no Replit:
--   1. Abra a aba "Database" do seu Repl (Postgres integrado do Replit).
--   2. Cole este arquivo inteiro no SQL runner e execute.
--      — ou, pelo shell do Repl: psql "$DATABASE_URL" -f getsupply_schema_seed.sql
--
-- Este script é idempotente: pode rodar de novo a qualquer momento,
-- ele apaga e recria tudo do zero (bom para desenvolvimento; troque o
-- bloco DROP por migrations de verdade antes de ir pra produção).
-- ============================================================

-- ---------- limpeza (ordem inversa às dependências) ----------
DROP TABLE IF EXISTS avaliacao CASCADE;
DROP TABLE IF EXISTS proposta CASCADE;
DROP TABLE IF EXISTS rfq CASCADE;
DROP TABLE IF EXISTS categoria CASCADE;
DROP TABLE IF EXISTS comprador CASCADE;
DROP TYPE IF EXISTS rfq_status;
DROP TYPE IF EXISTS proposta_status;

-- ---------- domínios de status (mesmos do design.md / DER) ----------
CREATE TYPE rfq_status AS ENUM (
    'aguardando_proposta',
    'proposta_recebida',
    'atrasado',
    'fechado'
);

CREATE TYPE proposta_status AS ENUM (
    'enviada',
    'aceita',    -- = compra fechada
    'recusada'   -- = desistência do comprador
);

-- ============================================================
-- ENTIDADE: comprador
-- ============================================================
CREATE TABLE comprador (
    id         SERIAL PRIMARY KEY,
    nome       VARCHAR(120) NOT NULL,
    email      VARCHAR(160) NOT NULL UNIQUE,
    empresa    VARCHAR(160),
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

-- ============================================================
-- ENTIDADE: categoria (subtipo de embalagem)
-- ============================================================
CREATE TABLE categoria (
    id   SERIAL PRIMARY KEY,
    nome VARCHAR(80) NOT NULL UNIQUE
);

-- ============================================================
-- ENTIDADE: rfq (solicitação de cotação)
-- ============================================================
CREATE TABLE rfq (
    id                     SERIAL PRIMARY KEY,
    comprador_id           INTEGER NOT NULL REFERENCES comprador(id),
    categoria_id           INTEGER NOT NULL REFERENCES categoria(id),
    especificacao_tecnica  TEXT NOT NULL,
    quantidade             INTEGER NOT NULL CHECK (quantidade > 0),
    prazo_desejado         DATE NOT NULL,
    regiao_entrega         VARCHAR(120) NOT NULL,
    arquivo_referencia     VARCHAR(255),
    status                 rfq_status NOT NULL DEFAULT 'aguardando_proposta',
    created_at             TIMESTAMP NOT NULL DEFAULT now()
);

-- ============================================================
-- ENTIDADE: proposta
-- fornecedor entra só como atributo (fornecedor_nome) — o lado do
-- fornecedor não faz parte desta entrega, conforme combinado.
-- ============================================================
CREATE TABLE proposta (
    id                    SERIAL PRIMARY KEY,
    rfq_id                INTEGER NOT NULL REFERENCES rfq(id),
    fornecedor_nome       VARCHAR(160) NOT NULL,
    preco                 NUMERIC(10,2) NOT NULL CHECK (preco >= 0),
    prazo_entrega         DATE NOT NULL,
    moq_proposto          INTEGER NOT NULL CHECK (moq_proposto > 0),
    condicoes_comerciais  TEXT,
    status                proposta_status NOT NULL DEFAULT 'enviada',
    data_decisao          TIMESTAMP,               -- nulo até aceitar/recusar
    motivo_recusa         TEXT,                     -- só quando status = recusada
    created_at            TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT chk_motivo_so_se_recusada
        CHECK (motivo_recusa IS NULL OR status = 'recusada')
);

-- ============================================================
-- ENTIDADE: avaliacao
-- ============================================================
CREATE TABLE avaliacao (
    id          SERIAL PRIMARY KEY,
    proposta_id INTEGER NOT NULL UNIQUE REFERENCES proposta(id),
    nota        INTEGER NOT NULL CHECK (nota BETWEEN 1 AND 5),
    comentario  TEXT,
    created_at  TIMESTAMP NOT NULL DEFAULT now()
);

-- ============================================================
-- DADOS DE EXEMPLO
-- ============================================================

-- categoria: os subtipos de embalagem do MVP (tabela de domínio fixo —
-- não faz sentido ter 10 linhas aqui, o produto só cobre estes 4 subtipos)
INSERT INTO categoria (nome) VALUES
    ('Rótulos'),
    ('Potes'),
    ('Caixas'),
    ('Sacos');

-- comprador: 10 fundadores fictícios de marca early-stage, segmentos variados
INSERT INTO comprador (nome, email, empresa) VALUES
    ('Ana Ferreira',    'ana@melecia.com.br',        'Mel & Cia Cosméticos'),
    ('Rafael Souza',    'rafael@boafruta.com.br',    'Boa Fruta Snacks'),
    ('Camila Ribeiro',  'camila@verdevivo.com.br',   'Verde Vivo Cosméticos'),
    ('Lucas Martins',   'lucas@cafraiz.com.br',      'Café Raiz'),
    ('Beatriz Nunes',   'beatriz@petiscofeliz.com.br','Petisco Feliz Pet'),
    ('Felipe Costa',    'felipe@sabonetesdovale.com.br','Sabonetes do Vale'),
    ('Juliana Alves',   'juliana@doceponto.com.br',  'Doce Ponto Confeitaria'),
    ('Marcelo Lima',    'marcelo@chaencantado.com.br','Chá Encantado'),
    ('Patrícia Gomes',  'patricia@bloomcosmeticos.com.br','Bloom Cosméticos Naturais'),
    ('Thiago Rocha',    'thiago@graoegrao.com.br',   'Grão & Grão Cereais');

-- rfq: 10 solicitações, uma por comprador, passando pelos 4 status possíveis
INSERT INTO rfq (comprador_id, categoria_id, especificacao_tecnica, quantidade, prazo_desejado, regiao_entrega, status) VALUES
    (1,  2, 'Pote plástico 100ml, tampa rosca, branco fosco',            5000, CURRENT_DATE + INTERVAL '30 days', 'São Paulo - SP',       'fechado'),
    (2,  3, 'Caixa de papelão kraft, 20x15x10cm, impressão 1 cor',       2000, CURRENT_DATE + INTERVAL '20 days', 'Belo Horizonte - MG',  'proposta_recebida'),
    (3,  1, 'Rótulo adesivo BOPP fosco, 8x5cm',                         10000, CURRENT_DATE + INTERVAL '15 days', 'Curitiba - PR',        'aguardando_proposta'),
    (4,  4, 'Saco kraft com válvula desaromatizante, 250g',              8000, CURRENT_DATE + INTERVAL '25 days', 'Santos - SP',          'fechado'),
    (5,  2, 'Pote plástico PET 500g, tampa flip-top',                    3000, CURRENT_DATE + INTERVAL '18 days', 'Porto Alegre - RS',    'proposta_recebida'),
    (6,  3, 'Caixa dobrável em cartão duplex, 10x10x5cm',                1500, CURRENT_DATE + INTERVAL '10 days', 'Recife - PE',          'atrasado'),
    (7,  1, 'Rótulo termoencolhível (sleeve), 6x4cm',                    6000, CURRENT_DATE + INTERVAL '22 days', 'Campinas - SP',        'fechado'),
    (8,  4, 'Saco laminado com zip, 100g',                                4000, CURRENT_DATE + INTERVAL '20 days', 'Florianópolis - SC',   'aguardando_proposta'),
    (9,  2, 'Pote de vidro âmbar 30ml com conta-gotas',                  2500, CURRENT_DATE + INTERVAL '28 days', 'Rio de Janeiro - RJ',  'proposta_recebida'),
    (10, 3, 'Caixa de papelão para cereal, 18x25x7cm, impressão 4 cores',5000, CURRENT_DATE + INTERVAL '12 days', 'Salvador - BA',        'atrasado');

-- proposta: número segue o status de cada rfq (aguardando = 0, atrasado = 0,
-- proposta_recebida = 2 em aberto, fechado = 1 aceita + 1 recusada) —
-- por isso não é "10 propostas", é a consequência natural das 10 rfqs acima
INSERT INTO proposta (rfq_id, fornecedor_nome, preco, prazo_entrega, moq_proposto, condicoes_comerciais, status, data_decisao, motivo_recusa) VALUES
    (1, 'Envaz Embalagens',    1.85, CURRENT_DATE + INTERVAL '25 days', 5000, 'Pagamento 50% na aprovação, 50% na entrega', 'aceita',   now(), NULL),
    (1, 'Potes & Cia',         2.10, CURRENT_DATE + INTERVAL '28 days', 3000, 'Pagamento à vista com 5% de desconto',       'recusada', now(), 'Preço acima do orçamento do comprador'),
    (2, 'CaixaCerta',          3.40, CURRENT_DATE + INTERVAL '18 days', 1000, 'Frete incluso para MG',                      'enviada',  NULL,  NULL),
    (2, 'Embalarte Papelão',   3.75, CURRENT_DATE + INTERVAL '22 days', 2500, 'Frete a combinar',                           'enviada',  NULL,  NULL),
    (4, 'Sacaria Nordeste',    0.62, CURRENT_DATE + INTERVAL '20 days', 8000, 'Lote mínimo 8.000 un., frete por conta do comprador', 'aceita',   now(), NULL),
    (4, 'Embalagens Flex',     0.71, CURRENT_DATE + INTERVAL '24 days', 6000, 'Pagamento 30 dias',                          'recusada', now(), 'Prazo de entrega incompatível'),
    (5, 'Potes & Cia',         1.20, CURRENT_DATE + INTERVAL '15 days', 2000, 'Amostra grátis antes do pedido fechado',     'enviada',  NULL,  NULL),
    (5, 'PlastSul Embalagens', 1.35, CURRENT_DATE + INTERVAL '16 days', 3000, 'Frete incluso para RS e SC',                 'enviada',  NULL,  NULL),
    (7, 'Rótulo Fácil',        0.28, CURRENT_DATE + INTERVAL '19 days', 6000, 'Arte-final incluída no orçamento',           'aceita',   now(), NULL),
    (9, 'Vidraria Central',    2.90, CURRENT_DATE + INTERVAL '24 days', 1000, 'MOQ menor que o padrão por ser vidro âmbar', 'enviada',  NULL,  NULL),
    (9, 'Envaz Embalagens',    3.15, CURRENT_DATE + INTERVAL '26 days', 2000, 'Pagamento 50% na aprovação, 50% na entrega', 'enviada',  NULL,  NULL);

-- avaliacao: só existe para propostas com status = aceita (proposta_id 1, 5 e 9) —
-- é 1:1 com a proposta fechada, não com a rfq nem um número fixo de linhas
INSERT INTO avaliacao (proposta_id, nota, comentario) VALUES
    (1, 5, 'Prazo cumprido certinho e comunicação boa durante a produção.'),
    (5, 4, 'Bom preço e qualidade consistente, só atrasou a confirmação do frete.'),
    (9, 5, 'Arte-final impecável e entrega antes do prazo combinado.');

-- ============================================================
-- checagem rápida
-- ============================================================
SELECT 'comprador' AS tabela, count(*) FROM comprador
UNION ALL SELECT 'categoria', count(*) FROM categoria
UNION ALL SELECT 'rfq', count(*) FROM rfq
UNION ALL SELECT 'proposta', count(*) FROM proposta
UNION ALL SELECT 'avaliacao', count(*) FROM avaliacao;
