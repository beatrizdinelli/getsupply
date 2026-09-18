---
name: Identidade de compradores
description: Como conciliar autenticação Clerk com os compradores numéricos usados pelo marketplace.
---

Use Clerk como fonte de autenticação. Vincule cada usuário autenticado a um comprador local, criado sob demanda, e continue usando o identificador numérico local nas relações de RFQs, propostas e avaliações.

**Why:** O banco já contém compradores e relações numéricas. Trocar essas chaves pela identidade externa exigiria uma migração destrutiva e acoplaria o domínio ao provedor de autenticação.

**How to apply:** Novos endpoints privados devem resolver primeiro a sessão Clerk para um comprador local. Não recrie cookies de identidade próprios nem aceite IDs de comprador enviados pelo cliente.