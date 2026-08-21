jest.mock("../src/config/prisma", () => require("jest-mock-extended").mockDeep());
jest.mock("../src/helpers/cache", () => ({
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  invalidateTickets: jest.fn(),
  TTL: { tickets: 300, ticket: 300 },
}));

const prisma = require("../src/config/prisma");
const { updateTicket } = require("../src/controllers/ticket.controller");

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe("ticket.controller — updateTicket", () => {
  beforeEach(() => jest.clearAllMocks());

  it("bloqueia quem não é dono do ticket e não tem canViewAllTickets", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 2, role: "AGENT" });
    prisma.permission.findUnique.mockResolvedValue({
      canViewAllTickets: false,
      canChangeStatus: true,
    });
    prisma.ticket.findUnique.mockResolvedValue({ id: 10, userId: 999 });

    const req = {
      user: { email: "agente@empresa.com" },
      params: { id: "10" },
      body: { status: "DOING" },
    };
    const res = mockRes();

    await updateTicket(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(prisma.ticket.update).not.toHaveBeenCalled();
  });

  it("permite o dono editar o próprio ticket mesmo sem canViewAllTickets", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 2, role: "CLIENT" });
    prisma.permission.findUnique.mockResolvedValue({
      canViewAllTickets: false,
      canEditTicket: true,
    });
    prisma.ticket.findUnique.mockResolvedValue({ id: 10, userId: 2 });
    prisma.ticket.update.mockResolvedValue({ id: 10, title: "Impressora não liga" });

    const req = {
      user: { email: "cliente@empresa.com" },
      params: { id: "10" },
      body: { title: "Impressora não liga" },
    };
    const res = mockRes();

    await updateTicket(req, res);

    expect(prisma.ticket.update).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalled();
  });

  it("rejeita um status fora da lista permitida", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 1, role: "SUPERADMIN" });
    prisma.ticket.findUnique.mockResolvedValue({ id: 10, userId: 1 });

    const req = {
      user: { email: "admin@empresa.com" },
      params: { id: "10" },
      body: { status: "QUALQUER_COISA" },
    };
    const res = mockRes();

    await updateTicket(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(prisma.ticket.update).not.toHaveBeenCalled();
  });
});