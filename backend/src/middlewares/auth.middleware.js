const { createRemoteJWKSet, jwtVerify } = require("jose");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const JWKS = createRemoteJWKSet(
  new URL(`${process.env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`)
);

const protect = async (req, res, next) => {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Não autorizado" });
    }

    const token = auth.split(" ")[1];

    let payload;
    try {
      const result = await jwtVerify(token, JWKS);
      payload = result.payload;
    } catch (err) {
      return res.status(401).json({ message: "Token inválido" });
    }

    if (!payload || !payload.email) {
      return res.status(401).json({ message: "Token inválido" });
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: payload.email },
      select: { id: true, email: true, name: true, role: true, active: true },
    });

    if (!dbUser) {
      return res.status(401).json({ message: "Usuário não encontrado" });
    }

    if (dbUser.active === false) {
      return res.status(403).json({ message: "Usuário desativado" });
    }

    req.user = {
      id: payload.sub,
      dbId: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role,
    };

    next();
  } catch (err) {
    console.error("[middleware] erro:", err.message);
    return res.status(401).json({ message: "Token inválido" });
  }
};

const requireRole =
  (...roles) =>
  (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: "Não autorizado" });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Sem permissão" });
    }
    next();
  };

module.exports = { protect, requireRole };