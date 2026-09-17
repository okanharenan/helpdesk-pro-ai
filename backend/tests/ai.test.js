const { classifyTicket, suggestReply, aiEnabled } = require("../src/helpers/ai");

describe("helpers/ai", () => {
  const originalFetch = global.fetch;
  const originalKey = process.env.ANTHROPIC_API_KEY;

  afterEach(() => {
    global.fetch = originalFetch;
    process.env.ANTHROPIC_API_KEY = originalKey;
    jest.restoreAllMocks();
  });

  describe("aiEnabled", () => {
    it("retorna false sem ANTHROPIC_API_KEY", () => {
      delete process.env.ANTHROPIC_API_KEY;
      expect(aiEnabled()).toBe(false);
    });

    it("retorna true com ANTHROPIC_API_KEY definida", () => {
      process.env.ANTHROPIC_API_KEY = "sk-ant-test";
      expect(aiEnabled()).toBe(true);
    });
  });

  describe("classifyTicket", () => {
    it("retorna null quando a IA está desabilitada, sem lançar erro", async () => {
      delete process.env.ANTHROPIC_API_KEY;
      const result = await classifyTicket({ title: "t", description: "d" });
      expect(result).toBeNull();
    });

    it("retorna a classificação quando a API responde corretamente", async () => {
      process.env.ANTHROPIC_API_KEY = "sk-ant-test";
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          content: [
            {
              type: "text",
              text: JSON.stringify({
                category: "HARDWARE",
                suggestedPriority: "HIGH",
                summary: "Impressora não liga",
              }),
            },
          ],
        }),
      });

      const result = await classifyTicket({
        title: "Impressora quebrada",
        description: "A impressora do 3º andar não liga",
      });

      expect(result).toEqual({
        category: "HARDWARE",
        suggestedPriority: "HIGH",
        summary: "Impressora não liga",
      });
      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.anthropic.com/v1/messages",
        expect.objectContaining({ method: "POST" }),
      );
    });

    it("nunca lança erro e retorna null se a API falhar", async () => {
      process.env.ANTHROPIC_API_KEY = "sk-ant-test";
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => "erro interno",
      });

      const result = await classifyTicket({ title: "t", description: "d" });
      expect(result).toBeNull();
    });

    it("retorna null se a resposta não for um JSON válido", async () => {
      process.env.ANTHROPIC_API_KEY = "sk-ant-test";
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ content: [{ type: "text", text: "não é json" }] }),
      });

      const result = await classifyTicket({ title: "t", description: "d" });
      expect(result).toBeNull();
    });

    it("normaliza categoria/prioridade inválidas retornadas pela IA", async () => {
      process.env.ANTHROPIC_API_KEY = "sk-ant-test";
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          content: [
            {
              type: "text",
              text: JSON.stringify({
                category: "CATEGORIA_INVENTADA",
                suggestedPriority: "URGENTISSIMO",
                summary: "Resumo qualquer",
              }),
            },
          ],
        }),
      });

      const result = await classifyTicket({ title: "t", description: "d" });
      expect(result.category).toBe("OUTRO");
      expect(result.suggestedPriority).toBeNull();
    });
  });

  describe("suggestReply", () => {
    it("lança erro com code AI_DISABLED quando não há ANTHROPIC_API_KEY", async () => {
      delete process.env.ANTHROPIC_API_KEY;
      await expect(
        suggestReply({ ticket: { title: "t", description: "d" }, comments: [] }),
      ).rejects.toMatchObject({ code: "AI_DISABLED" });
    });

    it("retorna o texto sugerido pela API", async () => {
      process.env.ANTHROPIC_API_KEY = "sk-ant-test";
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          content: [{ type: "text", text: "Olá! Já estamos verificando seu chamado." }],
        }),
      });

      const result = await suggestReply({
        ticket: { title: "Impressora", description: "Não liga" },
        comments: [{ body: "Já tentei reiniciar", user: { role: "CLIENT" } }],
      });

      expect(result).toBe("Olá! Já estamos verificando seu chamado.");
    });

    it("propaga erro quando a API falha (quem chama decide como responder)", async () => {
      process.env.ANTHROPIC_API_KEY = "sk-ant-test";
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 429,
        text: async () => "rate limited",
      });

      await expect(
        suggestReply({ ticket: { title: "t", description: "d" }, comments: [] }),
      ).rejects.toThrow();
    });
  });
});
