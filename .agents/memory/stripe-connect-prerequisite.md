---
name: Pré-requisito do Stripe Connect
description: Requisito externo para criar contas Express de fornecedores.
---

A conexão Stripe fornece acesso à API, mas isso não ativa automaticamente o produto Connect. A conta Stripe da plataforma precisa concluir a adesão ao Connect antes de criar contas Express. O país da plataforma também precisa ser compatível com o país das contas conectadas.

**Why:** A API autenticou normalmente e o Connect foi habilitado no sandbox, mas a plataforma registrada nos Estados Unidos não pôde criar uma conta conectada brasileira. O país da conta Stripe não pode ser alterado por código.

**How to apply:** Antes de validar onboarding ou checkout com repasse, confirme que Connect está habilitado e que a conta da plataforma está registrada em uma região compatível com os fornecedores. Trate incompatibilidade regional como bloqueio da conta, não como erro de credencial ou de implementação.