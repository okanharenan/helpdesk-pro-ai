const logger = require("../config/logger");

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-6";

const VALID_PRIORITY = ["LOW", "MEDIUM", "HIGH"];
const VALID_CATEGORY = [
  "HARDWARE",
  "SOFTWARE",
  "REDE",
  "ACESSO_CONTA",
  "FINANCEIRO",
  "OUTRO",
];

function aiEnabled() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

async function callClaude({ system, prompt, maxTokens = 500 }) {
  const res = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Anthropic API respondeu ${res.status}: ${body.slice(0, 300)}`);
  }

  const data = await res.json();
  const text = (data.content || [])
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();

  return text;
}

/**
 * Classifica um chamado recém-criado: sugere categoria, prioridade e um
 * resumo curto para ajudar o agente a triar mais rápido.
 *
 * Retorna null se a IA estiver desabilitada (sem ANTHROPIC_API_KEY) ou se
 * a chamada falhar — nunca lança erro, pois essa classificação não pode
 * bloquear a criação do chamado.
 */
async function classifyTicket({ title, description }) {
  if (!aiEnabled()) return null;

  try {
    const text = await callClaude({
      maxTokens: 300,
      system:
        "Você é um assistente de triagem de um sistema de helpdesk. " +
        "Responda APENAS com um JSON válido, sem markdown, sem texto extra, " +
        `no formato: {"category": string, "suggestedPriority": string, "summary": string}. ` +
        `"category" deve ser um destes valores: ${VALID_CATEGORY.join(", ")}. ` +
        `"suggestedPriority" deve ser um destes valores: ${VALID_PRIORITY.join(", ")}. ` +
        '"summary" deve ter no máximo 20 palavras, em português, resumindo o problema para um agente que ainda não leu o chamado.',
      prompt: `Título: ${title}\n\nDescrição: ${description}`,
    });

    const parsed = JSON.parse(text);

    if (!VALID_CATEGORY.includes(parsed.category)) parsed.category = "OUTRO";
    if (!VALID_PRIORITY.includes(parsed.suggestedPriority)) parsed.suggestedPriority = null;
    if (typeof parsed.summary !== "string") parsed.summary = null;

    return parsed;
  } catch (err) {
    logger.warn({ err: err.message }, "[ai] falha ao classificar ticket, seguindo sem classificação");
    return null;
  }
}

/**
 * Gera uma sugestão de resposta para o agente, com base no chamado e no
 * histórico de comentários. O agente sempre revisa/edita antes de enviar —
 * isso nunca é postado automaticamente como comentário.
 */
async function suggestReply({ ticket, comments }) {
  if (!aiEnabled()) {
    const err = new Error("Recurso de IA não configurado (ANTHROPIC_API_KEY ausente)");
    err.code = "AI_DISABLED";
    throw err;
  }

  const history = (comments || [])
    .map((c) => `${c.user?.role === "CLIENT" ? "Cliente" : "Agente"}: ${c.body}`)
    .join("\n");

  const prompt =
    `Chamado: ${ticket.title}\n` +
    `Descrição original: ${ticket.description}\n` +
    (history ? `\nHistórico de comentários:\n${history}\n` : "\n(sem comentários ainda)\n") +
    "\nEscreva uma sugestão de resposta profissional, empática e objetiva para o agente enviar ao cliente.";

  const text = await callClaude({
    maxTokens: 400,
    system:
      "Você ajuda agentes de suporte a redigir respostas para chamados de helpdesk. " +
      "Escreva em português do Brasil, tom profissional e cordial, direto ao ponto (no máximo 120 palavras). " +
      "Responda apenas com o texto da resposta sugerida, sem saudações genéricas como 'Claro, aqui está', sem aspas, sem markdown.",
    prompt,
  });

  return text;
}

module.exports = { classifyTicket, suggestReply, aiEnabled, VALID_CATEGORY, VALID_PRIORITY };
