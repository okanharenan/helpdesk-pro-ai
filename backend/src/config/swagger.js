const swaggerJSDoc = require("swagger-jsdoc");

const definition = {
  openapi: "3.0.3",
  info: {
    title: "HelpDesk Pro API",
    version: "1.0.0",
    description:
      "API do sistema de gestão de chamados de suporte HelpDesk Pro. " +
      "Autenticação via Bearer token (JWT emitido pelo Supabase Auth).",
  },
  servers: [
    { url: "/api", description: "Prefixo padrão da API" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      Error: {
        type: "object",
        properties: {
          message: { type: "string", example: "Mensagem de erro" },
        },
      },
      User: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          name: { type: "string", example: "Maria Souza" },
          email: { type: "string", example: "maria@empresa.com" },
          role: {
            type: "string",
            enum: ["SUPERADMIN", "ADMIN", "AGENT", "CLIENT"],
            example: "AGENT",
          },
          active: { type: "boolean", example: true },
        },
      },
      Ticket: {
        type: "object",
        properties: {
          id: { type: "integer", example: 42 },
          title: { type: "string", example: "Impressora não liga" },
          description: { type: "string", example: "A impressora do 3º andar não liga desde ontem." },
          status: {
            type: "string",
            enum: ["OPEN", "DOING", "RESOLVED", "CLOSED"],
            example: "OPEN",
          },
          priority: {
            type: "string",
            enum: ["LOW", "MEDIUM", "HIGH"],
            example: "MEDIUM",
          },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
          aiCategory: {
            type: "string",
            nullable: true,
            enum: ["HARDWARE", "SOFTWARE", "REDE", "ACESSO_CONTA", "FINANCEIRO", "OUTRO"],
            description: "Categoria sugerida automaticamente pela IA ao criar o chamado",
          },
          aiSuggestedPriority: {
            type: "string",
            nullable: true,
            enum: ["LOW", "MEDIUM", "HIGH"],
            description: "Prioridade sugerida pela IA (não substitui a prioridade escolhida pelo usuário)",
          },
          aiSummary: {
            type: "string",
            nullable: true,
            description: "Resumo curto gerado pela IA para triagem rápida",
          },
        },
      },
      TicketComment: {
        type: "object",
        properties: {
          id: { type: "integer", example: 7 },
          body: { type: "string", example: "Já chamei a assistência técnica." },
          createdAt: { type: "string", format: "date-time" },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
};

const options = {
  definition,
  // Lê as anotações JSDoc (@openapi) direto nos arquivos de rota.
  apis: ["./src/routes/*.js"],
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
