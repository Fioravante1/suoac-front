# Histórico de Progresso - SUOAC Frontend

Este documento mantém o registro da evolução do projeto frontend, separando por conquistas e etapas concluídas para facilitar o rastreamento do que já foi implementado.

## 🚀 Status Atual

**Fase:** Implementação Base e Autenticação

---

## ✅ Entregas Concluídas

### 1. Setup Base e Infraestrutura

- Configuração do projeto com **Next.js 16** (App Router) e **React 19**.
- Setup rigoroso do **TypeScript** (`strict: true`).
- Configuração da **Feature-Sliced Design (FSD)** como arquitetura oficial.
- Implantação das validações de arquitetura via **Steiger** e **ESLint** (`eslint-plugin-boundaries`).
- Setup da suíte de testes com **Vitest** e **React Testing Library**, incluindo o `cleanup` automático pós-testes.

### 2. Design System e Estilização

- Definição do Design System ("Verde Organização") com tokens CSS globais.
- Tipografia oficializada (Inter).
- Substituição do favicon padrão do Next.js pelo logotipo vetorial do SUOAC (`app/icon.png`).

### 3. Componentes Compartilhados (Shared UI)

Criação dos componentes base reaproveitáveis na camada `shared`, todos acompanhados de **Testes Unitários**:

- **Button:** Suporte a variantes `primary`, `secondary` e `ghost`, 100% de largura (`fullWidth`), e animações de hover/disabled.
- **TextField:** Inputs estilizados com suporte a ícones laterais, labels vinculadas, estados de erro em vermelho e IDs autogerados.
- **Card:** Container com fundo e bordas super arredondadas padronizadas (`radius-xl`), com suporte a extensibilidade de CSS classes.

### 4. Camada de Negócio e Funcionalidades

- **Feature `sign-in`:**
  - Criação do `SignInForm` utilizando formulários controlados.
  - Validação de regras e tipos usando **React Hook Form** + **Zod**.
  - Testes unitários para validar a lógica de submissão.
  - UI atualizada para utilizar o spinner (`Loader2` da `lucide-react`) durante a submissão.

### 5. Camada de Páginas

- **Page `login`:**
  - Construção da página visual do login na camada FSD (`src/pages/login`).
  - Criação do logotipo vetorizado customizado (`public/logo.svg`).
  - Conexão da página FSD com o roteamento físico do Next.js via arquivo `app/(auth)/login/page.tsx`.

---

## 🚧 Próximos Passos (A Fazer)

- [ ] Conectar o envio do formulário de login (`SignInForm`) com o endpoint real de autenticação do backend.
- [ ] Criação do sistema de Layout Autenticado para páginas internas (Sidebar/Header).
- [ ] Início das views internas do sistema (Dashboard, Gestão de Eventos, Passageiros, etc).
- [ ] Integração real das requisições assíncronas utilizando **TanStack Query**.
