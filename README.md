# HelpDesk Pro

Sistema de gestão de chamados de suporte interno, com controle de acesso por perfil, chat em tempo real entre a equipe, dashboard de métricas e relatórios.

![Status do build](https://github.com/okanharenan/helpdesk-pro-ai/actions/workflows/backend-ci.yml/badge.svg)

## Funcionalidades

- Abertura e acompanhamento de chamados com prioridade e status (Aberto → Em andamento → Resolvido → Fechado)
- Controle de acesso por perfil (SUPERADMIN, ADMIN, AGENT, CLIENT), com permissões configuráveis em tempo real
- Chat em tempo real entre usuários (WebSocket)
- Dashboard com métricas e alertas de chamados urgentes
- Relatórios por período
- Anexos em chamados
- Tema claro/escuro
- Classificação automática de chamados por IA (categoria, prioridade sugerida e resumo) ao abrir um ticket
- Sugestão de resposta por IA para agentes, revisável antes de enviar

<!-- Adicione aqui 2-3 prints reais: dashboard, tela de tickets, chat -->

## Stack

**Frontend:** React 19, Vite, React Router, Socket.IO Client, Supabase Auth
**Backend:** Node.js, Express, Prisma ORM, PostgreSQL, Socket.IO
**Cache:** Redis (Upstash)
**Deploy:** Vercel (frontend) · Render (backend) · Supabase (banco e autenticação)

## Rodando localmente

### Pré-requisitos
- Node.js 20+
- Uma conta no Supabase (banco Postgres + autenticação)
- Uma conta no Upstash (Redis)

### Backend
\`\`\`bash
cd backend
npm install
cp .env.example .env   # preencha com suas próprias credenciais
npx prisma generate
npx prisma db push
npm run dev
\`\`\`

### Frontend
\`\`\`bash
cd frontend
npm install
cp .env.example .env   # preencha com suas próprias credenciais
npm run dev
\`\`\`

## Variáveis de ambiente

### backend/.env
| Variável | Descrição |
|---|---|
| `PORT` | Porta do servidor |
| `CLIENT_URL` | URL do frontend (usada em redirects de OAuth) |
| `SUPABASE_URL` | URL do projeto Supabase |
| `SUPABASE_ANON_KEY` | Chave pública do Supabase |
| `SUPABASE_SERVICE_KEY` | Chave de service role (sensível — nunca commitar) |
| `DATABASE_URL` / `DIRECT_URL` | Conexão com o Postgres |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Conexão com o Redis (cache, via REST) |
| `REDIS_URL` (opcional) | Conexão TCP com o Redis, usada pelo adapter do Socket.IO para sincronizar mensagens/presença entre múltiplas instâncias |
| `ANTHROPIC_API_KEY` (opcional) | Habilita a classificação automática de chamados e a sugestão de resposta por IA (Claude). Sem ela, essas features ficam desativadas e o resto do sistema funciona normalmente |

### frontend/.env
| Variável | Descrição |
|---|---|
| `VITE_API_URL` | URL da API do backend |
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | Autenticação no cliente |

## Documentação da API

[#documentação-da-api](#documentação-da-api)

Com o backend rodando, a documentação interativa (Swagger UI) fica disponível em:

```
http://localhost:3000/api/docs
```

Em produção: `https://helpdesk-pro-ai.onrender.com/api/docs`

## Testes

\`\`\`bash
cd backend
npm test
\`\`\`

## Licença

Projeto pessoal de estudo — sem licença de uso comercial definida.