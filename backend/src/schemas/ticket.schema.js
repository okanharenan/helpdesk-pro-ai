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

// assigneeId = número (novo responsável) ou null (deixar sem responsável)
const assignTicketSchema = z.object({
  assigneeId: z.number().int().positive().nullable(),
});

// Atribuição em massa: até 100 tickets por vez; assigneeId = null deixa todos sem responsável
const bulkAssignTicketsSchema = z.object({
  ticketIds: z.array(z.number().int().positive()).min(1, "selecione ao menos um ticket").max(100, "máximo de 100 tickets por vez"),
  assigneeId: z.number().int().positive().nullable(),
});

module.exports = { createTicketSchema, updateTicketSchema, addCommentSchema, assignTicketSchema, bulkAssignTicketsSchema };
