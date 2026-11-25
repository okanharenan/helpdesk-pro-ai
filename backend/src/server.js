require("dotenv").config();

const logger = require("./config/logger");
const { initSentry, Sentry } = require("./config/sentry");
initSentry();

const express = require("express");
const cors = require("cors");
const path = require("path");
const http = require("http");
const helmet = require("helmet");
const pinoHttp = require("pino-http");


const prisma = require("./config/prisma");
const authRoutes = require("./routes/auth.routes");
const ticketRoutes = require("./routes/ticket.routes");
const userRoutes = require("./routes/user.routes");
const settingsRoutes = require("./routes/settings.routes");
const chatRoutes = require("./routes/chat.routes");
const notificationRoutes = require("./routes/notification.routes");
const assignmentRoutes = require("./routes/assignment.routes");
const { protect, requireRole } = require("./middlewares/auth.middleware");
const { allowedOrigins } = require("./config/corsOrigins");
const initSocket = require("./socket");
const { setIo } = require("./helpers/realtime");

const app = express();
const server = http.createServer(app);
setIo(initSocket(server)); // deixa os controllers avisarem usuários online em tempo real

app.use(helmet());

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        logger.warn({ origin }, "CORS bloqueado");
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);

app.use(express.json());

app.use(pinoHttp({ logger }));

app.get("/api/health", async (req, res) => {
  const health = {
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    health.database = "ok";
  } catch (err) {
    health.database = "error";
    health.status = "degraded";
    logger.error({ err }, "Health check: falha ao conectar no banco");
  }

  res.status(health.status === "ok" ? 200 : 503).json(health);
});

app.use("/api/uploads", protect, express.static(path.join(__dirname, "..", "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/users", userRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/assignment", assignmentRoutes);

app.get('/api/clear-all-cache', protect, requireRole('SUPERADMIN'), async (req, res) => {
  try {
    const redis = require('./config/redis')
    await redis.flushall()
    res.json({ ok: true, msg: 'Todo o cache limpo' })
  } catch (err) {
    res.status(500).json({ ok: false, err: err.message })
  }
})

app.use((err, req, res, next) => {
  const tooBig = err.code === "LIMIT_FILE_SIZE";
  const status = err.status || (tooBig ? 400 : 500);

  if (status >= 500) {
    Sentry.captureException(err);
    logger.error({ err }, "Erro não tratado na requisição");
  } else {
    logger.warn({ status, message: err.message }, "Requisição recusada");
  }

  res.status(status).json({
    message: tooBig ? "Arquivo muito grande (máximo 5MB)" : err.message || "Erro interno",
  });
});

process.on("unhandledRejection", (reason) => {
  Sentry.captureException(reason);
  logger.error({ reason }, "unhandledRejection");
});

process.on("uncaughtException", (err) => {
  Sentry.captureException(err);
  logger.error({ err }, "uncaughtException");
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => logger.info(`Servidor rodando na porta ${PORT}`));