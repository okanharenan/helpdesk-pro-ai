const { validate } = require("../src/middlewares/validate.middleware");
const { loginSchema } = require("../src/schemas/auth.schema");

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe("validate middleware — loginSchema", () => {
  it("bloqueia login sem e-mail válido", () => {
    const req = { body: { email: "não-é-email", password: "123456" } };
    const res = mockRes();
    const next = jest.fn();

    validate(loginSchema)(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it("libera login com dados válidos", () => {
    const req = { body: { email: "ana@empresa.com", password: "123456" } };
    const res = mockRes();
    const next = jest.fn();

    validate(loginSchema)(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});