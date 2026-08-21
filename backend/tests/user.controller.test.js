jest.mock("../src/config/prisma", () => require("jest-mock-extended").mockDeep());
jest.mock("../src/config/supabase", () => ({
  supabase: {},
  supabaseAdmin: {
    auth: {
      admin: {
        createUser: jest.fn(),
        deleteUser: jest.fn(),
        listUsers: jest.fn(),
      },
    },
  },
}));
jest.mock("../src/helpers/cache", () => ({
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  TTL: { users: 600 },
}));

const prisma = require("../src/config/prisma");
const { updateUser } = require("../src/controllers/user.controller");

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe("user.controller — updateUser", () => {
  beforeEach(() => jest.clearAllMocks());

  it("salva o campo active ao desativar um usuário", async () => {
    prisma.user.findUnique
      .mockResolvedValueOnce({ id: 1, email: "admin@empresa.com", role: "SUPERADMIN" })
      .mockResolvedValueOnce({ id: 8, email: "func@empresa.com", role: "AGENT" });
    prisma.user.update.mockResolvedValue({ id: 8, active: false });

    const req = {
      user: { email: "admin@empresa.com" },
      params: { id: "8" },
      body: { active: false },
    };
    const res = mockRes();

    await updateUser(req, res);

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ active: false }),
      })
    );
  });

  it("não permite editar o SUPERADMIN", async () => {
    prisma.user.findUnique
      .mockResolvedValueOnce({ id: 1, email: "admin@empresa.com", role: "SUPERADMIN" })
      .mockResolvedValueOnce({ id: 2, email: "outro-admin@empresa.com", role: "SUPERADMIN" });

    const req = {
      user: { email: "admin@empresa.com" },
      params: { id: "2" },
      body: { active: false },
    };
    const res = mockRes();

    await updateUser(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
});