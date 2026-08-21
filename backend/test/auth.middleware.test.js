jest.mock("jose", () => ({
  createRemoteJWKSet: jest.fn(() => "MOCK_JWKS"),
  jwtVerify: jest.fn(),
}));
jest.mock("../src/config/prisma", () => require("jest-mock-extended").mockDeep());

const { jwtVerify } = require("jose");
const prisma = require("../src/config/prisma");
const { protect } = require("../src/middlewares/auth.middleware");

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe("auth.middleware — protect", () => {
  beforeEach(() => jest.clearAllMocks());

  it("bloqueia requisição sem header Authorization", async () => {
    const req = { headers: {} };
    const res = mockRes();
    const next = jest.fn();

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("bloqueia token que não passa na verificação de assinatura", async () => {
    jwtVerify.mockRejectedValue(new Error("assinatura inválida"));
    const req = { headers: { authorization: "Bearer token-forjado" } };
    const res = mockRes();
    const next = jest.fn();

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("bloqueia usuário desativado mesmo com token válido", async () => {
    jwtVerify.mockResolvedValue({ payload: { email: "ex-funcionario@empresa.com" } });
    prisma.user.findUnique.mockResolvedValue({
      id: 1,
      email: "ex-funcionario@empresa.com",
      name: "Ex-funcionário",
      role: "AGENT",
      active: false,
    });

    const req = { headers: { authorization: "Bearer token-valido" } };
    const res = mockRes();
    const next = jest.fn();

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("libera acesso e popula req.user quando tudo está certo", async () => {
    jwtVerify.mockResolvedValue({ payload: { email: "ana@empresa.com", sub: "uuid-123" } });
    prisma.user.findUnique.mockResolvedValue({
      id: 5,
      email: "ana@empresa.com",
      name: "Ana",
      role: "ADMIN",
      active: true,
    });

    const req = { headers: { authorization: "Bearer token-valido" } };
    const res = mockRes();
    const next = jest.fn();

    await protect(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user.email).toBe("ana@empresa.com");
    expect(req.user.role).toBe("ADMIN");
  });
});