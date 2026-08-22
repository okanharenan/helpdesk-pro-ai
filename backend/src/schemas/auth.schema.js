const { z } = require("zod");

const registerSchema = z.object({
  name: z.string().trim().min(2, "nome muito curto").max(120),
  email: z.string().trim().email("e-mail inválido").toLowerCase(),
  password: z.string().min(6, "a senha precisa ter no mínimo 6 caracteres"),
});

const loginSchema = z.object({
  email: z.string().trim().email("e-mail inválido").toLowerCase(),
  password: z.string().min(1, "senha obrigatória"),
});

const forgotPasswordSchema = z.object({
  email: z.string().trim().email("e-mail inválido").toLowerCase(),
});

module.exports = { registerSchema, loginSchema, forgotPasswordSchema };