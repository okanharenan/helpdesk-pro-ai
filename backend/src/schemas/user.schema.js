const { z } = require("zod");

const updateUserSchema = z.object({
  role: z.enum(["ADMIN", "AGENT", "CLIENT"]).optional(),
  active: z.boolean().optional(),
});

module.exports = { updateUserSchema };