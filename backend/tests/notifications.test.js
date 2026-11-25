jest.mock("../src/config/prisma", () => require("jest-mock-extended").mockDeep());
jest.mock("../src/helpers/cache", () => ({
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  invalidateTickets: jest.fn(),
  TTL: { tickets: 300, ticket: 300 },
}));
jest.mock("../src/helpers/email", () => ({ sendStatusChangeEmail: jest.fn() }));
jest.mock("../src/helpers/storage", () => ({
  uploadTicketFile: jest.fn(),
  getSignedUrl: jest.fn(),
  removeFile: jest.fn(),
  SIGNED_URL_TTL: 60,
}));

const { mockReset } = require("jest-mock-extended");
const prisma = require("../src/config/prisma");
const realtime = require("../src/helpers/realtime");
const { notify } = require("../src/helpers/notifications");
const {
  createTicket,
  updateTicket,
  assignTicket,
  takeTicket,
  addComment,
} = require("../src/controllers/ticket.controller");
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
} = require("../src/controllers/notification.controller");

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

const reqFor = (email, extra = {}) => ({ user: { email }, params: { id: "10" }, body: {}, ...extra });

// Notificações criadas (só o campo "data" de cada chamada)
const created = () => prisma.notification.create.mock.calls.map(([arg]) => arg.data);

beforeEach(() => {
  mockReset(prisma);
  prisma.notification.create.mockImplementation(async ({ data }) => ({ id: 1, ...data }));
  realtime.setIo(null);
});

describe("notify (helper)", () => {
  it("cria a notificação e avisa em tempo real a sala da pessoa", async () => {
    const emit = jest.fn();
    const to = jest.fn().mockReturnValue({ emit });
    realtime.setIo({ to });

    await notify({ userId: 7, type: "ASSIGNED", title: "Oi", ticketId: 3 });

    expect(to).toHaveBeenCalledWith("user:7");
    expect(emit).toHaveBeenCalledWith(
      "notification:new",
      expect.objectContaining({ userId: 7, title: "Oi", ticketId: 3 })
    );
  });

  it("ignora itens vazios ou sem destinatário", async () => {
    await notify([null, false, undefined, { type: "X", title: "sem userId" }]);
    expect(prisma.notification.create).not.toHaveBeenCalled();
  });

  it("falha ao gravar não lança erro", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    prisma.notification.create.mockRejectedValue(new Error("banco fora"));

    await expect(notify({ userId: 1, type: "X", title: "t" })).resolves.toBeUndefined();
    console.error.mockRestore();
  });
});

describe("avisos — ticket novo", () => {
  const body = { title: "Impressora", description: "Não liga", priority: "MEDIUM" };

  it("avisa o SUPERADMIN que recebeu o ticket", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 4, role: "CLIENT" });
    prisma.permission.findUnique.mockResolvedValue({ canCreateTicket: true });
    prisma.user.findFirst.mockResolvedValue({ id: 1 });
    prisma.ticket.create.mockResolvedValue({
      id: 10, title: "Impressora", priority: "MEDIUM",
      assignee: { id: 1, name: "Super", role: "SUPERADMIN" },
    });

    await createTicket({ user: { email: "c@x.com" }, body }, mockRes());

    expect(created()).toEqual([
      { userId: 1, type: "ASSIGNED", ticketId: 10, title: "Novo ticket #10 atribuído a você", body: "Impressora" },
    ]);
  });

  it("ticket de prioridade alta vira aviso de urgente", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 4, role: "CLIENT" });
    prisma.permission.findUnique.mockResolvedValue({ canCreateTicket: true });
    prisma.user.findFirst.mockResolvedValue({ id: 1 });
    prisma.ticket.create.mockResolvedValue({
      id: 11, title: "Servidor caiu", priority: "HIGH",
      assignee: { id: 1, name: "Super", role: "SUPERADMIN" },
    });

    await createTicket({ user: { email: "c@x.com" }, body: { ...body, priority: "HIGH" } }, mockRes());

    expect(created()[0].title).toBe("Ticket urgente #11 atribuído a você");
  });

  it("não avisa quando o próprio responsável abriu o ticket", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 1, role: "SUPERADMIN" });
    prisma.ticket.create.mockResolvedValue({
      id: 12, title: "Teste", priority: "LOW",
      assignee: { id: 1, name: "Super", role: "SUPERADMIN" },
    });

    await createTicket({ user: { email: "s@x.com" }, body }, mockRes());

    expect(prisma.notification.create).not.toHaveBeenCalled();
  });
});

describe("avisos — troca de responsável", () => {
  const existing = {
    id: 10, userId: 4, assigneeId: 1, title: "Impressora",
    assignee: { id: 1, name: "Super", role: "SUPERADMIN" },
  };

  it("avisa quem recebeu e quem deixou o ticket", async () => {
    prisma.user.findUnique
      .mockResolvedValueOnce({ id: 2, name: "Admin", role: "ADMIN" })
      .mockResolvedValueOnce({ id: 3, role: "AGENT", active: true });
    prisma.ticket.findUnique.mockResolvedValue(existing);
    prisma.ticket.update.mockResolvedValue({
      id: 10, title: "Impressora", assigneeId: 3,
      assignee: { id: 3, name: "Agente", role: "AGENT" },
    });

    await assignTicket(reqFor("admin@x.com", { body: { assigneeId: 3 } }), mockRes());

    expect(created()).toEqual([
      expect.objectContaining({ userId: 3, type: "ASSIGNED", ticketId: 10, title: "Ticket #10 foi atribuído a você" }),
      expect.objectContaining({
        userId: 1, type: "UNASSIGNED", ticketId: 10,
        title: "Você não é mais responsável pelo ticket #10",
        body: "Agora o responsável é Agente",
      }),
    ]);
  });

  it("não avisa a si mesmo quando a pessoa atribui o ticket para ela", async () => {
    prisma.user.findUnique
      .mockResolvedValueOnce({ id: 2, name: "Admin", role: "ADMIN" })
      .mockResolvedValueOnce({ id: 2, role: "ADMIN", active: true });
    prisma.ticket.findUnique.mockResolvedValue({ ...existing, assigneeId: null, assignee: null });
    prisma.ticket.update.mockResolvedValue({
      id: 10, title: "Impressora", assigneeId: 2,
      assignee: { id: 2, name: "Admin", role: "ADMIN" },
    });

    await assignTicket(reqFor("admin@x.com", { body: { assigneeId: 2 } }), mockRes());

    expect(prisma.notification.create).not.toHaveBeenCalled();
  });

  it("não avisa ninguém se o responsável continua o mesmo", async () => {
    prisma.user.findUnique
      .mockResolvedValueOnce({ id: 2, name: "Admin", role: "ADMIN" })
      .mockResolvedValueOnce({ id: 1, role: "SUPERADMIN", active: true });
    prisma.ticket.findUnique.mockResolvedValue(existing);
    prisma.ticket.update.mockResolvedValue({
      id: 10, assigneeId: 1, assignee: { id: 1, name: "Super", role: "SUPERADMIN" },
    });

    await assignTicket(reqFor("admin@x.com", { body: { assigneeId: 1 } }), mockRes());

    expect(prisma.notification.create).not.toHaveBeenCalled();
  });
});

describe("avisos — mudança de status", () => {
  const existing = {
    id: 10, userId: 4, assigneeId: 1, status: "OPEN", priority: "MEDIUM",
    title: "Impressora", description: "Não liga",
  };
  const updated = {
    ...existing,
    user: { id: 4, name: "Cliente", email: "c@x.com" },
    assignee: { id: 1, name: "Super", role: "SUPERADMIN" },
  };

  it("avisa solicitante e responsável quando um terceiro muda o status", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 2, name: "Admin", role: "SUPERADMIN" });
    prisma.ticket.findUnique.mockResolvedValue(existing);
    prisma.ticket.update.mockResolvedValue({ ...updated, status: "RESOLVED" });

    await updateTicket(reqFor("admin@x.com", { body: { status: "RESOLVED" } }), mockRes());

    expect(created()).toEqual([
      expect.objectContaining({ userId: 4, type: "STATUS_CHANGED", title: "Seu ticket #10 mudou para Resolvido" }),
      expect.objectContaining({ userId: 1, type: "STATUS_CHANGED", title: "Ticket #10 mudou para Resolvido" }),
    ]);
    expect(created()[0].body).toBe("Admin alterou de Aberto para Resolvido");
  });

  it("não avisa quem fez a mudança", async () => {
    // o próprio responsável (id 1) muda o status: só o solicitante é avisado
    prisma.user.findUnique.mockResolvedValue({ id: 1, name: "Super", role: "SUPERADMIN" });
    prisma.ticket.findUnique.mockResolvedValue(existing);
    prisma.ticket.update.mockResolvedValue({ ...updated, status: "DOING" });

    await updateTicket(reqFor("super@x.com", { body: { status: "DOING" } }), mockRes());

    expect(created().map((n) => n.userId)).toEqual([4]);
  });

  it("não avisa nada se o status não mudou (só a prioridade)", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 1, name: "Super", role: "SUPERADMIN" });
    prisma.ticket.findUnique.mockResolvedValue(existing);
    prisma.ticket.update.mockResolvedValue({ ...updated, priority: "HIGH" });

    await updateTicket(reqFor("super@x.com", { body: { priority: "HIGH" } }), mockRes());

    expect(prisma.notification.create).not.toHaveBeenCalled();
  });
});

describe("avisos — assumir chamado e comentários", () => {
  it("avisa o solicitante quando alguém assume o chamado", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 2, name: "Agente", role: "AGENT" });
    prisma.permission.findUnique.mockResolvedValue({ canViewAllTickets: true });
    prisma.ticket.findUnique
      .mockResolvedValueOnce({ id: 10, userId: 4, assigneeId: null, status: "OPEN" })
      .mockResolvedValueOnce({
        id: 10, userId: 4, assigneeId: 2, status: "DOING", title: "T",
        user: { id: 4, name: "Cliente", email: "c@x.com" },
        assignee: { id: 2, name: "Agente", role: "AGENT" },
      });
    prisma.ticket.updateMany.mockResolvedValue({ count: 1 });

    await takeTicket(reqFor("agente@x.com"), mockRes());

    expect(created()).toEqual([
      expect.objectContaining({
        userId: 4, type: "TAKEN", ticketId: 10,
        title: "Seu ticket #10 foi assumido", body: "Agente começou o atendimento",
      }),
    ]);
  });

  it("comentário do solicitante avisa o responsável (e só ele)", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 4, name: "Cliente", role: "CLIENT" });
    prisma.permission.findUnique.mockResolvedValue({ canCommentAny: false });
    prisma.ticket.findUnique.mockResolvedValue({ id: 10, userId: 4, assigneeId: 1 });
    prisma.comment.create.mockResolvedValue({ id: 5, body: "Ainda não funciona" });

    await addComment(reqFor("c@x.com", { body: { body: "Ainda não funciona" } }), mockRes());

    expect(created()).toEqual([
      expect.objectContaining({
        userId: 1, type: "COMMENT", ticketId: 10,
        title: "Novo comentário no ticket #10", body: "Cliente: Ainda não funciona",
      }),
    ]);
  });

  it("comentário do responsável avisa o solicitante", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 1, name: "Super", role: "SUPERADMIN" });
    prisma.ticket.findUnique.mockResolvedValue({ id: 10, userId: 4, assigneeId: 1 });
    prisma.comment.create.mockResolvedValue({ id: 6, body: "Já estou vendo" });

    await addComment(reqFor("s@x.com", { body: { body: "Já estou vendo" } }), mockRes());

    expect(created().map((n) => n.userId)).toEqual([4]);
  });
});

describe("API de notificações", () => {
  const req = (extra = {}) => ({ user: { dbId: 7 }, params: {}, ...extra });

  it("lista só as minhas e devolve o total de não lidas", async () => {
    const items = [{ id: 2 }, { id: 1 }];
    prisma.notification.findMany.mockResolvedValue(items);
    prisma.notification.count.mockResolvedValue(2);
    const res = mockRes();

    await getNotifications(req(), res);

    expect(prisma.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 7 } })
    );
    expect(prisma.notification.count).toHaveBeenCalledWith({ where: { userId: 7, readAt: null } });
    expect(res.json).toHaveBeenCalledWith({ items, unreadCount: 2 });
  });

  it("marcar como lida só mexe numa notificação minha ainda não lida", async () => {
    prisma.notification.updateMany.mockResolvedValue({ count: 1 });
    const res = mockRes();

    await markAsRead(req({ params: { id: "9" } }), res);

    expect(prisma.notification.updateMany).toHaveBeenCalledWith({
      where: { id: 9, userId: 7, readAt: null },
      data: { readAt: expect.any(Date) },
    });
    expect(res.json).toHaveBeenCalledWith({ ok: true, updated: 1 });
  });

  it("id inválido devolve 400", async () => {
    const res = mockRes();
    await markAsRead(req({ params: { id: "abc" } }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(prisma.notification.updateMany).not.toHaveBeenCalled();
  });

  it("marcar tudo como lido só afeta as minhas", async () => {
    prisma.notification.updateMany.mockResolvedValue({ count: 3 });
    const res = mockRes();

    await markAllAsRead(req(), res);

    expect(prisma.notification.updateMany).toHaveBeenCalledWith({
      where: { userId: 7, readAt: null },
      data: { readAt: expect.any(Date) },
    });
    expect(res.json).toHaveBeenCalledWith({ ok: true, updated: 3 });
  });
});