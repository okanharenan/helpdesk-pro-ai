const { Redis } = require("ioredis");
const logger = require("./logger");

/**
 * Cliente Redis dedicado ao adapter do Socket.IO (pub/sub via TCP).
 *
 * O client `@upstash/redis` usado no restante do projeto (src/config/redis.js)
 * fala com o Upstash via REST e NÃO suporta pub/sub, então não pode ser
 * reaproveitado aqui. É necessário usar a URL de conexão Redis (TCP) do
 * Upstash, disponível no painel do banco em "Connect" > "ioredis" / ficha
 * "Redis" (formato rediss://default:<password>@<host>:<port>).
 *
 * Defina REDIS_URL nas variáveis de ambiente (Render + .env local).
 * Se REDIS_URL não estiver definida, o Socket.IO continua funcionando
 * normalmente em uma única instância, apenas sem sincronizar presença/mensagens
 * entre múltiplas instâncias.
 */
function createRedisAdapterClients() {
  const url = process.env.REDIS_URL;

  if (!url) {
    logger.warn(
      "REDIS_URL não definida — Socket.IO rodará sem Redis adapter (ok para 1 instância, mas não escala horizontalmente).",
    );
    return null;
  }

  const pubClient = new Redis(url, {
    maxRetriesPerRequest: null,
    lazyConnect: false,
  });
  const subClient = pubClient.duplicate();

  pubClient.on("error", (err) => logger.error({ err }, "[redis-adapter] erro no pubClient"));
  subClient.on("error", (err) => logger.error({ err }, "[redis-adapter] erro no subClient"));

  pubClient.on("connect", () => logger.info("[redis-adapter] pubClient conectado"));
  subClient.on("connect", () => logger.info("[redis-adapter] subClient conectado"));

  return { pubClient, subClient };
}

module.exports = { createRedisAdapterClients };
