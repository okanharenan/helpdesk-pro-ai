const rateLimit = require("express-rate-limit");

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // no máximo 10 tentativas de login por IP nesse período
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Muitas tentativas de login. Tente novamente em alguns minutos." },
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5, // no máximo 5 registros por IP por hora
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Muitas tentativas de registro. Tente novamente mais tarde." },
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Muitas solicitações. Tente novamente em alguns minutos." },
});

module.exports = { loginLimiter, registerLimiter, forgotPasswordLimiter };