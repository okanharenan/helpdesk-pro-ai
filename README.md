# HelpDesk Pro

Sistema de gerenciamento de chamados para equipes de serviços gerais. Desenvolvido para substituir controles manuais por uma plataforma centralizada com controle de acesso por perfil, cache inteligente e deploy totalmente em nuvem.

---

## Por que existe

Equipes de manutenção e serviços gerais costumam usar planilhas, WhatsApp ou e-mail para registrar chamados — o que dificulta rastrear prioridades, tempo de resposta e quem está fazendo o quê. O HelpDesk Pro resolve isso com uma interface limpa e permissões bem definidas por tipo de usuário.

---

## O que faz

- Abertura e acompanhamento de chamados com prioridade (baixa, média, alta)
- Fluxo de status: Aberto → Em andamento → Resolvido → Fechado
- Comentários por chamado com histórico completo
- Dashboard com métricas reais e alertas de chamados urgentes
- Relatórios por período com gráficos de volume e performance por usuário
- Gerenciamento de usuários com controle granular de permissões por role
- Anexos em chamados (imagens, PDFs, documentos)
- Cache Redis para respostas rápidas mesmo com muitos dados
- Tema claro e escuro

---

## Perfis de acesso

| Perfil | O que pode fazer |
|--------|-----------------|
| **SUPERADMIN** | Acesso total. Gerencia usuários, permissões e configurações do sistema |
| **ADMIN** | Visualiza e edita todos os chamados, altera status e prioridade |
| **AGENT** | Visualiza chamados, adiciona comentários, não altera status |
| **CLIENT** | Abre chamados e acompanha apenas os seus próprios |

As permissões de cada perfil (exceto SUPERADMIN) são configuráveis pelo painel de Configurações em tempo real.

---

## Stack

**Frontend**
- React 19 + Vite 8
- React Router v7
- Axios
- Supabase JS (autenticação)
- Tabler Icons + Inter (UI)

**Backend**
- Node.js + Express 5
- Prisma ORM
- PostgreSQL via Supabase
- Redis via Upstash (cache)
- JWT (autenticação stateless)
- Multer (upload de arquivos)

**Infraestrutura**
- Frontend: Vercel
- Backend: Render
- Banco: Supabase
- Cache: Upstash

---

## Estrutura

```
helpdesk-pro-ai/
├── frontend/
│   ├── public/
│   │   └── vercel.json
│   └── src/
│       ├── components/
│       │   ├── Navbar/
│       │   └── Sidebar/
│       ├── contexts/
│       │   ├── AuthContext.jsx
│       │   ├── MeContext.jsx
│       │   └── ThemeContext.jsx
│       ├── pages/
│       │   ├── Dashboard/
│       │   ├── Tickets/
│       │   ├── TicketDetails/
│       │   ├── Users/
│       │   ├── Reports/
│       │   ├── Settings/
│       │   └── Login/
│       └── routes/
│           └── AppRoutes.jsx
│
└── backend/
    ├── prisma/
    │   └── schema.prisma
    └── src/
        ├── config/
        ├── controllers/
        ├── helpers/
        ├── middlewares/
        └── routes/
```

---

## Variáveis de ambiente

### Backend (`backend/.env`)

```env
PORT=3000
CLIENT_URL=https://seu-frontend.vercel.app

SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=

DATABASE_URL=postgresql://postgres.[ref]:[senha]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.[ref]:[senha]@aws-0-us-east-1.pooler.supabase.com:5432/postgres

UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

JWT_SECRET=
```

### Frontend (`frontend/.env.production`)

```env
VITE_API_URL=https://seu-backend.onrender.com/api
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=
```

---

## Rodando localmente

```bash
# Backend
cd backend
npm install
npx prisma generate
npx prisma db push
npm run dev
# Sobe em http://localhost:3000

# Frontend (outro terminal)
cd frontend
npm install
npm run dev
# Sobe em http://localhost:5173
```

---

## Deploy

### 1. Supabase
Crie um projeto em [supabase.com](https://supabase.com). Copie as chaves em **Settings → API** e as connection strings em **Settings → Database → Connect → ORMs (Prisma)**.

### 2. Upstash
Crie um banco Redis em [upstash.com](https://upstash.com). Copie a REST URL e o token.

### 3. Render (backend)
- Root Directory: `backend`
- Build Command: `npm install && npx prisma generate && npx prisma db push`
- Start Command: `node src/server.js`
- Adicione todas as variáveis do `backend/.env`

### 4. Vercel (frontend)
- Root Directory: `frontend`
- Framework: Vite
- Adicione as variáveis do `frontend/.env.production`

### 5. Após o deploy
Atualize o `CLIENT_URL` no Render com a URL do Vercel. Atualize o **Site URL** e **Redirect URLs** no Supabase em **Authentication → URL Configuration**.

### 6. Criar SUPERADMIN
Registre-se normalmente no sistema, depois execute no SQL Editor do Supabase:

```sql
UPDATE "User" SET role = 'SUPERADMIN' WHERE email = 'seu@email.com';
```

---

## Cache

O sistema usa Redis para reduzir chamadas ao banco. As chaves são invalidadas automaticamente quando os dados mudam.

| Chave | TTL |
|-------|-----|
| `tickets:all` | 5 min |
| `ticket:{id}` | 5 min |
| `users:all` | 10 min |
| `me:{email}` | 5 min |

---

## Segurança

- Tokens JWT decodificados localmente (sem roundtrip ao Supabase)
- Sessão expira automaticamente após 72h de inatividade
- Roles verificados no banco a cada requisição autenticada
- CORS restrito às origens cadastradas
- Variáveis sensíveis nunca expostas no frontend

---

## Licença

MIT
