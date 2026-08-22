const { z } = require("zod");

const createTicketSchema = z.object({
  title: z.string().trim().min(3, "título muito curto").max(150),
  description: z.string().trim().min(3, "descrição muito curta").max(5000),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
});

const updateTicketSchema = z.object({
  title: z.string().trim().min(3).max(150).optional(),
  description: z.string().trim().min(3).max(5000).optional(),
  status: z.enum(["OPEN", "DOING", "RESOLVED", "CLOSED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
});

const addCommentSchema = z.object({
  body: z.string().trim().min(1, "comentário não pode ser vazio").max(3000),
});

module.exports = { createTicketSchema, updateTicketSchema, addCommentSchema };