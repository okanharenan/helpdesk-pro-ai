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

const prisma = require("../src/config/prisma");
const { sendStatusChangeEmail } = require("../src/helpers/email");
const { takeTicket, assignTicket, createTicket } = require("../src/controllers/ticket.controller");

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

describe("ticket.controller — takeTicket (iniciar chamado)", () => {
  beforeEach(() => jest.clearAllMocks());

  it("bloqueia CLIENT", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 4, role: "CLIENT" });
    const res = mockRes();

    await takeTicket(reqFor("cliente@empresa.com"), res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(prisma.ticket.updateMany).not.toHaveBeenCalled();
  });

  it("agente assume ticket aberto sem responsável: vira responsável e status DOING", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 2, role: "AGENT" });
    prisma.permission.findUnique.mockResolvedValue({ canViewAllTickets: true });
    prisma.ticket.findUnique
      .mockResolvedValueOnce({ id: 10, userId: 4, assigneeId: null, status: "OPEN" })
      .mockResolvedValueOnce({
        id: 10, userId: 4, assigneeId: 2, status: "DOING", title: "Teste",
        user: { id: 4, name: "Cliente", email: "cliente@empresa.com" },
        assignee: { id: 2, name: "Agente", role: "AGENT" },
      });
    prisma.ticket.updateMany.mockResolvedValue({ count: 1 });
    const res = mockRes();

    await takeTicket(reqFor("agente@empresa.com"), res);

    expect(prisma.ticket.updateMany).toHaveBeenCalledWith({
      where: { id: 10, assigneeId: null, status: "OPEN" },
      data: { assigneeId: 2, status: "DOING" },
    });
    expect(sendStatusChangeEmail).toHaveBeenCalledWith(
      expect.objectContaining({ oldStatus: "OPEN", newStatus: "DOING" })
    );
    expect(res.json).toHaveBeenCalled();
  });

  it("devolve 409 quando outra pessoa assumiu primeiro (corrida)", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 2, role: "AGENT" });
    prisma.permission.findUnique.mockResolvedValue({ canViewAllTickets: true });
    prisma.ticket.findUnique.mockResolvedValue({ id: 10, userId: 4, assigneeId: null, status: "OPEN" });
    prisma.ticket.updateMany.mockResolvedValue({ count: 0 });
    const res = mockRes();

    await takeTicket(reqFor("agente@empresa.com"), res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(sendStatusChangeEmail).not.toHaveBeenCalled();
  });

  it("não deixa assumir ticket que já tem responsável", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 2, role: "AGENT" });
    prisma.permission.findUnique.mockResolvedValue({ canViewAllTickets: true });
    prisma.ticket.findUnique.mockResolvedValue({ id: 10, userId: 4, assigneeId: 3, status: "DOING" });
    const res = mockRes();

    await takeTicket(reqFor("agente@empresa.com"), res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(prisma.ticket.updateMany).not.toHaveBeenCalled();
  });
});

describe("ticket.controller — assignTicket (trocar responsável)", () => {
  beforeEach(() => jest.clearAllMocks());

  it("AGENT e CLIENT não podem trocar o responsável", async () => {
    for (const role of ["AGENT", "CLIENT"]) {
      jest.clearAllMocks();
      prisma.user.findUnique.mockResolvedValue({ id: 2, role });
      const res = mockRes();

      await assignTicket(reqFor("x@empresa.com", { body: { assigneeId: 3 } }), res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(prisma.ticket.update).not.toHaveBeenCalled();
    }
  });

  it("ADMIN também pode trocar o responsável", async () => {
    prisma.user.findUnique
      .mockResolvedValueOnce({ id: 2, role: "ADMIN" })
      .mockResolvedValueOnce({ id: 3, role: "AGENT", active: true });
    prisma.ticket.findUnique.mockResolvedValue({ id: 10, userId: 4, assigneeId: 1 });
    prisma.ticket.update.mockResolvedValue({ id: 10, assigneeId: 3 });
    const res = mockRes();

    await assignTicket(reqFor("admin@empresa.com", { body: { assigneeId: 3 } }), res);

    expect(prisma.ticket.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { assigneeId: 3 } })
    );
    expect(res.status).not.toHaveBeenCalledWith(403);
  });

  it("recusa atribuir a um CLIENT", async () => {
    prisma.user.findUnique
      .mockResolvedValueOnce({ id: 1, role: "SUPERADMIN" })
      .mockResolvedValueOnce({ id: 4, role: "CLIENT", active: true });
    prisma.ticket.findUnique.mockResolvedValue({ id: 10, userId: 4, assigneeId: null });
    const res = mockRes();

    await assignTicket(reqFor("super@empresa.com", { body: { assigneeId: 4 } }), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(prisma.ticket.update).not.toHaveBeenCalled();
  });

  it("SUPERADMIN troca o responsável", async () => {
    prisma.user.findUnique
      .mockResolvedValueOnce({ id: 1, role: "SUPERADMIN" })
      .mockResolvedValueOnce({ id: 3, role: "AGENT", active: true });
    prisma.ticket.findUnique.mockResolvedValue({ id: 10, userId: 4, assigneeId: 2 });
    prisma.ticket.update.mockResolvedValue({ id: 10, assigneeId: 3 });
    const res = mockRes();

    await assignTicket(reqFor("super@empresa.com", { body: { assigneeId: 3 } }), res);

    expect(prisma.ticket.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { assigneeId: 3 } })
    );
  });

  it("SUPERADMIN deixa o ticket sem responsável (null)", async () => {
    prisma.user.findUnique.mockResolvedValueOnce({ id: 1, role: "SUPERADMIN" });
    prisma.ticket.findUnique.mockResolvedValue({ id: 10, userId: 4, assigneeId: 2 });
    prisma.ticket.update.mockResolvedValue({ id: 10, assigneeId: null });
    const res = mockRes();

    await assignTicket(reqFor("super@empresa.com", { body: { assigneeId: null } }), res);

    expect(prisma.ticket.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { assigneeId: null } })
    );
  });
});

describe("ticket.controller — createTicket (responsável automático)", () => {
  beforeEach(() => jest.clearAllMocks());

  const body = { title: "Impressora", description: "Não liga", priority: "MEDIUM" };

  it("ticket aberto por cliente já nasce atribuído ao SUPERADMIN", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 4, role: "CLIENT" });
    prisma.permission.findUnique.mockResolvedValue({ canCreateTicket: true });
    prisma.user.findFirst.mockResolvedValue({ id: 1 });
    prisma.ticket.create.mockResolvedValue({ id: 10, assigneeId: 1 });
    const res = mockRes();

    await createTicket({ user: { email: "cliente@empresa.com" }, body }, res);

    expect(prisma.user.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { role: "SUPERADMIN", active: true } })
    );
    expect(prisma.ticket.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: 4, assigneeId: 1 }),
      })
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("se o SUPERADMIN abre o ticket, ele mesmo é o responsável", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 1, role: "SUPERADMIN" });
    prisma.ticket.create.mockResolvedValue({ id: 11, assigneeId: 1 });
    const res = mockRes();

    await createTicket({ user: { email: "super@empresa.com" }, body }, res);

    expect(prisma.user.findFirst).not.toHaveBeenCalled();
    expect(prisma.ticket.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: 1, assigneeId: 1 }),
      })
    );
  });

  it("sem SUPERADMIN ativo, o ticket é criado sem responsável (sem quebrar)", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 4, role: "CLIENT" });
    prisma.permission.findUnique.mockResolvedValue({ canCreateTicket: true });
    prisma.user.findFirst.mockResolvedValue(null);
    prisma.ticket.create.mockResolvedValue({ id: 12, assigneeId: null });
    const res = mockRes();

    await createTicket({ user: { email: "cliente@empresa.com" }, body }, res);

    expect(prisma.ticket.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ assigneeId: null }),
      })
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });
});