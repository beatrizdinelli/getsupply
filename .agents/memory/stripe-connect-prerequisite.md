---
name: Pré-requisito do Stripe Connect
description: Requisito externo para criar contas Express de fornecedores.
---

A conexão Stripe fornece acesso à API, mas isso não ativa automaticamente o produto Connect. A conta Stripe da plataforma precisa concluir a adesão ao Connect antes que `accounts.create` aceite contas Express.

**Why:** A API autenticou normalmente, mas recusou a criação de conta Express com a mensagem de que a plataforma ainda não aderiu ao Connect.

**How to apply:** Antes de validar onboarding ou checkout com repasse, confirme no Stripe que Connect está habilitado para a conta da plataforma. Trate a ausência como bloqueio de configuração, não como erro de credencial.