# HelpDesk Pro

Sistema SaaS de gerenciamento de tickets para serviços gerais. Desenvolvido com React, Node.js, PostgreSQL (Supabase) e Redis (Upstash).

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React + Vite |
| Backend | Node.js + Express 5 |
| Banco de dados | PostgreSQL via Supabase + Prisma |
| Autenticação | Supabase Auth + JWT local (jwt.decode) |
| Cache | Redis via Upstash |
| Deploy Backend | Render |
| Deploy Frontend | Vercel |

---

## Estrutura do projeto

```
helpdesk-pro-ai/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar/Navbar.jsx
│   │   │   ├── Sidebar/Sidebar.jsx
│   │   │   └── ProtectedRoute/ProtectedRoute.jsx
│   │   ├── contexts/
│   │   │   ├── AuthContext.jsx
│   │   │   ├── ThemeContext.jsx
│   │   │   └── MeContext.jsx
│   │   ├── hooks/
│   │   │   └── useThemeColors.js
│   │   ├── pages/
│   │   │   ├── Dashboard/Dashboard.jsx
│   │   │   ├── Tickets/Tickets.jsx
│   │   │   ├── TicketDetails/TicketDetails.jsx
│   │   │   ├── Users/Users.jsx
│   │   │   ├── Reports/Reports.jsx
│   │   │   ├── Login/login.jsx
│   │   │   ├── Register/Register.jsx
│   │   │   ├── ForgotPassword/ForgotPassword.jsx
│   │   │   └── AuthCallback/AuthCallback.jsx
│   │   ├── routes/AppRoutes.jsx
│   │   ├── styles/global.css
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── .env.local
│   └── package.json
│
└── backend/
    ├── src/
    │   ├── config/
    │   │   ├── supabase.js
    │   │   ├── prisma.js
    │   │   ├── redis.js
    │   │   └── upload.js
    │   ├── controllers/
    │   │   ├── auth.controller.js
    │   │   ├── ticket.controller.js
    │   │   └── user.controller.js
    │   ├── helpers/
    │   │   └── cache.js
    │   ├── middlewares/
    │   │   └── auth.middleware.js
    │   ├── routes/
    │   │   ├── auth.routes.js
    │   │   ├── ticket.routes.js
    │   │   └── user.routes.js
    │   └── server.js
    ├── prisma/
    │   └── schema.prisma
    ├── uploads/
    ├── .env
    └── package.json
```

---

## Pré-requisitos

- Node.js 18+
- Conta no [Supabase](https://supabase.com) (gratuito)
- Conta no [Upstash](https://upstash.com) (gratuito)
- Conta no [Render](https://render.com) (gratuito)
- Conta no [Vercel](https://vercel.com) (gratuito)

---

## Variáveis de ambiente

### Backend (`backend/.env`)

```env
PORT=3000
CLIENT_URL=https://seu-frontend.vercel.app

# Supabase
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...

# Banco de dados (Supabase → Settings → Database → Connection string)
DATABASE_URL=postgresql://postgres.[ref]:[senha]@aws-1-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.[ref]:[senha]@aws-1-us-west-2.pooler.supabase.com:5432/postgres

# Redis (Upstash → REST API)
UPSTASH_REDIS_REST_URL=https://xxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxxx

# JWT
JWT_SECRET=escolha_uma_string_longa_e_segura
```

### Frontend (`frontend/.env.local`)

```env
VITE_API_URL=https://seu-backend.onrender.com/api
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

---

## Rodando localmente

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/helpdesk-pro-ai.git
cd helpdesk-pro-ai
```

### 2. Backend

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

O servidor sobe em `http://localhost:3000`.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

O frontend sobe em `http://localhost:5174`.

---

## Configuração do Supabase

### 1. Criar projeto

1. Acesse [supabase.com](https://supabase.com) → New project
2. Escolha nome, senha e região (us-east-1 recomendado)
3. Aguarde o projeto inicializar (~2min)

### 2. Configurar autenticação por e-mail

1. **Authentication → Providers → Email** → habilitar
2. **Authentication → Settings**:
   - Site URL: `https://seu-frontend.vercel.app`
   - Redirect URLs: adicionar `https://seu-frontend.vercel.app/auth/callback`

### 3. Configurar OAuth Google (opcional)

1. Acesse [Google Cloud Console](https://console.cloud.google.com)
2. APIs & Services → Credentials → Create OAuth 2.0 Client
3. Authorized redirect URIs: `https://xxxx.supabase.co/auth/v1/callback`
4. Copie Client ID e Client Secret
5. No Supabase → Authentication → Providers → Google → cole as credenciais

### 4. Obter as chaves

- **Supabase URL e ANON_KEY**: Settings → API
- **SERVICE_KEY**: Settings → API → service_role (nunca exponha no frontend)
- **DATABASE_URL**: Settings → Database → Connection pooling (Transaction mode, porta 6543)
- **DIRECT_URL**: Settings → Database → Connection string (porta 5432)

### 5. Criar SUPERADMIN

Após o primeiro usuário se registrar, execute no **SQL Editor** do Supabase:

```sql
UPDATE "User" SET role = 'SUPERADMIN' WHERE email = 'seu@email.com';
```

---

## Configuração do Upstash (Redis)

1. Acesse [upstash.com](https://upstash.com) → Create Database
2. Nome: `helpdesk-cache` | Região: US-East-1
3. Copie **UPSTASH_REDIS_REST_URL** e **UPSTASH_REDIS_REST_TOKEN**
4. Cole no `.env` do backend

---

## Deploy em produção

### Backend → Render

#### 1. Prepare o repositório

Certifique-se que o `backend/package.json` tem o script de start:

```json
{
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "build": "npx prisma generate"
  }
}
```

#### 2. Crie o serviço no Render

1. Acesse [render.com](https://render.com) → New → Web Service
2. Conecte seu repositório GitHub
3. Configure:
   - **Name**: `helpdesk-backend`
   - **Root Directory**: `backend`
   - **Runtime**: Node
   - **Build Command**: `npm install && npx prisma generate`
   - **Start Command**: `node src/server.js`
   - **Instance Type**: Free (ou Starter para produção real)

#### 3. Adicione as variáveis de ambiente

No Render → seu serviço → **Environment** → adicione todas as variáveis do `.env`:

```
PORT=3000
CLIENT_URL=https://seu-frontend.vercel.app
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_KEY=...
DATABASE_URL=...
DIRECT_URL=...
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
JWT_SECRET=...
```

#### 4. Configure o CORS

No `backend/src/server.js`, certifique-se que o CORS aceita a URL do Vercel:

```js
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}))
```

#### 5. Deploy

Clique em **Deploy** e aguarde (~3-5min). Copie a URL gerada (ex: `https://helpdesk-backend.onrender.com`).

> **Atenção**: O plano gratuito do Render hiberna após 15min sem uso. O primeiro request pode demorar ~30s para "acordar". Para produção real, use o plano Starter ($7/mês).

---

### Frontend → Vercel

#### 1. Prepare o repositório

Certifique-se que o `frontend/package.json` tem os scripts corretos:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

#### 2. Crie o projeto no Vercel

1. Acesse [vercel.com](https://vercel.com) → Add New → Project
2. Importe o repositório GitHub
3. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

#### 3. Adicione as variáveis de ambiente

No Vercel → seu projeto → **Settings → Environment Variables**:

```
VITE_API_URL=https://helpdesk-backend.onrender.com/api
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

#### 4. Configure redirecionamento de rotas (SPA)

Crie o arquivo `frontend/public/vercel.json`:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

Isso garante que rotas como `/tickets/1` funcionem ao atualizar a página.

#### 5. Deploy

Clique em **Deploy** e aguarde (~2min). Copie a URL gerada (ex: `https://helpdesk-pro.vercel.app`).

---

## Pós-deploy: checklist

Após o deploy, verifique cada item:

- [ ] Atualizar `CLIENT_URL` no backend (Render) com a URL do Vercel
- [ ] Atualizar `VITE_API_URL` no frontend (Vercel) com a URL do Render
- [ ] Atualizar **Site URL** no Supabase com a URL do Vercel
- [ ] Atualizar **Redirect URLs** no Supabase com `https://seu-frontend.vercel.app/auth/callback`
- [ ] Fazer um novo deploy no Vercel após alterar variáveis de ambiente
- [ ] Criar o usuário SUPERADMIN via SQL Editor do Supabase
- [ ] Testar login, criação de ticket e acesso ao dashboard

---

## Permissões por role

| Ação | SUPERADMIN | ADMIN | AGENT | CLIENT |
|------|:---------:|:-----:|:-----:|:------:|
| Ver todos os tickets | ✅ | ✅ | ✅ | ❌ |
| Abrir ticket | ✅ | ✅ | ✅ | ✅ |
| Comentar em qualquer ticket | ✅ | ✅ | ✅ | ❌ |
| Comentar nos próprios tickets | ✅ | ✅ | ✅ | ✅ |
| Alterar status/prioridade | ✅ | ✅ | ❌ | ❌ |
| Criar usuários | ✅ | ❌ | ❌ | ❌ |
| Deletar usuários | ✅ | ❌ | ❌ | ❌ |
| Deletar tickets | ✅ | ❌ | ❌ | ❌ |
| Ver relatórios | ✅ | ✅ | ✅ | ❌ |

---

## Cache Redis (Upstash)

| Chave | TTL | Invalidado quando |
|-------|-----|-------------------|
| `tickets:all` | 5 min | criar/editar/deletar ticket |
| `tickets:user:{id}` | 5 min | cliente cria ticket |
| `ticket:{id}` | 5 min | editar/comentar/deletar |
| `users:all` | 10 min | criar/editar/deletar usuário |
| `me:{email}` | 5 min | alterar role do usuário |

---

## Solução de problemas comuns

### CORS error no frontend
Verifique se `CLIENT_URL` no backend está igual à URL exata do Vercel (sem barra no final).

### Redirect após login vai para tela errada
Verifique se o `Redirect URLs` no Supabase inclui `https://seu-frontend.vercel.app/auth/callback`.

### Erro 500 ao buscar usuários
O campo `active` pode não existir no banco. Execute no SQL Editor:
```sql
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;
```
Depois rode `npx prisma db push` no backend.

### Backend "dormindo" no Render (plano gratuito)
Configure um serviço de ping como [UptimeRobot](https://uptimerobot.com) apontando para `https://seu-backend.onrender.com/health` a cada 5 minutos.

### Migrations em produção
Nunca rode `prisma migrate dev` em produção. Use:
```bash
npx prisma migrate deploy
```

---

## Tecnologias e versões

```json
{
  "backend": {
    "express": "^5.x",
    "prisma": "^6.x",
    "@supabase/supabase-js": "^2.x",
    "@upstash/redis": "^1.x",
    "jsonwebtoken": "^9.x",
    "multer": "^1.x",
    "cors": "^2.x"
  },
  "frontend": {
    "react": "^18.x",
    "react-router-dom": "^6.x",
    "axios": "^1.x",
    "vite": "^5.x"
  }
}
```

---

## Licença

MIT © HelpDesk Pro
