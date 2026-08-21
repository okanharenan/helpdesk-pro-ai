require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const http = require("http");

const authRoutes = require("./routes/auth.routes");
const ticketRoutes = require("./routes/ticket.routes");
const userRoutes = require("./routes/user.routes");
const settingsRoutes = require("./routes/settings.routes");
const chatRoutes = require("./routes/chat.routes");
const { protect, requireRole } = require("./middlewares/auth.middleware");
const { allowedOrigins } = require("./config/corsOrigins");
const initSocket = require("./socket");

const app = express();
const server = http.createServer(app);
initSocket(server);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log("CORS bloqueado para origem:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);

app.use(express.json());

app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    console.log(`${req.method} ${req.path} — ${Date.now() - start}ms`);
  });
  next();
});

app.use("/api/uploads", protect, express.static(path.join(__dirname, "..", "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/users", userRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/chat", chatRoutes);

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
  console.error(err);
  res
    .status(err.status || 500)
    .json({ message: err.message || "Erro interno" });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));