# Deploy, Hospedagem e Domínio — SUOAC

> Documento de infraestrutura: onde hospedar cada parte do sistema (front, API,
> banco), como registrar o domínio, como separar ambientes de teste e produção
> e quanto isso custa. Atualizado em **12/06/2026**.

---

## 1. Visão geral

O SUOAC é composto por três partes que precisam estar no ar:

| Parte       | Tecnologia                                       | Onde hospedar                               |
| ----------- | ------------------------------------------------ | ------------------------------------------- |
| **Front**   | Next.js 16 (SSR + Server Actions; PWA planejado) | Vercel (Hobby, grátis)                      |
| **Backend** | NestJS + Fastify + Prisma                        | Railway/Render ou VPS (Hetzner) — a definir |
| **Banco**   | Neon PostgreSQL (serverless)                     | Neon (free tier)                            |
| **Cache**   | Redis (tracking, pós-MVP)                        | Upstash (free tier)                         |

> O front **não é um site estático**: usa Server Components, Server Actions e
> autenticação, logo precisa de runtime (não dá para usar hosting estático puro
> como GitHub Pages).

Características que guiam as escolhas:

- **Não-comercial e gratuito** para o usuário final.
- **Carga baixa e sazonal**: picos nos períodos de inscrição, quase nada no
  resto. Estimativa da doc de requisitos: ~50–60 MB de dados/ano, dezenas de
  usuários por circuito.
- **Mobile-first**: a maioria dos coordenadores usa pelo celular. O PWA é meta
  planejada, ainda **não implementada** (sem `manifest`, ícones ou service
  worker no projeto hoje).

---

## 2. Domínio

**Domínio raiz:** `suoac.com` — **disponível** (verificado via RDAP da Verisign
em 11/06/2026, retornou HTTP 404 = não registrado). Reconfirmar antes de
registrar, pois a disponibilidade muda a qualquer momento.

### Onde registrar

| Registrar                | Preço `.com`/ano          | Observação                                               |
| ------------------------ | ------------------------- | -------------------------------------------------------- |
| **Cloudflare Registrar** | ~US$ 10,44                | Preço de custo, sem markup na renovação. **Recomendado** |
| Porkbun                  | ~US$ 11                   | WHOIS privacy grátis                                     |
| Namecheap                | ~US$ 6 (1º ano) → ~US$ 15 | Cuidado com renovação cara                               |

Evitar GoDaddy e revendas caras (renovação inflada).

### Subdomínios são grátis e ilimitados

Você paga **uma vez por ano só pelo domínio raiz**. Subdomínios são apenas
registros de DNS dentro do domínio que você já possui — não há nova compra.

```
suoac.com               → domínio comprado (paga 1x/ano)
├── www.suoac.com            (grátis)
├── staging.suoac.com        (grátis)
├── api.suoac.com            (grátis)
└── api-staging.suoac.com    (grátis)
```

Não importa quantos subdomínios você crie, o custo do domínio continua o mesmo.

---

## 3. Mapa de domínios

Cada subdomínio pode apontar para um **provedor diferente**. Quem distribui é o
DNS no Cloudflare.

| Subdomínio              | Aponta para           | Ambiente           |
| ----------------------- | --------------------- | ------------------ |
| `suoac.com` + `www`     | Vercel                | Front — produção   |
| `api.suoac.com`         | Railway/Render ou VPS | Backend — produção |
| `staging.suoac.com`     | Vercel                | Front — teste      |
| `api-staging.suoac.com` | Railway/Render ou VPS | Backend — teste    |

### Como apontar a API para o domínio

O tipo de registro DNS depende de onde o backend roda:

| Host do backend                 | Registro DNS no Cloudflare                           |
| ------------------------------- | ---------------------------------------------------- |
| **VPS (Hetzner)** — IP fixo     | `A` → `api.suoac.com` → `IP.DO.VPS`                  |
| **Railway / Render** — hostname | `CNAME` → `api.suoac.com` → `seu-app.up.railway.app` |

Em Railway/Render, adicione `api.suoac.com` como _custom domain_ no painel e o
**SSL é gerado automaticamente**. No VPS, configure com Nginx/Caddy +
Let's Encrypt.

> **Dica Cloudflare:** para os registros que apontam para a Vercel, deixe em
> **DNS-only (nuvem cinza)** para não conflitar com o SSL da Vercel.

---

## 4. Front — Vercel

### Recomendação: plano Hobby (grátis)

Encaixe perfeito para Next.js 16: deploy a cada `git push`, SSL automático,
preview por PR, CDN global (rápido no celular) e suporte nativo a PWA quando
ele for implementado. Os limites sobram com folga para a carga do SUOAC.

### Hobby vs Pro (números atuais — jun/2026)

|                               | **Hobby (grátis)**          | **Pro (US$ 20/mês)**                               |
| ----------------------------- | --------------------------- | -------------------------------------------------- |
| Uso comercial                 | ❌ Só pessoal/não-comercial | ✅ Permitido                                       |
| Quem administra o projeto     | Só você (1 pessoa)          | 1 assento pago + outros a US$ 20; _viewers_ grátis |
| Edge requests/mês             | até 1.000.000               | 10.000.000 incluídos                               |
| Banda (Fast Data Transfer)    | generosa                    | 1 TB incluído                                      |
| Builds                        | 4 vCPU / 8 GB               | 30 vCPU / 60 GB                                    |
| Deploys/dia                   | 100                         | 6.000                                              |
| Projetos                      | 200                         | Ilimitados                                         |
| Domínios por projeto          | 50                          | Ilimitados                                         |
| Logs (retenção)               | 1 h / 4.000 linhas          | 1 dia / 100.000 linhas                             |
| Proteção de preview por senha | ❌                          | ✅                                                 |
| Suporte por e-mail            | ❌                          | ✅                                                 |
| Spend management / log drains | ❌                          | ✅                                                 |

### Usuários do app ≠ membros da Vercel

O limite de "1 membro" do Hobby é sobre **quem mexe no painel da Vercel**
(deploy/configs), **não** sobre quem usa o site. Os coordenadores que usam o
SUOAC são usuários finais — contam apenas como _edge requests_/tráfego. Dá para
ter centenas de coordenadores usando o app no Hobby tranquilamente.

### Quando migrar para o Pro

Só vale subir se:

1. O projeto **virar comercial** (cobrar, ser de uma empresa).
2. **Mais de uma pessoa** precisar fazer deploy/gerenciar na Vercel (_viewers_
   são grátis; quem faz deploy precisa de assento pago).
3. Precisar de **proteção por senha em previews**, **suporte por e-mail** ou
   **logs mais longos**.

A migração é um clique, sem mexer no código.

---

## 5. Backend — opções (a definir)

O front não roda sozinho: a API NestJS precisa estar no ar. Opções coerentes e
baratas:

| Opção                  | Custo            | Esforço | Observação                                                                        |
| ---------------------- | ---------------- | ------- | --------------------------------------------------------------------------------- |
| **Railway / Render**   | ~US$ 5–7/mês     | Baixo   | Gerenciado, combina com a simplicidade da Vercel                                  |
| **Hetzner VPS (CX22)** | ~€4/mês (~R$ 25) | Alto    | Mais barato; cabe backend + Redis no mesmo lugar (Docker/Nginx/SSL por sua conta) |

Para ter **teste + produção**, no PaaS (Railway/Render) você roda **dois
serviços**; no VPS, roda os dois no mesmo servidor em portas/subdomínios
diferentes.

---

## 6. Banco e cache

- **Neon PostgreSQL** (free tier): 0,5 GB de storage por projeto, scale-to-zero
  (ideal para o padrão sazonal). Consumo estimado do SUOAC: ~50–60 MB/ano.
- **Neon branching**: crie uma branch `staging` do banco, **de graça**, com dados
  isolados da produção.
- **Upstash Redis** (free tier): usado só pelo serviço de tracking (Go), na fase
  pós-MVP.

---

## 7. Ambientes: teste e produção

Na Vercel, ambientes são **baseados em branches do Git** — você não cria
"servidores", cada branch vira um ambiente automaticamente.

### Mapa branch → ambiente

| Branch      | Ambiente              | Domínio              | Quando faz deploy            |
| ----------- | --------------------- | -------------------- | ---------------------------- |
| `main`      | **Production**        | `suoac.com`          | Todo push/merge na `main`    |
| `develop`   | **Preview (staging)** | `staging.suoac.com`  | Todo push/merge na `develop` |
| `feature/*` | **Preview**           | URL automático único | A cada PR (revisão isolada)  |

### Variáveis de ambiente por ambiente

A mesma variável pode ter valores diferentes por ambiente. É isso que faz o
staging apontar para a API de teste e a produção para a API real:

| Variável       | Production              | Preview (staging)               |
| -------------- | ----------------------- | ------------------------------- |
| `API_BASE_URL` | `https://api.suoac.com` | `https://api-staging.suoac.com` |

> `API_BASE_URL` é **server-only** (sem o prefixo `NEXT_PUBLIC_`). O `http-client`
> a consome apenas no servidor Next.js (Server Actions, módulo marcado com
> `server-only`), então a URL do backend nunca vai para o bundle do navegador.

O front de staging nunca toca no banco de produção.

### O backend e o banco também precisam de staging

|                  | Produção         | Teste/Staging            |
| ---------------- | ---------------- | ------------------------ |
| Front (Vercel)   | `suoac.com`      | `staging.suoac.com`      |
| Backend (NestJS) | `api.suoac.com`  | `api-staging.suoac.com`  |
| Banco (Neon)     | branch principal | branch `staging` do Neon |

### Fluxo de trabalho

```
feature/cadastro-passageiro  →  abre PR  →  preview automático (testa isolado)
        ↓ merge
     develop                 →  deploy em staging.suoac.com (dados de teste)
        ↓ merge (quando aprovado)
       main                  →  deploy em suoac.com (produção, usuários reais)
```

Tudo automático: basta `git push` / merge e a Vercel publica.

### Como configurar na Vercel (front)

1. **Production Branch**: Settings → Git → defina `main`.
2. **Domínio de staging**: Settings → Domains → adicione `staging.suoac.com` e
   atribua à branch `develop`.
3. **Env vars**: Settings → Environment Variables → crie `API_BASE_URL`
   (server-only, sem prefixo `NEXT_PUBLIC_`) com valor diferente em _Production_
   e em _Preview_.

---

## 8. Autenticação e cookies (modelo BFF)

A autenticação segue o padrão **BFF**: o navegador **nunca** chama o backend
diretamente. Todo acesso à API passa pelo servidor Next.js (Server Actions), que
faz `fetch` server-side via `http-client` (módulo marcado com `server-only`).
Detalhes em `docs/architecture/SUOAC_AUTENTICACAO.md`.

Consequências para o deploy:

- **Cookies vivem só no domínio do front.** O servidor Next.js cria os cookies
  (`suoac-access-token` e `suoac-refresh-token` como HttpOnly; `suoac-user`
  legível pelo client) com `SameSite=Lax` no próprio domínio (`suoac.com` /
  `staging.suoac.com`). Não há cookie compartilhado em `.suoac.com`: o backend
  não lê cookies do navegador.
- **Sem CORS entre navegador e backend.** Como o `fetch` para `api.suoac.com`
  parte do servidor Next.js (não do browser), não existe requisição cross-origin
  do navegador para a API — logo o backend **não precisa** liberar CORS para
  `https://suoac.com`. O `http-client` lê o access token do cookie HttpOnly via
  `getAccessToken()` e o encaminha no header `Authorization: Bearer <token>`; em
  `401`, faz refresh e retry server-side.
- **A URL do backend é server-only.** O front acessa `api.suoac.com` apenas pela
  env `API_BASE_URL` (sem `NEXT_PUBLIC_`), então a URL da API nunca vai para o
  bundle do navegador.

> Isso simplifica o deploy: o front (Vercel) só precisa de acesso de rede ao
> backend em runtime — não há CORS nem cookies cross-subdomínio para configurar.

---

## 9. Resumo de custos

| Item                              | Custo                                          |
| --------------------------------- | ---------------------------------------------- |
| Front (Vercel Hobby)              | **Grátis**                                     |
| Domínio (`suoac.com`, Cloudflare) | ~R$ 55/ano                                     |
| Banco (Neon) + Redis (Upstash)    | Grátis (free tier)                             |
| Backend (Railway/Render)          | ~R$ 30/mês (dobra com staging)                 |
| Backend (Hetzner VPS)             | ~R$ 25/mês (cobre staging + prod no mesmo VPS) |

- **Mínimo (front + domínio):** ~R$ 55/ano.
- O gasto recorrente real vem **apenas do backend**.

---

## 10. Próximos passos

1. Registrar `suoac.com` no Cloudflare Registrar.
2. Criar o projeto do front na Vercel, conectado ao repositório.
3. Definir `main` como production branch e `develop` como staging.
4. Apontar `suoac.com` e `staging.suoac.com` no DNS.
5. Decidir o host do backend (Railway/Render vs Hetzner) e configurar
   `api.suoac.com` / `api-staging.suoac.com`.
6. Criar a branch `staging` no Neon e configurar as variáveis de ambiente por
   ambiente.
