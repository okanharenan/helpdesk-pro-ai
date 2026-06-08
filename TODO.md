# TODO - Ajuste padrão SaaS e correção de ícones

## Feito
- [x] Revisar endpoints e onde baseURL/paths estavam hardcoded.
- [x] Atualizar `frontend/src/services/api.js` para usar `VITE_API_URL`.
- [x] Ajustar link de anexo em `frontend/src/pages/TicketDetails/TicketDetails.jsx` para não depender de `http://localhost`.

## A corrigir
- [ ] Reverter `frontend/src/pages/TicketDetails/TicketDetails.jsx` para a versão original (apenas manter a mudança do `href` do anexo) para evitar quebra de ícones/estilos.

## Depois
- [ ] Validar build/frontend e navegação (Tickets -> TicketDetails).

