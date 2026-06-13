# Infraestrutura & Deploy — SUOAC Front (runbook executado)

> **O que é este documento:** registro detalhado de **tudo o que foi efetivamente
> configurado** para colocar o front do SUOAC no ar, mais um **guia de manutenção**.
> Diferente do `DEPLOY.md` (que é o _plano/estratégia_ de infra), este aqui é o
> _executado_: estado real, comandos usados, decisões, armadilhas e como mexer no
> futuro.
>
> **Data da montagem:** 12/06/2026 · **Executado via** Vercel CLI 54.12.2 + API REST
> da Vercel + API do Cloudflare.

---

## 1. Resumo executivo

O front (Next.js 16, App Router, arquitetura **BFF**) foi publicado na **Vercel**,
com **domínio próprio no Cloudflare** e **dois ambientes** amarrados a branches do
Git:

| Ambiente     | URL                                    | Branch Git | Backend (API)                                  |
| ------------ | -------------------------------------- | ---------- | ---------------------------------------------- |
| **Produção** | https://suoac.com (e `www` → redirect) | `main`     | `https://suoac-back-production.up.railway.app` |
| **Staging**  | https://staging.suoac.com              | `develop`  | `https://suoac-back-staging.up.railway.app`    |

- Deploy é **automático por git push** (push em `develop` → staging; merge/push em
  `main` → produção; cada PR de `feature/*` gera uma URL de preview própria).
- SSL automático (Vercel) em todos os domínios.
- DNS no Cloudflare, registros `A → 76.76.21.21` em **DNS-only (nuvem cinza)**.
- A camada extra de proteção de preview da Vercel foi **desativada** (staging é
  público; a segurança vem do login do próprio app).

**Tudo funcionando e validado** (inclusive externamente via rede móvel).

---

## 2. Por que a arquitetura importa para o deploy (BFF)

O front é um **BFF (Backend for Frontend)**: **o navegador nunca chama a API
diretamente**. Todo acesso ao backend passa pelo servidor Next.js (Server Actions),
que faz `fetch` server-side através de `src/shared/api/http-client/http-client.ts`
(módulo marcado com `import "server-only"`).

Consequências práticas para a infra:

- A URL do backend é uma env **server-only** chamada **`API_BASE_URL`** (sem o
  prefixo `NEXT_PUBLIC_`). Ela **nunca** vai para o bundle do navegador.
- **Não há CORS** entre navegador e backend (o `fetch` parte do servidor Next.js,
  não do browser). O backend **não precisa** liberar CORS para `suoac.com`.
- Os **cookies de sessão** (`suoac-access-token`, `suoac-refresh-token` HttpOnly;
  `suoac-user` legível) vivem **só no domínio do front**, com `SameSite=Lax`. O
  `http-client` lê o access token do cookie e o encaminha ao backend no header
  `Authorization: Bearer <token>` (com refresh + retry em `401`).
- O guarda de rotas é o **proxy** (ex-middleware do Next 16) em `proxy.ts`: sem
  cookie de sessão, redireciona para `/login`. É por isso que `GET /` responde
  **307 → /login**.

Mais detalhes em `docs/architecture/SUOAC_AUTENTICACAO.md` e na seção 8 do `DEPLOY.md`.

---

## 3. Inventário de contas, serviços e identificadores

| Item                             | Valor                                                                   |
| -------------------------------- | ----------------------------------------------------------------------- |
| **Repositório GitHub**           | `Fioravante1/suoac-front` (default branch: `main`, público)             |
| **Vercel — projeto**             | `suoac-front`                                                           |
| **Vercel — projectId**           | `prj_v1Bz5HJ3iUl0jgbfn52Q4YgCXPmB`                                      |
| **Vercel — time/escopo**         | `fioravante-chiozzis-projects` (teamId `team_xp2hdY1TKql4IfzhltFRPysE`) |
| **Vercel — usuário**             | `fioravante1`                                                           |
| **Vercel — framework detectado** | `nextjs` · Node `24.x` · build/install/output = default                 |
| **Cloudflare — zona**            | `suoac.com`                                                             |
| **Cloudflare — zoneId**          | `6af0fae04dd0fef1c70e828112790d60`                                      |
| **Cloudflare — nameservers**     | `rob.ns.cloudflare.com`, `selah.ns.cloudflare.com`                      |
| **Backend produção (Railway)**   | `https://suoac-back-production.up.railway.app`                          |
| **Backend staging (Railway)**    | `https://suoac-back-staging.up.railway.app`                             |
| **IP da Vercel (apex)**          | `76.76.21.21`                                                           |

> **Nota:** o banco (Neon) e a hospedagem do backend (Railway) **não** fazem parte
> deste repositório nem foram tocados aqui — são responsabilidade do projeto do
> backend. O front é BFF e só conhece o backend pela env `API_BASE_URL`.

---

## 4. Variáveis de ambiente (Vercel)

Há **uma** variável, com **dois valores** por ambiente:

| Variável       | Ambiente (target) | Git Branch    | Valor                                          | Tipo      |
| -------------- | ----------------- | ------------- | ---------------------------------------------- | --------- |
| `API_BASE_URL` | Production        | (todas)       | `https://suoac-back-production.up.railway.app` | sensitive |
| `API_BASE_URL` | Preview           | **`develop`** | `https://suoac-back-staging.up.railway.app`    | sensitive |

Pontos importantes:

- A env de **preview está escopada à branch `develop`** (não "todas as previews").
  Isso significa que **deploys de preview de `feature/*` NÃO recebem `API_BASE_URL`**
  e quebrariam ao chamar a API. Se um dia precisar que previews de feature funcionem,
  adicione a env para a branch específica ou para "todas as previews" (ver §9.1).
- As envs estão marcadas como **`sensitive`** (padrão atual da Vercel para
  Production/Preview): o valor é **write-only**, não dá para _ler de volta_ via CLI/API
  — só sobrescrever.
- Para desenvolvimento local, a env fica em `.env.local` (git-ignored), apontando
  por padrão para o backend de **staging**.

---

## 5. Passo a passo do que foi feito (cronológico)

Todos os comandos rodaram a partir da raiz do projeto. O CLI foi autenticado uma vez
com `npx vercel login` (fluxo no navegador); a credencial fica em
`~/.local/share/com.vercel.cli/auth.json`.

### 5.1. Validação do build local

```bash
yarn build   # exit 0; todas as rotas são dinâmicas (ƒ), nada estático tocando a API
```

Confirmou que o **build não depende do backend** (a `API_BASE_URL` só é lida em
runtime), então o deploy é seguro mesmo com o backend fora.

### 5.2. Criar/linkar o projeto na Vercel + conectar GitHub

```bash
npx vercel link --yes --scope fioravante-chiozzis-projects
```

- Criou o projeto `suoac-front`, detectou Next.js e **conectou o repositório
  GitHub automaticamente** (auto-deploy habilitado).
- Gerou o arquivo local `.vercel/project.json` (git-ignored) com `projectId` e `orgId`.
- A **production branch** ficou como `main` automaticamente, por ser a default branch
  do GitHub.

### 5.3. Configurar as variáveis de ambiente

```bash
# Produção (stdin):
printf 'https://suoac-back-production.up.railway.app' \
  | npx vercel env add API_BASE_URL production --scope fioravante-chiozzis-projects

# Preview escopada à branch develop (precisa do branch explícito — ver §10):
npx vercel env add API_BASE_URL preview develop \
  --value 'https://suoac-back-staging.up.railway.app' --yes --force \
  --scope fioravante-chiozzis-projects
```

### 5.4. Deploy de produção (a partir de `main`)

**Contexto importante (manutenção):** ao montar a infra, o `main` **local** estava
desatualizado (29 commits atrás do `origin/main`). Depois de `git fetch`, ficou claro
que **`origin/main` ⊇ `origin/develop`** — ou seja, a `main` já contém tudo da
`develop` mais alguns commits de docs/CI. **Não há merge `develop → main` a fazer.**

O primeiro deploy de produção foi feito a partir da branch `main`:

```bash
git fetch origin
git branch -f main origin/main      # acertar o ref local
git checkout main
npx vercel deploy --prod --scope fioravante-chiozzis-projects
git checkout develop
```

> ⚠️ Curiosidade do CLI: `vercel deploy` **sem** `--prod` promoveu o _primeiro_ deploy
> direto a produção (projeto sem produção prévia). Por isso, daí em diante, usamos
> `--prod` para produção e `--target preview` para staging, explicitamente.

### 5.5. Deploy de staging (a partir de `develop`)

```bash
git checkout develop
npx vercel deploy --target preview --scope fioravante-chiozzis-projects
```

### 5.6. Compra do domínio (manual, no Cloudflare)

`suoac.com` foi **registrado pelo dono** no **Cloudflare Registrar**. Ao registrar
pelo Cloudflare, a **zona DNS já nasce no Cloudflare** (nameservers `rob/selah`).

### 5.7. Registros DNS no Cloudflare (via API)

Criados com um **API Token** do Cloudflare (permissão `Zone.DNS:Edit` na zona
`suoac.com`). Os 3 registros, **todos `proxied: false` (nuvem CINZA)**:

| Tipo | Nome                | Valor         | Proxy    |
| ---- | ------------------- | ------------- | -------- |
| A    | `suoac.com`         | `76.76.21.21` | DNS only |
| A    | `www.suoac.com`     | `76.76.21.21` | DNS only |
| A    | `staging.suoac.com` | `76.76.21.21` | DNS only |

Comando-padrão usado (repetido para cada nome):

```bash
ZID=6af0fae04dd0fef1c70e828112790d60
curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$ZID/dns_records" \
  -H "Authorization: Bearer <CF_TOKEN>" -H "Content-Type: application/json" \
  --data '{"type":"A","name":"suoac.com","content":"76.76.21.21","proxied":false,"ttl":1}'
```

> 🔴 **Por que nuvem cinza é obrigatório:** se o registro ficar **Proxied (laranja)**,
> o Cloudflare intercepta o TLS e **conflita com o SSL da Vercel** → o site quebra.
> Registros novos no Cloudflare nascem **laranja por padrão**; por isso usamos a API
> com `proxied:false` explícito.

### 5.8. Adicionar os domínios ao projeto Vercel

```bash
npx vercel domains add suoac.com         --scope fioravante-chiozzis-projects
npx vercel domains add www.suoac.com     --scope fioravante-chiozzis-projects
npx vercel domains add staging.suoac.com --scope fioravante-chiozzis-projects
```

A Vercel verificou os domínios automaticamente (DNS já apontando) e **emitiu o SSL**
de cada um (leva de segundos a alguns minutos por domínio).

### 5.9. `www` → redirect para o apex (canônico `suoac.com`)

Feito via REST API (não há comando CLI para isso):

```bash
curl -s -X PATCH \
  "https://api.vercel.com/v9/projects/$PID/domains/www.suoac.com?teamId=$OID" \
  -H "Authorization: Bearer <VERCEL_TOKEN>" -H "Content-Type: application/json" \
  --data '{"redirect":"suoac.com","redirectStatusCode":308}'
```

### 5.10. `staging.suoac.com` → branch `develop`

Por padrão, todo domínio adicionado aponta para **produção**. Para o staging servir a
branch `develop` (e atualizar a cada deploy dela), atribuímos o git branch via API:

```bash
curl -s -X PATCH \
  "https://api.vercel.com/v9/projects/$PID/domains/staging.suoac.com?teamId=$OID" \
  -H "Authorization: Bearer <VERCEL_TOKEN>" -H "Content-Type: application/json" \
  --data '{"gitBranch":"develop"}'
```

### 5.11. Desativar a proteção de preview da Vercel

Por padrão, a **Vercel Deployment Protection** (autenticação Vercel) protege previews
e devolvia **401** no `staging.suoac.com`. Como o staging precisa ser acessível a
testadores (e o app já tem login próprio), desativamos:

```bash
curl -s -X PATCH "https://api.vercel.com/v9/projects/$PID?teamId=$OID" \
  -H "Authorization: Bearer <VERCEL_TOKEN>" -H "Content-Type: application/json" \
  --data '{"ssoProtection":null}'
```

### 5.12. Validação final

```bash
# suoac.com      -> 307 -> /login          (produção)
# www.suoac.com  -> 308 -> https://suoac.com/   (redirect)
# staging.suoac.com -> 307 -> /login        (staging, público)
for d in suoac.com www.suoac.com staging.suoac.com; do
  curl -sS -o /dev/null -w "$d HTTP %{http_code} -> %{redirect_url}\n" \
    --resolve "$d:443:76.76.21.21" "https://$d/"
done
```

---

## 6. Como os deploys funcionam daqui pra frente (automático)

A integração Git já está conectada. **Não é mais preciso usar o CLI** para deploys
do dia a dia:

```
feature/xyz  → abre PR → preview automático (URL própria, isolada)*
     │ merge
  develop     → deploy automático em https://staging.suoac.com
     │ merge (quando aprovado)
   main        → deploy automático em https://suoac.com (produção)
```

\* _Atenção:_ previews de `feature/*` **não têm `API_BASE_URL`** (a env de preview está
escopada só à `develop`). Veja §9.1 se quiser que previews de feature funcionem.

Fluxo típico de release: trabalha em `feature/*` → PR para `develop` (vai pro staging)
→ valida no staging → merge `develop` em `main` (vai pra produção).

---

## 7. Mapa branch → domínio → backend (referência rápida)

```
main      ──► https://suoac.com          ──► API_BASE_URL = suoac-back-production…
              https://www.suoac.com (308 → apex)
develop   ──► https://staging.suoac.com  ──► API_BASE_URL = suoac-back-staging…
feature/* ──► <preview-aleatório>.vercel.app  ──► (sem API_BASE_URL — ver §9.1)
```

---

## 8. Pré-requisitos para manutenção

- **Vercel CLI:** usado via `npx vercel ...` (sem instalação global). Sempre passe
  `--scope fioravante-chiozzis-projects` (ou rode dentro do projeto, que já está
  linkado via `.vercel/project.json`).
- **Autenticação Vercel CLI:** `npx vercel login` (fluxo no navegador). Para as
  operações que **só existem na REST API** (redirect de domínio, domínio→branch,
  proteção), use um **token**. Recomendado: criar um token dedicado em
  https://vercel.com/account/tokens. (Na montagem, foi usado o token salvo em
  `~/.local/share/com.vercel.cli/auth.json` na chave `token`.)
- **Cloudflare:** para mexer no DNS, crie um **API Token** com `Zone.DNS:Edit` na zona
  `suoac.com` (o token usado na montagem foi **revogado/removido** após o uso).

Helper para exportar IDs nas sessões de manutenção:

```bash
export PID=prj_v1Bz5HJ3iUl0jgbfn52Q4YgCXPmB
export OID=team_xp2hdY1TKql4IfzhltFRPysE
export VT=<seu-token-vercel>     # https://vercel.com/account/tokens
```

---

## 9. Runbook de manutenção (tarefas comuns)

### 9.1. Trocar a URL de um backend / mexer numa env var

As envs são **sensitive (write-only)** — não dá pra ler, só sobrescrever. Use `--force`.

```bash
# Produção:
npx vercel env rm API_BASE_URL production --yes --scope fioravante-chiozzis-projects
printf 'https://NOVA-URL-prod' \
  | npx vercel env add API_BASE_URL production --scope fioravante-chiozzis-projects

# Staging (branch develop):
npx vercel env add API_BASE_URL preview develop \
  --value 'https://NOVA-URL-staging' --yes --force \
  --scope fioravante-chiozzis-projects

# Listar:
npx vercel env ls --scope fioravante-chiozzis-projects
```

> Para previews de `feature/*` também terem API, adicione a env "para todas as
> previews". O CLI em modo agente exige branch (erro `git_branch_required`); faça
> **interativamente** (`! npx vercel env add API_BASE_URL preview ...` e escolha
> "all Preview branches") **ou** via REST API (`POST /v10/projects/$PID/env` com
> `target:["preview"]` e **sem** `gitBranch`).

> ⚠️ **Env só vale no próximo deploy.** Depois de mudar, faça um redeploy (§9.4) ou um
> novo push na branch.

### 9.2. Adicionar / remover um domínio

```bash
npx vercel domains add  novo.suoac.com --scope fioravante-chiozzis-projects
npx vercel domains rm   novo.suoac.com --scope fioravante-chiozzis-projects
npx vercel domains inspect suoac.com   --scope fioravante-chiozzis-projects
```

Depois, crie o registro DNS no Cloudflare (`A → 76.76.21.21`, **nuvem cinza**) e, se
for de staging/preview, atribua o branch (§9.3).

### 9.3. Atribuir um domínio a uma branch / configurar redirect (REST API)

```bash
# domínio -> branch:
curl -s -X PATCH "https://api.vercel.com/v9/projects/$PID/domains/<dominio>?teamId=$OID" \
  -H "Authorization: Bearer $VT" -H "Content-Type: application/json" \
  --data '{"gitBranch":"<branch>"}'

# redirect (ex.: www -> apex):
curl -s -X PATCH "https://api.vercel.com/v9/projects/$PID/domains/<dominio>?teamId=$OID" \
  -H "Authorization: Bearer $VT" -H "Content-Type: application/json" \
  --data '{"redirect":"suoac.com","redirectStatusCode":308}'

# listar domínios e configs:
curl -s "https://api.vercel.com/v9/projects/$PID/domains?teamId=$OID" \
  -H "Authorization: Bearer $VT"
```

### 9.4. Forçar um redeploy (sem novo commit)

```bash
# redeploy do último de produção:
npx vercel redeploy <deployment-url-ou-id> --scope fioravante-chiozzis-projects
# ou deploy direto da branch atual:
npx vercel deploy --prod --scope fioravante-chiozzis-projects             # produção
npx vercel deploy --target preview --scope fioravante-chiozzis-projects   # preview/staging
```

### 9.5. Rollback (voltar produção para um deploy anterior)

```bash
npx vercel ls --scope fioravante-chiozzis-projects          # achar o deploy bom
npx vercel rollback <deployment-url> --scope fioravante-chiozzis-projects
# (alternativa: promover um deploy específico)
npx vercel promote  <deployment-url> --scope fioravante-chiozzis-projects
```

### 9.6. Ver logs de runtime / build

```bash
npx vercel logs <deployment-url> --scope fioravante-chiozzis-projects
npx vercel inspect <deployment-url> --scope fioravante-chiozzis-projects
```

### 9.7. Mexer no DNS (Cloudflare)

```bash
ZID=6af0fae04dd0fef1c70e828112790d60
# listar:
curl -s -H "Authorization: Bearer <CF_TOKEN>" \
  "https://api.cloudflare.com/client/v4/zones/$ZID/dns_records"
# criar A (sempre proxied:false):
curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$ZID/dns_records" \
  -H "Authorization: Bearer <CF_TOKEN>" -H "Content-Type: application/json" \
  --data '{"type":"A","name":"<nome>","content":"76.76.21.21","proxied":false,"ttl":1}'
```

Ou simplesmente no painel: **DNS → Records**, lembrando de deixar **DNS only (cinza)**.

### 9.8. Reativar/ajustar a proteção de preview

```bash
# desativar (estado atual):           {"ssoProtection":null}
# proteger só previews:               {"ssoProtection":{"deploymentType":"preview"}}
# proteger tudo:                      {"ssoProtection":{"deploymentType":"all"}}
curl -s -X PATCH "https://api.vercel.com/v9/projects/$PID?teamId=$OID" \
  -H "Authorization: Bearer $VT" -H "Content-Type: application/json" \
  --data '{"ssoProtection":null}'
```

---

## 10. Armadilhas e quirks descobertos (leia antes de depurar)

1. **`vercel deploy` sem flag promove o 1º deploy a produção** (projeto sem produção
   prévia). Use sempre `--prod` (produção) ou `--target preview` (staging) explícito.
2. **`vercel env add <name> preview` exige branch explícito em modo não-interativo**
   (erro `action_required: git_branch_required`). Passe a branch como 3º argumento, ou
   faça interativo para "all Preview branches".
3. **Envs Production/Preview são `sensitive` (write-only)** — não dá para ler o valor
   de volta; só sobrescrever (com `--force`).
4. **Cloudflare cria registros como Proxied (laranja) por padrão** → quebra o SSL da
   Vercel. **Tem que ser DNS-only (cinza).** Via API: `proxied:false`.
5. **Não há comando CLI** para: redirect de domínio, domínio→branch, e
   ativar/desativar proteção. Tudo isso é **REST API** (seções 9.3 e 9.8).
6. **Refs locais desatualizados enganam.** Sempre `git fetch` antes de comparar
   `main` vs `develop`. Na montagem, o `main` local estava 29 commits atrás do remoto e
   quase levou a um deploy errado. Estado real: **`origin/main` ⊇ `origin/develop`**.
7. **SSL não é instantâneo.** Após o DNS apontar, a Vercel leva de segundos a alguns
   minutos para emitir o certificado por domínio (durante esse tempo: `SSL_ERROR` no
   curl). Só esperar.

---

## 11. Troubleshooting

### "Não é possível encontrar o endereço DNS de suoac.com" (no navegador)

**Quase sempre é cache de DNS local/roteador**, não o site. Aconteceu na montagem: o
roteador (`192.168.15.1`) tinha um **NXDOMAIN cacheado** do apex (porque o domínio foi
acessado antes de existir), com TTL negativo de **1800s (30 min)**.

Diagnóstico:

```bash
# Resolvedores públicos devem retornar 76.76.21.21:
for r in 1.1.1.1 8.8.8.8 9.9.9.9; do echo -n "$r: "; dig +short A suoac.com @$r; done
# O que o seu roteador/ISP responde:
dig +short A suoac.com @192.168.15.1
# Resposta autoritativa (sempre correta):
dig +short A suoac.com @rob.ns.cloudflare.com
```

Se os públicos resolvem e o local não → **é cache local**. Soluções:

- Trocar o DNS da máquina para `1.1.1.1`/`8.8.8.8` (resolve na hora).
- Reiniciar o roteador (limpa o cache dele).
- Esperar ≤ 30 min (TTL negativo expira).
- **Limpar o cache do navegador:** `chrome://net-internals/#dns` → _Clear host cache_
  e `chrome://net-internals/#sockets` → _Flush socket pools_.
- Confirmar que o site está no ar por **outra rede** (4G/5G no celular).

### `staging.suoac.com` retorna 401

É a **Vercel Deployment Protection**. Estado atual: **desativada** (`ssoProtection:null`).
Se voltar a dar 401, alguém reativou — ver §9.8.

### Deploy publicou mas o app dá erro ao chamar a API

Provavelmente `API_BASE_URL` ausente/errada **naquele ambiente** (lembre que preview de
`feature/*` não tem a env — §9.1), ou o backend Railway está fora. Verifique env (§9.1)
e a saúde do backend.

---

## 12. Segredos e credenciais

| Segredo                | Onde vive                                                 | Observação                                                                                                 |
| ---------------------- | --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Sessão Vercel CLI      | `~/.local/share/com.vercel.cli/auth.json` (chave `token`) | Login da máquina; usado também para a REST API na montagem                                                 |
| Token Cloudflare (DNS) | _removido_                                                | Criado só para o DNS; arquivo `~/.suoac-cf-token` apagado. **Revogar no painel** se ainda estiver `active` |
| `API_BASE_URL` (local) | `.env.local` (git-ignored)                                | Aponta para o backend de **staging** em dev                                                                |
| `.vercel/project.json` | raiz (git-ignored)                                        | `projectId` + `orgId` do link                                                                              |

> O `.gitignore` já cobre `.env*` e `.vercel`. **Nunca** comite esses arquivos.

---

## 13. Custos (atuais)

| Item                              | Custo                                           |
| --------------------------------- | ----------------------------------------------- |
| Front (Vercel Hobby)              | Grátis (uso não-comercial; 1 pessoa faz deploy) |
| Domínio `suoac.com` (Cloudflare)  | ~US$ 10,44/ano (~R$ 55/ano)                     |
| Backend (Railway, prod + staging) | recorrente (fora deste repo)                    |
| Banco (Neon)                      | fora deste repo                                 |

Gatilhos para migrar o front para o **Vercel Pro**: virar comercial; mais de uma pessoa
precisando fazer deploy; necessidade de proteção por senha em previews/logs longos.

---

## 14. Pendências e melhorias opcionais

- [ ] **Revogar o token do Cloudflare** no painel (o arquivo local já foi apagado).
- [ ] **Commitar/atualizar docs** (`DEPLOY.md` e este arquivo) — hoje `DEPLOY.md`
      está _untracked_.
- [ ] **(Opcional) Backend em domínio próprio:** apontar `api.suoac.com` /
      `api-staging.suoac.com` para o Railway (custom domain no Railway + CNAME no
      Cloudflare) e trocar `API_BASE_URL` para esses hosts. Não é necessário —
      tudo funciona com as URLs `*.up.railway.app`.
- [ ] **(Opcional) Env para previews de `feature/*`** se quiser que PRs de feature
      tenham API funcional (§9.1).
- [ ] **PWA** ainda **não implementado** (sem manifest/service worker); quando for, a
      Vercel serve sem ajuste de infra.

---

_Documento gerado a partir do estado real da infra em 12/06/2026. Mantenha-o atualizado
ao mudar qualquer coisa de deploy/DNS/env._
