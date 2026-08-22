const resend = require("../config/resend");

const STATUS_LABELS = {
  OPEN: "Aberto",
  DOING: "Em andamento",
  RESOLVED: "Resolvido",
  CLOSED: "Fechado",
};

async function sendStatusChangeEmail({ to, name, ticketId, ticketTitle, oldStatus, newStatus }) {
  if (!process.env.RESEND_API_KEY) {
    console.log("[email] RESEND_API_KEY não configurada — pulando envio de e-mail");
    return;
  }

  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM || "HelpDesk Pro <onboarding@resend.dev>",
      to,
      subject: `Chamado #${ticketId} atualizado: ${STATUS_LABELS[newStatus] || newStatus}`,
      html: `
        <div style="font-family: 'Inter', system-ui, sans-serif; max-width: 480px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg,#16a34a,#22c55e); padding: 20px 24px; border-radius: 12px 12px 0 0;">
            <h2 style="color: #fff; margin: 0; font-size: 18px;">HelpDesk Pro</h2>
          </div>
          <div style="border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; padding: 24px;">
            <p style="color: #111; font-size: 14px;">Olá, ${name},</p>
            <p style="color: #374151; font-size: 14px;">
              O status do seu chamado <strong>#${ticketId} — ${ticketTitle}</strong> foi atualizado:
            </p>
            <div style="display: flex; align-items: center; gap: 8px; margin: 16px 0;">
              <span style="background: #f3f4f6; color: #6b7280; padding: 4px 12px; border-radius: 99px; font-size: 12px;">
                ${STATUS_LABELS[oldStatus] || oldStatus}
              </span>
              <span style="color: #9ca3af;">&rarr;</span>
              <span style="background: rgba(22,163,74,0.1); color: #16a34a; padding: 4px 12px; border-radius: 99px; font-size: 12px; font-weight: 600;">
                ${STATUS_LABELS[newStatus] || newStatus}
              </span>
            </div>
            <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">
              Este é um e-mail automático do HelpDesk Pro. Não é necessário responder.
            </p>
          </div>
        </div>
      `,
    });
    console.log(`[email] Notificação de status enviada para ${to}`);
  } catch (err) {
    console.error("[email] Falha ao enviar notificação:", err.message);
  }
}

module.exports = { sendStatusChangeEmail };