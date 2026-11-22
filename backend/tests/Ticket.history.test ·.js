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
const {
  createTicket,
  updateTicket,
  assignTicket,
  getTicketHistory,
} = require("../src/controllers/ticket.controller");

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

const reqFor = (email, extra = {}) => ({
  user: { email },
  params: { id: "10" },
  body: {},
  ...extra,
});

// Eventos gravados no histórico (createMany recebe { data: [...] } ou { data: {...} })
const recorded = () =>
  prisma.ticketHistory.createMany.mock.calls.flatMap(([arg]) =>
    Array.isArray(arg.data) ? arg.data : [arg.data]
  );

beforeEach(() => {
  mockReset(prisma);
  prisma.ticketHistory.createMany.mockResolvedValue({ count: 1 });
});

describe("histórico — criação", () => {
  it("registra CREATED e AUTO_ASSIGNED quando o ticket já nasce com responsável", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 4, role: "CLIENT" });
    prisma.permission.findUnique.mockResolvedValue({ canCreateTicket: true });
    prisma.user.findFirst.mockResolvedValue({ id: 1 });
    prisma.ticket.create.mockResolvedValue({
      id: 10,
      assigneeId: 1,
      assignee: { id: 1, name: "Super", role: "SUPERADMIN" },
    });

    await createTicket(
      { user: { email: "cliente@empresa.com" }, body: { title: "Impressora", description: "Não liga" } },
      mockRes()
    );

    expect(recorded()).toEqual([
      { ticketId: 10, actorId: 4, action: "CREATED" },
      { ticketId: 10, actorId: 4, action: "AUTO_ASSIGNED", toValue: "Super" },
    ]);
  });

  it("sem responsável, registra só CREATED", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 4, role: "CLIENT" });
    prisma.permission.findUnique.mockResolvedValue({ canCreateTicket: true });
    prisma.user.findFirst.mockResolvedValue(null);
    prisma.ticket.create.mockResolvedValue({ id: 11, assigneeId: null, assignee: null });

    await createTicket(
      { user: { email: "cliente@empresa.com" }, body: { title: "A", description: "B" } },
      mockRes()
    );

    expect(recorded()).toEqual([{ ticketId: 11, actorId: 4, action: "CREATED" }]);
  });
});

describe("histórico — status e prioridade", () => {
  const existing = {
    id: 10, userId: 4, assigneeId: 1, status: "OPEN", priority: "MEDIUM",
    title: "Impressora", description: "Não liga",
  };
  const updated = {
    ...existing,
    user: { id: 4, name: "Cliente", email: "cliente@empresa.com" },
    assignee: { id: 1, name: "Super", role: "SUPERADMIN" },
  };

  it("registra de → para quando o status muda", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 1, role: "SUPERADMIN" });
    prisma.ticket.findUnique.mockResolvedValue(existing);
    prisma.ticket.update.mockResolvedValue({ ...updated, status: "DOING" });

    await updateTicket(reqFor("super@empresa.com", { body: { status: "DOING" } }), mockRes());

    expect(recorded()).toEqual([
      { ticketId: 10, actorId: 1, action: "STATUS_CHANGED", fromValue: "OPEN", toValue: "DOING" },
    ]);
  });

  it("registra a mudança de prioridade", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 1, role: "SUPERADMIN" });
    prisma.ticket.findUnique.mockResolvedValue(existing);
    prisma.ticket.update.mockResolvedValue({ ...updated, priority: "HIGH" });

    await updateTicket(reqFor("super@empresa.com", { body: { priority: "HIGH" } }), mockRes());

    expect(recorded()).toEqual([
      { ticketId: 10, actorId: 1, action: "PRIORITY_CHANGED", fromValue: "MEDIUM", toValue: "HIGH" },
    ]);
  });

  it("não registra nada quando o valor enviado é igual ao atual", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 1, role: "SUPERADMIN" });
    prisma.ticket.findUnique.mockResolvedValue(existing);
    prisma.ticket.update.mockResolvedValue(updated);

    await updateTicket(reqFor("super@empresa.com", { body: { status: "OPEN" } }), mockRes());

    expect(prisma.ticketHistory.createMany).not.toHaveBeenCalled();
  });

  it("falha ao gravar histórico não derruba a atualização", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    prisma.user.findUnique.mockResolvedValue({ id: 1, role: "SUPERADMIN" });
    prisma.ticket.findUnique.mockResolvedValue(existing);
    prisma.ticket.update.mockResolvedValue({ ...updated, status: "DOING" });
    prisma.ticketHistory.createMany.mockRejectedValue(new Error("banco fora"));
    const res = mockRes();

    await updateTicket(reqFor("super@empresa.com", { body: { status: "DOING" } }), res);

    expect(res.json).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalledWith(500);
    console.error.mockRestore();
  });
});

describe("histórico — troca de responsável", () => {
  const existing = {
    id: 10, userId: 4, assigneeId: 1,
    assignee: { id: 1, name: "Super", role: "SUPERADMIN" },
  };

  it("registra REASSIGNED com o nome de quem saiu e de quem entrou", async () => {
    prisma.user.findUnique
      .mockResolvedValueOnce({ id: 2, role: "ADMIN" })
      .mockResolvedValueOnce({ id: 3, role: "AGENT", active: true });
    prisma.ticket.findUnique.mockResolvedValue(existing);
    prisma.ticket.update.mockResolvedValue({
      id: 10, assigneeId: 3, assignee: { id: 3, name: "Agente", role: "AGENT" },
    });

    await assignTicket(reqFor("admin@empresa.com", { body: { assigneeId: 3 } }), mockRes());

    expect(recorded()).toEqual([
      { ticketId: 10, actorId: 2, action: "REASSIGNED", fromValue: "Super", toValue: "Agente" },
    ]);
  });

  it("registra ASSIGNED quando o ticket estava sem responsável", async () => {
    prisma.user.findUnique
      .mockResolvedValueOnce({ id: 2, role: "ADMIN" })
      .mockResolvedValueOnce({ id: 3, role: "AGENT", active: true });
    prisma.ticket.findUnique.mockResolvedValue({ id: 10, userId: 4, assigneeId: null, assignee: null });
    prisma.ticket.update.mockResolvedValue({
      id: 10, assigneeId: 3, assignee: { id: 3, name: "Agente", role: "AGENT" },
    });

    await assignTicket(reqFor("admin@empresa.com", { body: { assigneeId: 3 } }), mockRes());

    expect(recorded()).toEqual([
      { ticketId: 10, actorId: 2, action: "ASSIGNED", fromValue: null, toValue: "Agente" },
    ]);
  });

  it("registra UNASSIGNED ao remover o responsável", async () => {
    prisma.user.findUnique.mockResolvedValueOnce({ id: 2, role: "ADMIN" });
    prisma.ticket.findUnique.mockResolvedValue(existing);
    prisma.ticket.update.mockResolvedValue({ id: 10, assigneeId: null, assignee: null });

    await assignTicket(reqFor("admin@empresa.com", { body: { assigneeId: null } }), mockRes());

    expect(recorded()).toEqual([
      { ticketId: 10, actorId: 2, action: "UNASSIGNED", fromValue: "Super", toValue: null },
    ]);
  });

  it("não registra nada se o responsável escolhido é o mesmo de antes", async () => {
    prisma.user.findUnique
      .mockResolvedValueOnce({ id: 2, role: "ADMIN" })
      .mockResolvedValueOnce({ id: 1, role: "SUPERADMIN", active: true });
    prisma.ticket.findUnique.mockResolvedValue(existing);
    prisma.ticket.update.mockResolvedValue({
      id: 10, assigneeId: 1, assignee: { id: 1, name: "Super", role: "SUPERADMIN" },
    });

    await assignTicket(reqFor("admin@empresa.com", { body: { assigneeId: 1 } }), mockRes());

    expect(prisma.ticketHistory.createMany).not.toHaveBeenCalled();
  });
});

describe("histórico — consulta (GET /tickets/:id/history)", () => {
  it("devolve a lista para quem pode ver o ticket", async () => {
    const lista = [{ id: 2, action: "STATUS_CHANGED" }, { id: 1, action: "CREATED" }];
    prisma.user.findUnique.mockResolvedValue({ id: 1, role: "SUPERADMIN" });
    prisma.ticket.findUnique.mockResolvedValue({ id: 10, userId: 4, assigneeId: 1 });
    prisma.ticketHistory.findMany.mockResolvedValue(lista);
    const res = mockRes();

    await getTicketHistory(reqFor("super@empresa.com"), res);

    expect(prisma.ticketHistory.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { ticketId: 10 } })
    );
    expect(res.json).toHaveBeenCalledWith(lista);
  });

  it("bloqueia (403) quem não é dono, responsável nem tem 'ver todos'", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 9, role: "CLIENT" });
    prisma.permission.findUnique.mockResolvedValue({ canViewAllTickets: false });
    prisma.ticket.findUnique.mockResolvedValue({ id: 10, userId: 4, assigneeId: 1 });
    const res = mockRes();

    await getTicketHistory(reqFor("outro@empresa.com"), res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(prisma.ticketHistory.findMany).not.toHaveBeenCalled();
  });

  it("404 quando o ticket não existe", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 1, role: "SUPERADMIN" });
    prisma.ticket.findUnique.mockResolvedValue(null);
    const res = mockRes();

    await getTicketHistory(reqFor("super@empresa.com"), res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});