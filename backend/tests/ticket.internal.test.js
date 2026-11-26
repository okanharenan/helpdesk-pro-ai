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
const cache = require("../src/helpers/cache");
const { getTicketById, getTickets, addComment } = require("../src/controllers/ticket.controller");
const { addCommentSchema } = require("../src/schemas/ticket.schema");

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

const author = { id: 1, name: "Super", role: "SUPERADMIN" };
const publicNote = { id: 1, body: "Já estamos verificando", internal: false, user: author };
const internalNote = { id: 2, body: "Cliente já abriu 3 chamados iguais", internal: true, user: author };

const ticket = {
  id: 10, userId: 4, assigneeId: 1, title: "Impressora",
  user: { id: 4, name: "Cliente", email: "c@x.com" },
  assignee: author,
  comments: [publicNote, internalNote],
};

const jsonOf = (res) => res.json.mock.calls[0][0];
const avisos = () => prisma.notification.create.mock.calls.map(([a]) => a.data);

beforeEach(() => {
  mockReset(prisma);
  cache.get.mockReset();
  cache.set.mockReset();
  prisma.notification.create.mockResolvedValue(undefined);
});

describe("notas internas — leitura do ticket", () => {
  it("o solicitante (CLIENT) não recebe as notas internas", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 4, role: "CLIENT" });
    prisma.permission.findUnique.mockResolvedValue({ canViewAllTickets: false });
    prisma.ticket.findUnique.mockResolvedValue(ticket);
    const res = mockRes();

    await getTicketById({ user: { email: "c@x.com" }, params: { id: "10" } }, res);

    expect(jsonOf(res).comments.map((c) => c.id)).toEqual([1]);
    expect(JSON.stringify(jsonOf(res))).not.toContain("3 chamados");
  });

  it("a equipe (AGENT) vê tudo", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 1, role: "AGENT" });
    prisma.permission.findUnique.mockResolvedValue({ canViewAllTickets: true });
    prisma.ticket.findUnique.mockResolvedValue(ticket);
    const res = mockRes();

    await getTicketById({ user: { email: "a@x.com" }, params: { id: "10" } }, res);

    expect(jsonOf(res).comments.map((c) => c.id)).toEqual([1, 2]);
  });

  it("o cache guarda o ticket completo, mas a resposta do cliente sai filtrada", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 4, role: "CLIENT" });
    prisma.permission.findUnique.mockResolvedValue({ canViewAllTickets: false });
    prisma.ticket.findUnique.mockResolvedValue(ticket);

    await getTicketById({ user: { email: "c@x.com" }, params: { id: "10" } }, mockRes());

    const guardado = cache.set.mock.calls[0][1];
    expect(guardado.comments).toHaveLength(2); // equipe ainda poderá ler do cache
  });

  it("vindo do CACHE, o cliente também não recebe as notas internas", async () => {
    cache.get.mockResolvedValue(ticket);
    prisma.user.findUnique.mockResolvedValue({ id: 4, role: "CLIENT" });
    prisma.permission.findUnique.mockResolvedValue({ canViewAllTickets: false });
    const res = mockRes();

    await getTicketById({ user: { email: "c@x.com" }, params: { id: "10" } }, res);

    expect(jsonOf(res).comments.map((c) => c.id)).toEqual([1]);
    expect(prisma.ticket.findUnique).not.toHaveBeenCalled();
  });

  it("filtrar para o cliente não altera o objeto que está no cache", async () => {
    const doCache = JSON.parse(JSON.stringify(ticket));
    cache.get.mockResolvedValue(doCache);
    prisma.user.findUnique.mockResolvedValue({ id: 4, role: "CLIENT" });
    prisma.permission.findUnique.mockResolvedValue({ canViewAllTickets: false });

    await getTicketById({ user: { email: "c@x.com" }, params: { id: "10" } }, mockRes());

    expect(doCache.comments).toHaveLength(2);
  });

  it("cache em formato texto (JSON) também é filtrado", async () => {
    cache.get.mockResolvedValue(JSON.stringify(ticket));
    prisma.user.findUnique.mockResolvedValue({ id: 4, role: "CLIENT" });
    prisma.permission.findUnique.mockResolvedValue({ canViewAllTickets: false });
    const res = mockRes();

    await getTicketById({ user: { email: "c@x.com" }, params: { id: "10" } }, res);

    expect(jsonOf(res).comments.map((c) => c.id)).toEqual([1]);
  });

  it("a contagem de comentários nas listas ignora as notas internas", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 4, role: "CLIENT" });
    prisma.permission.findUnique.mockResolvedValue({ canViewAllTickets: false });
    prisma.ticket.findMany.mockResolvedValue([]);
    prisma.ticket.count.mockResolvedValue(0);

    await getTickets({ user: { email: "c@x.com" }, query: {} }, mockRes());
    await getTickets({ user: { email: "c@x.com" }, query: { page: "1" } }, mockRes());

    const esperado = { select: { comments: { where: { internal: false } } } };
    for (const [arg] of prisma.ticket.findMany.mock.calls) {
      expect(arg.include._count).toEqual(esperado);
    }
    expect(prisma.ticket.findMany).toHaveBeenCalledTimes(2);
  });
});

describe("notas internas — criação", () => {
  const req = (user, body) => ({ user: { email: "x@x.com" }, params: { id: "10" }, body });

  it("a equipe cria nota interna e ela é gravada como interna", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 1, name: "Super", role: "SUPERADMIN" });
    prisma.ticket.findUnique.mockResolvedValue({ id: 10, userId: 4, assigneeId: 2 });
    prisma.user.findMany.mockResolvedValue([{ id: 2 }]);
    prisma.comment.create.mockResolvedValue({ id: 9, internal: true });
    const res = mockRes();

    await addComment(req(null, { body: "Atenção ao histórico", internal: true }), res);

    expect(prisma.comment.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: { body: "Atenção ao histórico", ticketId: 10, userId: 1, internal: true } })
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("o cliente NÃO consegue criar nota interna (403) e nada é gravado", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 4, name: "Cliente", role: "CLIENT" });
    prisma.permission.findUnique.mockResolvedValue({ canCommentAny: false });
    prisma.ticket.findUnique.mockResolvedValue({ id: 10, userId: 4, assigneeId: 1 });
    const res = mockRes();

    await addComment(req(null, { body: "tentando", internal: true }), res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(prisma.comment.create).not.toHaveBeenCalled();
    expect(prisma.notification.create).not.toHaveBeenCalled();
  });

  it("sem o campo internal, o comentário é público", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 4, name: "Cliente", role: "CLIENT" });
    prisma.permission.findUnique.mockResolvedValue({ canCommentAny: false });
    prisma.ticket.findUnique.mockResolvedValue({ id: 10, userId: 4, assigneeId: 1 });
    prisma.comment.create.mockResolvedValue({ id: 9, internal: false });

    await addComment(req(null, { body: "Oi" }), mockRes());

    expect(prisma.comment.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ internal: false }) })
    );
  });

  it("valores que não sejam exatamente true não viram nota interna", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 1, name: "Super", role: "SUPERADMIN" });
    prisma.ticket.findUnique.mockResolvedValue({ id: 10, userId: 4, assigneeId: 2 });
    prisma.comment.create.mockResolvedValue({ id: 9 });

    await addComment(req(null, { body: "x", internal: "true" }), mockRes());

    expect(prisma.comment.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ internal: false }) })
    );
  });
});

describe("notas internas — avisos", () => {
  const req = (body) => ({ user: { email: "x@x.com" }, params: { id: "10" }, body });

  it("o solicitante CLIENT não é avisado; o responsável da equipe é", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 1, name: "Super", role: "SUPERADMIN" });
    prisma.ticket.findUnique.mockResolvedValue({ id: 10, userId: 4, assigneeId: 2 });
    prisma.user.findMany.mockResolvedValue([{ id: 2 }]); // só o 2 é da equipe
    prisma.comment.create.mockResolvedValue({ id: 9 });

    await addComment(req({ body: "Segredo da equipe", internal: true }), mockRes());

    expect(prisma.user.findMany).toHaveBeenCalledWith({
      where: { id: { in: [4, 2] }, role: { not: "CLIENT" } },
      select: { id: true },
    });
    expect(avisos()).toEqual([
      expect.objectContaining({ userId: 2, title: "Nova nota interna no ticket #10" }),
    ]);
    expect(avisos().some((a) => a.userId === 4)).toBe(false);
  });

  it("se não der para confirmar quem é da equipe, ninguém é avisado", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 1, name: "Super", role: "SUPERADMIN" });
    prisma.ticket.findUnique.mockResolvedValue({ id: 10, userId: 4, assigneeId: 2 });
    prisma.user.findMany.mockResolvedValue(undefined);
    prisma.comment.create.mockResolvedValue({ id: 9 });

    await addComment(req({ body: "Segredo", internal: true }), mockRes());

    expect(prisma.notification.create).not.toHaveBeenCalled();
  });

  it("comentário público continua avisando o solicitante", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 1, name: "Super", role: "SUPERADMIN" });
    prisma.ticket.findUnique.mockResolvedValue({ id: 10, userId: 4, assigneeId: 1 });
    prisma.comment.create.mockResolvedValue({ id: 9 });

    await addComment(req({ body: "Resolvido!" }), mockRes());

    expect(avisos()).toEqual([
      expect.objectContaining({ userId: 4, title: "Novo comentário no ticket #10" }),
    ]);
    expect(prisma.user.findMany).not.toHaveBeenCalled();
  });
});

describe("notas internas — validação", () => {
  it("internal é opcional e vale false por padrão", () => {
    expect(addCommentSchema.parse({ body: "oi" })).toEqual({ body: "oi", internal: false });
    expect(addCommentSchema.parse({ body: "oi", internal: true }).internal).toBe(true);
  });

  it("recusa internal que não seja booleano", () => {
    expect(addCommentSchema.safeParse({ body: "oi", internal: "sim" }).success).toBe(false);
  });
});