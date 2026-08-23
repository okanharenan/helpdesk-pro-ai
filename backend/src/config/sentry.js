const Sentry = require("@sentry/node");

function initSentry() {
  if (!process.env.SENTRY_DSN) {
    console.log("[sentry] SENTRY_DSN não configurado — monitoramento de erros desativado");
    return;
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || "development",
    tracesSampleRate: 0.1,
    integrations: (integrations) => integrations.filter((i) => i.name !== "Pino"),
  });

  console.log("[sentry] Monitoramento de erros ativado");
}

module.exports = { Sentry, initSentry };